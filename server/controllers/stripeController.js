const axios = require("axios");
const db = require("../config/db.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");

exports.createCheckoutSession = async (req, res) => {
  let connection;
  try {
    const {
      plan,
      priceID,
      paymentMethods,
      billingCycle,
      price,
      customerEmail,
      customerName,
    } = req.body;

    if (!plan || !paymentMethods || !billingCycle || !price) {
      return res
        .status(400)
        .json({ error: "Missing required fields in request body" });
    }

    // Get user info from token
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const userName = req.user?.name;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const finalCustomerEmail = customerEmail || userEmail;
    const finalCustomerName = customerName || userName;

    let stripePriceId = priceID;
    let productData = {};

    // 🔹 STEP 1: If no priceID provided, find or create the appropriate recurring price
    if (!stripePriceId) {
      // Search for existing recurring prices for this plan
      const searchParams = new URLSearchParams({
        query: `active:'true' AND metadata['plan_name']:'${plan}' AND recurring interval:'${billingCycle === 'yearly' ? 'year' : 'month'}'`,
        limit: '1'
      });

      const searchResponse = await axios.get(
        `${process.env.STRIPE_URL}/prices/search?${searchParams}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          },
        }
      );

      if (searchResponse.data.data.length > 0) {
        // Use existing recurring price
        stripePriceId = searchResponse.data.data[0].id;
      } else {
        // Create a new recurring price

        // First, find or create the product
        const productSearchParams = new URLSearchParams({
          query: `active:'true' AND metadata['plan_name']:'${plan}'`,
          limit: '1'
        });

        const productSearchResponse = await axios.get(
          `${process.env.STRIPE_URL}/products/search?${productSearchParams}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            },
          }
        );

        let productId;
        if (productSearchResponse.data.data.length > 0) {
          productId = productSearchResponse.data.data[0].id;
        } else {
          // Create new product
          const productParams = new URLSearchParams();
          productParams.append("name", plan);
          productParams.append("description", `${plan} Plan`);
          productParams.append("metadata[plan_name]", plan);

          const productResponse = await axios.post(
            `${process.env.STRIPE_URL}/products`,
            productParams,
            {
              headers: {
                Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );
          productId = productResponse.data.id;
        }

        // Create recurring price
        const priceParams = new URLSearchParams();
        priceParams.append("product", productId);
        priceParams.append("unit_amount", Math.round(price * 100)); // Convert to cents
        priceParams.append("currency", "usd");
        priceParams.append("recurring[interval]", billingCycle === 'yearly' ? 'year' : 'month');
        priceParams.append("metadata[plan_name]", plan);
        priceParams.append("metadata[billing_cycle]", billingCycle);

        const priceResponse = await axios.post(
          `${process.env.STRIPE_URL}/prices`,
          priceParams,
          {
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        stripePriceId = priceResponse.data.id;
      }
    }

    // 🔹 STEP 2: Verify the price is a recurring price
    try {
      const priceRes = await axios.get(
        `${process.env.STRIPE_URL}/prices/${stripePriceId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          },
        }
      );

      const priceData = priceRes.data;

      // Check if this is a recurring price
      if (priceData.type !== 'recurring') {
        return res.status(400).json({
          error: "Invalid price type for subscription",
          details: "The provided price is not a recurring price. Please use a subscription price."
        });
      }

      const productId = priceData.product;
      const productRes = await axios.get(
        `${process.env.STRIPE_URL}/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          },
        }
      );

      productData = productRes.data;

    } catch (stripeError) {
      return res.status(500).json({
        error: "Failed to fetch Stripe product details",
        details: stripeError.response?.data || stripeError.message,
      });
    }

    // 🔹 STEP 3: Create or reuse a Stripe customer
    let customerId;
    try {
      const params = new URLSearchParams();
      if (finalCustomerEmail) params.append("email", finalCustomerEmail);
      if (finalCustomerName) params.append("name", finalCustomerName);
      params.append("metadata[user_id]", userId.toString());
      params.append("metadata[plan_name]", plan);

      const customerResponse = await axios.post(
        `${process.env.STRIPE_URL}/customers`,
        params,
        {
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      customerId = customerResponse.data.id;
    } catch (customerError) {
      return res.status(500).json({
        error: "Failed to create Stripe customer",
        details: customerError.response?.data || customerError.message,
      });
    }

    // 🔹 STEP 4: Create checkout session with the recurring price
    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append(
      "success_url",
      `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`
    );
    params.append("cancel_url", `${process.env.FRONTEND_URL}/failure`);
    params.append("customer", customerId);
    params.append("line_items[0][price]", stripePriceId);
    params.append("line_items[0][quantity]", "1");



    params.append("metadata[user_id]", userId);
    params.append("metadata[plan_name]", plan);
    params.append("subscription_data[metadata][user_id]", userId);
    params.append("subscription_data[metadata][plan_name]", plan);
    params.append("customer_update[address]", "auto");

    (paymentMethods.length > 0 ? paymentMethods : ["card"]).forEach(
      (pm, idx) => {
        params.append(`payment_method_types[${idx}]`, pm);
      }
    );

    const response = await axios.post(
      `${process.env.STRIPE_URL}/checkout/sessions`,
      params,
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const session = response.data;

    // 🔹 STEP 5: Save initial payment session to DB (status will be updated by webhook)
    connection = await db.getConnection();
    const safeValue = (v) => (v === undefined ? null : v);

    await connection.execute(
      `INSERT INTO stripe_payments (
        stripe_session_id,
        plan_name,
        billing_cycle,
        amount,
        currency,
        payment_status,
        customer_email,
        customer_name,
        payment_method_types,
        user_id,
        stripe_customer_id,
        stripe_price_id,
        stripe_product_id,
        product_name,
        product_description,
        product_features,
        product_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        safeValue(session.id),
        safeValue(plan),
        safeValue(billingCycle),
        safeValue(price),
        "usd",
        "pending", // Initial status, will be updated by webhook
        safeValue(finalCustomerEmail),
        safeValue(finalCustomerName),
        JSON.stringify(paymentMethods || []),
        safeValue(userId),
        safeValue(customerId),
        safeValue(stripePriceId),
        safeValue(productData.id),
        safeValue(productData.name),
        safeValue(productData.description),
        JSON.stringify(productData.marketing_features || []),
        productData.images?.[0] || null,
      ]
    );

    connection.release();

    res.json({
      url: session.url,
      sessionId: session.id,
      product: {
        name: productData.name,
        description: productData.description,
        features: productData.marketing_features,
        image: productData.images?.[0] || null,
      },
    });
  } catch (error) {
    if (connection) connection.release();
    console.error("Stripe error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to create checkout session",
      details: error.response?.data || error.message,
    });
  }
};

exports.createRechargeSession = async (req, res) => {
  let connection;
  try {
    const { amount, minutes, type } = req.body;

    if (!amount || amount < 5) {
      return res.status(400).json({
        error: "Invalid recharge amount",
        details: "Minimum recharge amount is $5"
      });
    }

    // Get user info from token
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const userName = req.user?.name;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // 🔹 STEP 1: Create or reuse a Stripe customer
    let customerId;
    try {
      const customerParams = new URLSearchParams();
      if (userEmail) customerParams.append("email", userEmail);
      if (userName) customerParams.append("name", userName);
      customerParams.append("metadata[user_id]", userId.toString());

      const customerResponse = await axios.post(
        `${process.env.STRIPE_URL}/customers`,
        customerParams,
        {
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      customerId = customerResponse.data.id;
    } catch (customerError) {
      return res.status(500).json({
        error: "Failed to create Stripe customer",
        details: customerError.response?.data || customerError.message,
      });
    }

    // 🔹 STEP 2: Create one-time payment checkout session
    const params = new URLSearchParams();
    params.append("mode", "payment"); // One-time payment, not subscription
    params.append(
      "success_url",
      `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`
    );
    params.append("cancel_url", `${process.env.FRONTEND_URL}/recharge`);
    params.append("customer", customerId);

    // Line item for minutes recharge
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][product_data][name]", `Minutes Recharge - ${minutes} minutes`);
    params.append("line_items[0][price_data][product_data][description]", `Top-up ${minutes} minutes to your account`);
    params.append("line_items[0][price_data][unit_amount]", Math.round(amount * 100)); // Convert to cents
    params.append("line_items[0][quantity]", "1");

    params.append("metadata[user_id]", userId);
    params.append("metadata[type]", "recharge");
    params.append("metadata[minutes]", minutes.toString());
    params.append("metadata[amount]", amount.toString());
    params.append("customer_update[address]", "auto");
    params.append("metadata[session_id]", "temp");

    // Add payment method types
    params.append("payment_method_types[0]", "card");

    const response = await axios.post(
      `${process.env.STRIPE_URL}/checkout/sessions`,
      params,
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const session = response.data;

    // 🔹 STEP 3: Save recharge session to DB
    connection = await db.getConnection();
    const safeValue = (v) => (v === undefined ? null : v);

    await connection.execute(
      `INSERT INTO stripe_payments (
        stripe_session_id,
        plan_name,
        billing_cycle,
        amount,
        currency,
        payment_status,
        customer_email,
        customer_name,
        payment_method_types,
        user_id,
        stripe_customer_id,
        type,
        metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        safeValue(session.id),
        'Minutes Recharge',
        'one_time', // One-time payment, not recurring
        safeValue(amount),
        "usd",
        "pending", // Initial status, will be updated by webhook
        safeValue(userEmail),
        safeValue(userName),
        JSON.stringify(['card']),
        safeValue(userId),
        safeValue(customerId),
        'recharge', // Type to distinguish from subscriptions
        JSON.stringify({
          minutes: minutes,
          original_amount: amount,
          rate: 0.01 // $0.01 per minute
        })
      ]
    );



    // Release connection and send response
    connection.release();

    res.json({
      url: session.url,
      sessionId: session.id,
      type: "recharge",
      amount: amount,
      minutes: minutes
    });


  } catch (error) {
    if (connection) connection.release();
    console.error("Recharge session error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to create recharge session",
      details: error.response?.data || error.message,
    });
  }
};


exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log(`✅ Webhook received: ${event.type}`);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  let connection;
  try {
    connection = await db.getConnection();

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object, connection);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object, connection);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        console.log(`📦 Subscription event received: ${event.type}`);
        await handleSubscriptionUpdated(event.data.object, connection);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object, connection);
        break;

      default:
        console.log(`⚡ Unhandled event type: ${event.type}`);
    }


    connection.release();
    return res.status(200).json({ received: true });
  } catch (error) {
    if (connection) connection.release();
    console.error("❌ Webhook handler error:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
};


// async function handleCheckoutSessionCompleted(session, connection) {
//   const safeValue = (v) => (v === undefined ? null : v);
//   console.log(`🔄 Processing session: ${session.id}, mode: ${session.mode}`);

//   try {
//     const paymentStatus = safeValue(session.payment_status);

//     // Atomic: only update if it wasn't paid already
//     const [updateResult] = await connection.execute(
//       `UPDATE stripe_payments
//        SET payment_status = ?, updated_at = CURRENT_TIMESTAMP
//        WHERE stripe_session_id = ? AND payment_status <> 'paid'`,
//       [paymentStatus, session.id]
//     );

//     // If this update didn't change a row, someone already processed it
//     if (updateResult.affectedRows === 0) {
//       console.log(`⚠️ Session ${session.id} already processed. Skipping...`);
//       return;
//     }

//     // Fetch stripe_payment_id now and pass along to avoid NULLs later
//     const [rows] = await connection.execute(
//       `SELECT id FROM stripe_payments WHERE stripe_session_id = ? LIMIT 1`,
//       [session.id]
//     );
//     const stripePaymentId = rows?.[0]?.id || null;

//     if (session.mode === "subscription" && session.subscription) {
//       await handleSubscriptionSession(session, connection, paymentStatus);
//     } else if (session.mode === "payment") {
//       // Attach ids for de-dupe downstream
//       session.metadata = {
//         ...(session.metadata || {}),
//         session_id: session.id,
//         stripe_payment_id: stripePaymentId,
//       };
//       await handleOneTimePaymentSession(session, connection, paymentStatus);
//     }

//     console.log(`🎯 Completed session handling for ${session.id}`);
//   } catch (error) {
//     console.error("❌ Error in handleCheckoutSessionCompleted:", error);
//     throw error;
//   }
// }


async function handleCheckoutSessionCompleted(session, connection) {
  const safeValue = (v) => (v === undefined ? null : v);
  console.log(`🔄 Processing session: ${session.id}, mode: ${session.mode}`);

  try {
    const paymentStatus = safeValue(session.payment_status);

    // Atomic: only update if it wasn't paid already
    const [updateResult] = await connection.execute(
      `UPDATE stripe_payments
       SET payment_status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE stripe_session_id = ? AND payment_status <> 'paid'`,
      [paymentStatus, session.id]
    );

    // If this update didn't change a row, someone already processed it
    if (updateResult.affectedRows === 0) {
      console.log(`⚠️ Session ${session.id} already processed. Skipping...`);
      return;
    }

    // Fetch stripe_payment_id now and pass along to avoid NULLs later
    const [rows] = await connection.execute(
      `SELECT id FROM stripe_payments WHERE stripe_session_id = ? LIMIT 1`,
      [session.id]
    );
    const stripePaymentId = rows?.[0]?.id || null;

    // Handle subscription or one-time payment
    if (session.mode === "subscription" && session.subscription) {
      await handleSubscriptionSession(session, connection, paymentStatus);
    } else if (session.mode === "payment") {
      // Attach ids for de-dupe downstream
      session.metadata = {
        ...(session.metadata || {}),
        session_id: session.id,
        stripe_payment_id: stripePaymentId,
      };
      await handleOneTimePaymentSession(session, connection, paymentStatus);

      // ✅ NEW: Save Stripe receipt URL for one-time (payment) sessions
      if (paymentStatus === "paid") {
        try {
          // Get Payment Intent to find Charge
          const paymentIntent = await stripe.paymentIntents.retrieve(
            session.payment_intent,
            { expand: ["charges"] }
          );
          const charge = paymentIntent.charges?.data?.[0];
          const receiptUrl = charge?.receipt_url || null;

          if (receiptUrl) {
            await connection.execute(
              `UPDATE stripe_payments 
               SET receipt_url = ?, updated_at = CURRENT_TIMESTAMP 
               WHERE stripe_session_id = ?`,
              [receiptUrl, session.id]
            );
            console.log(`✅ Saved Stripe receipt URL for session: ${session.id}`);
          } else {
            console.warn(`⚠️ No receipt URL found for session: ${session.id}`);
          }
        } catch (err) {
          console.error("⚠️ Failed to fetch Stripe receipt URL:", err.message);
        }
      }
    }

    console.log(`🎯 Completed session handling for ${session.id}`);
  } catch (error) {
    console.error("❌ Error in handleCheckoutSessionCompleted:", error);
    throw error;
  }
}



async function handleOneTimePaymentSession(session, connection, paymentStatus) {
  console.log(`💰 Processing one-time payment session: ${session.id}`);

  // If payment is successful and this is a recharge, add minutes to user's account
  if (paymentStatus === 'paid' && session.metadata && session.metadata.type === 'recharge') {
    console.log(`🔋 Adding recharge minutes for user: ${session.metadata.user_id}`);
    await addRechargeMinutes(session.metadata.user_id, session.metadata, connection);
  }
}

async function handleSubscriptionSession(session, connection, paymentStatus) {
  const safeValue = (v) => (v === undefined ? null : v);
  console.log(`📦 Processing subscription session: ${session.id}`);

  // Get subscription details from Stripe
  const subscriptionResponse = await axios.get(
    `${process.env.STRIPE_URL}/subscriptions/${session.subscription}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
    }
  );

  const subscriptionData = subscriptionResponse.data;
  const subscriptionId = safeValue(session.subscription);
  const subscriptionStatus = safeValue(subscriptionData.status);

  let currentPeriodStart = safeValue(subscriptionData.current_period_start);
  let currentPeriodEnd = safeValue(subscriptionData.current_period_end);

  // 🔹 If period missing, fallback to created_at + billing_cycle
  if (!currentPeriodStart || !currentPeriodEnd) {
    console.log("⚠️ Missing current period dates — calculating manually...");

    const [paymentRow] = await connection.execute(
      `SELECT billing_cycle, created_at FROM stripe_payments WHERE stripe_session_id = ? LIMIT 1`,
      [session.id]
    );

    if (paymentRow.length > 0) {
      const createdAt = new Date(paymentRow[0].created_at);
      const billingCycle = paymentRow[0].billing_cycle;

      currentPeriodStart = Math.floor(createdAt.getTime() / 1000);

      const endDate = new Date(createdAt);
      if (billingCycle === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
      currentPeriodEnd = Math.floor(endDate.getTime() / 1000);

      console.log(`🧮 Manually set current_period_start=${createdAt}, current_period_end=${endDate}`);
    }
  }

  // Update payment record
  const [updateResult] = await connection.execute(
    `UPDATE stripe_payments 
     SET payment_status = ?,
         stripe_subscription_id = ?,
         subscription_status = ?,
         current_period_start = FROM_UNIXTIME(?),
         current_period_end = FROM_UNIXTIME(?),
         updated_at = CURRENT_TIMESTAMP
     WHERE stripe_session_id = ?`,
    [
      paymentStatus,
      subscriptionId,
      subscriptionStatus,
      currentPeriodStart,
      currentPeriodEnd,
      session.id
    ]
  );

  console.log(`✅ Subscription updated for session: ${session.id}, rows affected: ${updateResult.affectedRows}`);

  if (session.metadata && session.metadata.user_id && session.metadata.plan_name) {
    await updateUserSubscriptionDetails(session.metadata.user_id, session.metadata.plan_name, connection);
  } else {
    console.warn('⚠️ No user_id or plan_name in session metadata');
  }
}


async function handleInvoicePaymentSucceeded(invoice, connection) {
  const safeValue = (v) => (v === undefined ? null : v);

  console.log(`🔄 Processing invoice: ${invoice.id}, subscription: ${invoice.subscription}`);

  let subscriptionId = safeValue(invoice.subscription);

  // ✅ If invoice has no subscription, fetch using customer
  if (!subscriptionId && invoice.customer) {
    console.log("⚠️ Invoice missing subscription, fetching customer subscriptions...");
    const customerSubs = await stripe.subscriptions.list({ customer: invoice.customer, limit: 1 });
    if (customerSubs.data.length > 0) {
      subscriptionId = customerSubs.data[0].id;
      console.log(`✅ Found subscription via customer: ${subscriptionId}`);
    }
  }

  if (!subscriptionId) {
    console.warn(`⚠️ Still no subscription found for invoice: ${invoice.id}`);
    return;
  }

  const invoiceId = safeValue(invoice.id);
  const invoiceNumber = safeValue(invoice.number);
  const invoicePdf = safeValue(invoice.invoice_pdf);
  const customerId = safeValue(invoice.customer);

  console.log(`📊 Invoice update values:`, {
    invoiceId,
    invoiceNumber,
    invoicePdf,
    subscriptionId,
    customerId
  });

  // ✅ Try updating by subscription_id first
  const [updateBySub] = await connection.execute(
    `UPDATE stripe_payments 
     SET stripe_invoice_id = ?,
         invoice_number = ?,
         invoice_pdf = ?,
         payment_status = 'paid',
         updated_at = CURRENT_TIMESTAMP
     WHERE stripe_subscription_id = ?
     ORDER BY created_at DESC 
     LIMIT 1`,
    [invoiceId, invoiceNumber, invoicePdf, subscriptionId]
  );

  if (updateBySub.affectedRows === 0) {
    // ✅ If subscription row not found yet, fallback to updating by customer_id
    console.log("⚠️ No row matched subscription_id, updating by customer_id instead...");
    const [updateByCustomer] = await connection.execute(
      `UPDATE stripe_payments 
       SET stripe_invoice_id = ?,
           invoice_number = ?,
           invoice_pdf = ?,
           stripe_subscription_id = ?,
           payment_status = 'paid',
           updated_at = CURRENT_TIMESTAMP
       WHERE stripe_customer_id = ?
       ORDER BY created_at DESC 
       LIMIT 1`,
      [invoiceId, invoiceNumber, invoicePdf, subscriptionId, customerId]
    );
    await stripe.invoices.update(invoice.id, {
      footer: "Thank you for subscribing to QuantumHash — your trusted AI meeting assistant!",
      custom_fields: [
        { name: "Customer ID", value: `User-${invoice.customer}` },
        { name: "Plan", value: invoice.lines.data[0]?.description || "N/A" },
      ],
    });

    console.log(`✅ Invoice updated by customer_id, rows affected: ${updateByCustomer.affectedRows}`);
  } else {
    console.log(`✅ Invoice updated for subscription: ${subscriptionId}, rows affected: ${updateBySub.affectedRows}`);
  }
}

async function handleSubscriptionUpdated(subscription, connection) {
  const safeValue = (v) => (v === undefined ? null : v);

  const subscriptionId = safeValue(subscription.id);
  const subscriptionStatus = safeValue(subscription.status);
  const customerId = safeValue(subscription.customer);

  let currentPeriodStart = safeValue(subscription.current_period_start);
  let currentPeriodEnd = safeValue(subscription.current_period_end);

  // 🔹 If missing period fields, calculate manually using created_at + billing_cycle
  if (!currentPeriodStart || !currentPeriodEnd) {
    console.log("⚠️ Missing period fields — calculating manually...");
    const [paymentRow] = await connection.execute(
      `SELECT created_at, billing_cycle FROM stripe_payments WHERE stripe_customer_id = ? ORDER BY created_at DESC LIMIT 1`,
      [customerId]
    );

    if (paymentRow.length > 0) {
      const createdAt = new Date(paymentRow[0].created_at);
      const billingCycle = paymentRow[0].billing_cycle;

      currentPeriodStart = Math.floor(createdAt.getTime() / 1000);

      const endDate = new Date(createdAt);
      if (billingCycle === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
      currentPeriodEnd = Math.floor(endDate.getTime() / 1000);

      console.log(`🧮 Manually set current_period_start=${createdAt}, current_period_end=${endDate}`);
    } else {
      console.warn("⚠️ No matching payment record found to calculate manually.");
    }
  }

  // Update the row
  const [update] = await connection.execute(
    `UPDATE stripe_payments
     SET subscription_status = ?,
         current_period_start = FROM_UNIXTIME(?),
         current_period_end = FROM_UNIXTIME(?),
         updated_at = CURRENT_TIMESTAMP
     WHERE stripe_subscription_id = ? OR stripe_customer_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [
      subscriptionStatus,
      currentPeriodStart,
      currentPeriodEnd,
      subscriptionId,
      customerId
    ]
  );

  if (update.affectedRows > 0) {
    console.log(`✅ Subscription period updated successfully (${update.affectedRows} row)`);
  } else {
    console.warn(`⚠️ No rows updated for subscription ${subscriptionId}`);
  }
}



async function handleSubscriptionDeleted(subscription, connection) {
  const subscriptionId = safeValue(subscription.id);

  await connection.execute(
    `UPDATE stripe_payments 
     SET subscription_status = 'canceled',
         updated_at = CURRENT_TIMESTAMP
     WHERE stripe_subscription_id = ?`,
    [subscriptionId]
  );
  console.log(`✅ Subscription deleted: ${subscriptionId}`);

  // Downgrade user to free plan
  if (subscription.metadata && subscription.metadata.user_id) {
    await downgradeToFreePlan(subscription.metadata.user_id, connection);
  }
}

// 🔹 HELPER FUNCTIONS
async function updateUserSubscriptionDetails(userId, planName, connection) {
  const planMinutesMap = {
    Professional: 900,
    "Professional Plus": 2000,
    Business: 4500,
    "Business Plus": 7000,
  };

  // Get the latest payment record for this user
  const [payments] = await connection.execute(
    `SELECT * FROM stripe_payments 
     WHERE user_id = ? AND stripe_subscription_id IS NOT NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (payments.length === 0) return;

  const payment = payments[0];

  const [plans] = await connection.execute(
    `SELECT * FROM plans 
     WHERE name = ?
     ORDER BY created_at DESC LIMIT 1`,
    [payment.product_name]
  );

  const plan = plans[0];

  // Determine total and monthly minutes based on billing cycle
  let totalMinutes = planMinutesMap[planName] || 0;
  let remainingTime = totalMinutes;
  let usedTime = 0;
  let monthlyLimit = planMinutesMap[planName] || 0;
  let monthlyUsed = 0;
  let monthlyRemaining = monthlyLimit;

  if (payment.billing_cycle === "yearly") {
    totalMinutes = monthlyLimit * 12;
    remainingTime = totalMinutes;
    usedTime = 0;
    monthlyLimit = planMinutesMap[planName];
    monthlyUsed = 0;
    monthlyRemaining = monthlyLimit;
  }

  // Check if record already exists
  const [existingSubscription] = await connection.execute(
    `SELECT * FROM user_subscription_details WHERE user_id = ?`,
    [userId]
  );

  if (existingSubscription.length === 0) {
    await connection.execute(
      `INSERT INTO user_subscription_details 
       (user_id,plan_id, stripe_payment_id, total_minutes, total_remaining_time, total_used_time, monthly_limit, monthly_used, monthly_remaining) 
       VALUES (?,?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        plan ? plan.id : 1,
        payment.id,
        totalMinutes,
        remainingTime,
        usedTime,
        monthlyLimit,
        monthlyUsed,
        monthlyRemaining,
      ]
    );
  } else {
    await connection.execute(
      `UPDATE user_subscription_details 
       SET stripe_payment_id = ?, 
       plan_id = ?,
           total_minutes = ?, 
           total_remaining_time = ?, 
           total_used_time = ?, 
           monthly_limit = ?, 
           monthly_used = ?, 
           monthly_remaining = ? 
       WHERE user_id = ?`,
      [
        payment.id,
        plan ? plan.id : 1,
        totalMinutes,
        remainingTime,
        usedTime,
        monthlyLimit,
        monthlyUsed,
        monthlyRemaining,
        userId,
      ]
    );
  }
}

async function downgradeToFreePlan(userId, connection) {
  // Reset to free plan limits
  const freePlanMinutes = 60; // Example free plan limit

  await connection.execute(
    `UPDATE user_subscription_details 
     SET stripe_payment_id = NULL,
         total_minutes = ?,
         total_remaining_time = ?,
         total_used_time = 0,
         monthly_limit = ?,
         monthly_used = 0,
         monthly_remaining = ?
     WHERE user_id = ?`,
    [
      freePlanMinutes,
      freePlanMinutes,
      freePlanMinutes,
      freePlanMinutes,
      userId
    ]
  );
}

async function addRechargeMinutes(userId, metadata, connection) {
  let minutes, amount, sessionId, stripePaymentId;

  // 🔹 Parse metadata (supports both string/object)
  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      minutes = parseInt(parsed.minutes) || 0;
      amount =
        parseFloat(parsed.amount) ||
        parseFloat(parsed.original_amount) ||
        0;
      sessionId = parsed.session_id || null;
      stripePaymentId = parsed.stripe_payment_id || null;
    } catch (e) {
      console.error("❌ Error parsing metadata:", e);
      return;
    }
  } else {
    minutes = parseInt(metadata.minutes) || 0;
    amount =
      parseFloat(metadata.amount) ||
      parseFloat(metadata.original_amount) ||
      0;
    sessionId = metadata.session_id || null;
    stripePaymentId = metadata.stripe_payment_id || null;
  }

  if (minutes <= 0) {
    console.warn(`⚠️ Invalid minutes value: ${minutes} for user: ${userId}`);
    return;
  }

  console.log(`🔄 Adding ${minutes} minutes for user ${userId}`);

  // 🔹 Resolve stripe_payment_id if missing
  if (!stripePaymentId && sessionId) {
    const [paymentRow] = await connection.execute(
      `SELECT id FROM stripe_payments WHERE stripe_session_id = ? AND user_id = ? LIMIT 1`,
      [sessionId, userId]
    );
    if (paymentRow.length > 0) {
      stripePaymentId = paymentRow[0].id;
    }
  }

  // 🔹 Check if a recharge already exists for this user+session
  const [existing] = await connection.execute(
    `SELECT id, stripe_payment_id FROM recharge_transactions 
     WHERE user_id = ? 
     AND (stripe_payment_id = ? OR (stripe_payment_id IS NULL AND ? IS NOT NULL))
     ORDER BY id DESC LIMIT 1`,
    [userId, stripePaymentId, stripePaymentId]
  );

  if (existing.length > 0) {
    console.log(
      `⚠️ Existing recharge found (id=${existing[0].id}, stripe_payment_id=${existing[0].stripe_payment_id}). Updating instead of inserting...`
    );

    // Update existing null stripe_payment_id if available
    await connection.execute(
      `UPDATE recharge_transactions
       SET stripe_payment_id = COALESCE(?, stripe_payment_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [stripePaymentId, existing[0].id]
    );
    return;
  }

  // 🔹 Update or create user subscription details
  const [details] = await connection.execute(
    `SELECT * FROM user_subscription_details WHERE user_id = ?`,
    [userId]
  );

  if (details.length > 0) {
    const d = details[0];
    await connection.execute(
      `UPDATE user_subscription_details
       SET total_remaining_time = total_remaining_time + ?,
           total_minutes = total_minutes + ?,
           monthly_remaining = monthly_remaining + ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [minutes, minutes, minutes, userId]
    );
    console.log(`✅ Updated subscription details for user ${userId}`);
  } else {
    await connection.execute(
      `INSERT INTO user_subscription_details 
       (user_id, total_minutes, total_remaining_time, total_used_time, monthly_limit, monthly_used, monthly_remaining)
       VALUES (?, ?, ?, 0, ?, 0, ?)`,
      [userId, minutes, minutes, minutes, minutes]
    );
    console.log(`✅ Created subscription details for user ${userId}`);
  }

  // 🔹 Insert recharge transaction (only once)
  await connection.execute(
    `INSERT INTO recharge_transactions
     (user_id, amount, minutes, rate, status, stripe_payment_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'completed', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [userId, amount, minutes, 0.01, stripePaymentId]
  );

  console.log(
    `✅ Recharge logged for user ${userId} (stripe_payment_id=${stripePaymentId || "null"})`
  );
}


exports.getUserMinutes = async (req, res) => {
  let connection;
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    connection = await db.getConnection();

    const [subscriptionDetails] = await connection.execute(
      `SELECT * FROM user_subscription_details WHERE user_id = ?`,
      [userId]
    );

    if (subscriptionDetails.length === 0) {
      connection.release();
      return res.json({
        success: true,
        data: {
          total_minutes: 0,
          total_remaining_time: 0,
          total_used_time: 0,
          monthly_limit: 0,
          monthly_used: 0,
          monthly_remaining: 0,
          plan_name: "Free"
        }
      });
    }

    const details = subscriptionDetails[0];

    connection.release();

    res.json({
      success: true,
      data: {
        total_minutes: details.total_minutes || 0,
        total_remaining_time: details.total_remaining_time || 0,
        total_used_time: details.total_used_time || 0,
        monthly_limit: details.monthly_limit || 0,
        monthly_used: details.monthly_used || 0,
        monthly_remaining: details.monthly_remaining || 0,
        plan_name: details.plan_name || "Free"
      }
    });

  } catch (error) {
    if (connection) connection.release();
    console.error("Get user minutes error:", error);
    res.status(500).json({
      error: "Failed to retrieve user minutes",
    });
  }
};

// 🔹 LEGACY SUCCESS HANDLER (for frontend redirects - minimal updates)
exports.handlePaymentSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    // Just return basic success - webhook will handle the detailed updates
    const connection = await db.getConnection();

    const [paymentRecords] = await connection.execute(
      `SELECT * FROM stripe_payments WHERE stripe_session_id = ?`,
      [session_id]
    );

    connection.release();

    if (paymentRecords.length === 0) {
      return res.status(404).json({ error: "Payment session not found" });
    }

    const payment = paymentRecords[0];

    res.json({
      success: true,
      message: "Payment being processed",
      payment: payment,
    });
  } catch (error) {
    console.error("Payment success error:", error);
    res.status(500).json({
      error: "Failed to confirm payment",
      details: error.message,
    });
  }
};

// Get user's subscription details
exports.getSubscriptionDetails = async (req, res) => {
  let connection;
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    connection = await db.getConnection();

    const [subscriptions] = await connection.execute(
      `SELECT * FROM stripe_payments 
       WHERE user_id = ? AND stripe_subscription_id IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (subscriptions.length === 0) {
      const [FreeSubscriptions] = await connection.execute(
        `SELECT * FROM user_subscription_details 
         WHERE user_id = ? AND stripe_payment_id IS NULL
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      );

      const FreeSubscription = FreeSubscriptions[0];
      if (FreeSubscription) {
        connection.release();
        return res.json({
          success: true,
          data: {
            plan_name: "Free",
            billing_cycle: "monthly",
            amount: 0,
            currency: "usd",
            payment_status: "active",
            customer_email: null,
            customer_name: null,
            stripe_customer_id: null,
            stripe_subscription_id: null,
            stripe_subscription: null,
            invoice_number: null,
            invoice_pdf: null,
            subscription_status: "active",
            current_period_start: null,
            current_period_end: null,
            created_at: FreeSubscription.created_at,
          },
        });
      }
      return res.status(404).json({ error: "No subscription found" });
    }

    const subscription = subscriptions[0];

    let stripeSubscription = null;
    let upcomingInvoice = null;

    try {
      // Get latest subscription data from Stripe
      const subscriptionResponse = await axios.get(
        `${process.env.STRIPE_URL}/subscriptions/${subscription.stripe_subscription_id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          },
        }
      );
      stripeSubscription = subscriptionResponse.data;

      // Get upcoming invoice if subscription is active
      if (subscription.subscription_status === "active") {
        const invoiceResponse = await axios.get(
          `${process.env.STRIPE_URL}/invoices/upcoming?customer=${subscription.stripe_customer_id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            },
          }
        );
        upcomingInvoice = invoiceResponse.data;
      }
    } catch (stripeError) {
      console.error("Stripe API error:", stripeError.message);
    }

    connection.release();

    res.json({
      success: true,
      data: {
        ...subscription,
        stripe_subscription: stripeSubscription,
        upcoming_invoice: upcomingInvoice,
      },
    });
  } catch (error) {
    if (connection) connection.release();
    console.error("Subscription details error:", error);
    res.status(500).json({
      error: "Failed to retrieve subscription details",
    });
  }
};

// Get user's billing history
exports.getBillingHistory = async (req, res) => {
  let connection;
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    connection = await db.getConnection();

    const [payments] = await connection.execute(
      `SELECT * FROM stripe_payments 
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    connection.release();

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    if (connection) connection.release();
    console.error("Billing history error:", error);
    res.status(500).json({
      error: "Failed to retrieve billing history",
    });
  }
};


exports.cancelSubscription = async (req, res) => {
  let connection;
  try {
    const { subscriptionId } = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!subscriptionId) {
      return res.status(400).json({ error: "Subscription ID is required" });
    }

    connection = await db.getConnection();

    const [requestedCancellations] = await connection.execute(
      `SELECT * FROM cancel_subscription_requests WHERE stripe_subscription_id = ? AND user_id = ?`,
      [subscriptionId, userId]
    );
    const request = requestedCancellations[0];
    if (request) {
      connection.release();
      return res.status(400).json({ error: "Cancellation request already submitted for this subscription" });
    }

    // 1️⃣ Verify subscription belongs to user
    const [subscriptions] = await connection.execute(
      `SELECT * FROM stripe_payments WHERE stripe_subscription_id = ? AND user_id = ?`,
      [subscriptionId, userId]
    );

    const [user_subscription_details] = await connection.execute(
      `SELECT * FROM user_subscription_details WHERE user_id = ?`,
      [userId]
    );
    const user_subscription = user_subscription_details[0];

    if (subscriptions.length === 0) {
      connection.release();
      return res.status(404).json({ error: "Subscription not found" });
    }

    const subscription = subscriptions[0];
    if (subscription.current_period_start) {
      // Stripe timestamps may be in seconds, ensure milliseconds
      const purchaseDate = new Date(
        subscription.current_period_start.toString().length === 10
          ? subscription.current_period_start * 1000
          : subscription.current_period_start
      );
      const now = new Date();
      const diffDays = Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24));

      if (diffDays > 7) {
        connection.release();
        return res.status(403).json({
          error: "Cancellation period expired",
          details: "Subscriptions can only be cancelled within 7 days of purchase.",
        });
      }
    }
    // console.log("subscriptions: ", subscription);
    // console.log("user_subscription: ", user_subscription);

    const total_remaining_time = user_subscription ? user_subscription.total_remaining_time : 0;
    const total_used_time = user_subscription ? user_subscription.total_used_time : 0;
    const total_minutes = user_subscription ? user_subscription.total_minutes : 0;
    const total_used_balance = total_used_time * 0.01;

    // 2️⃣ Insert cancel request into table
    await connection.execute(
      `INSERT INTO cancel_subscription_requests 
        (user_id, user_email, stripe_subscription_id, plan_name, billing_cycle, amount, currency, current_period_end, total_minutes, total_remaining_time, total_used_time, total_used_balance ) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        userEmail,
        subscription.stripe_subscription_id,
        subscription.plan_name,
        subscription.billing_cycle,
        subscription.amount,
        subscription.currency,
        subscription.current_period_end,
        total_minutes,
        total_remaining_time,
        total_used_time,
        total_used_balance
      ]
    );

    // 3️⃣ Setup Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: true,
      auth: {
        user: process.env.MAIL_USER_NOREPLY,
        pass: process.env.MAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    // 4️⃣ Email templates
    const userHtml = `
      <html>
      <body style="font-family:Arial, sans-serif; background:#f8f9fa; padding:20px;">
        <table style="max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#4a90e2; color:#fff; text-align:center; padding:20px; font-size:20px; font-weight:bold;">
              Subscription Cancellation Confirmation
            </td>
          </tr>
          <tr>
            <td style="padding:30px; color:#333;">
              <p>Hello,</p>
              <p>Your subscription for <b>${subscription.product_name}</b> has been scheduled for cancellation.</p>
              <p><b>Plan:</b> ${subscription.plan_name}<br/>
                 <b>Billing Cycle:</b> ${subscription.billing_cycle}<br/>
                 <b>Amount:</b> $${subscription.amount} ${subscription.currency}<br/>
                 <b>Subscription ID:</b> ${subscription.stripe_subscription_id}<br/>
                 <b>Valid Until:</b> ${new Date(subscription.current_period_end).toLocaleString()}</p>
                 <b>Total Used Time:</b> ${total_used_time}<br/>
                 <b>Total Used Balance:</b> ${total_used_balance}<br/>
              <p>You’ll retain access until the end of your current billing period.</p>
              <p>A refund will be processed within <b>15 working days</b>.</p>
              <p style="margin-top:30px;">Best,<br/>The OfficeMoM Team</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f0f0f0; text-align:center; padding:10px; font-size:12px; color:#777;">
              © ${new Date().getFullYear()} OfficeMoM. All rights reserved.
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const adminHtml = `
      <html>
      <body style="font-family:Arial, sans-serif; background:#f8f9fa; padding:20px;">
        <table style="max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#dc3545; color:#fff; text-align:center; padding:20px; font-size:20px; font-weight:bold;">
              New Subscription Cancellation Request
            </td>
          </tr>
          <tr>
            <td style="padding:30px; color:#333;">
              <p><b>User Email:</b> ${userEmail}</p>
              <p><b>Subscription ID:</b> ${subscription.stripe_subscription_id}</p>
              <p><b>Plan:</b> ${subscription.plan_name}</p>
              <p><b>Amount:</b> $${subscription.amount} ${subscription.currency}</p>
              <p><b>Billing Cycle:</b> ${subscription.billing_cycle}</p>
              <p><b>Current Period End:</b> ${new Date(subscription.current_period_end).toLocaleString()}</p>
              <p><b>Invoice:</b> <a href="${subscription.invoice_pdf}" target="_blank">View PDF</a></p>
              <p>Status: <b>Pending Refund</b></p>
              <b>Total Used Time:</b> ${total_used_time}<br/>
              <b>Total Used Balance:</b> ${total_used_balance}<br/>
              <b>Total Recharge Time:</b> ${total_minutes} min<br/>
              <b>Total Remaining Time:</b> ${total_remaining_time} min<br/>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const adminEmail = process.env.MAIL_USER;

    // 5️⃣ Send user + admin email
    await transporter.sendMail({
      from: `"OfficeMoM" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
      to: userEmail,
      subject: "Your subscription cancellation confirmation - OfficeMoM",
      html: userHtml,
    });

    await transporter.sendMail({
      from: `"OfficeMoM" <${process.env.MAIL_USER_NOREPLY_VIEW}>`,
      to: adminEmail,
      subject: `User canceled subscription - ${userEmail}`,
      html: adminHtml,
    });

    connection.release();

    res.json({
      success: true,
      message: "Subscription cancellation request saved and email notifications sent",
    });

  } catch (error) {
    if (connection) connection.release();
    console.error("Cancel subscription error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to cancel subscription",
      details: error.response?.data?.error?.message || error.message,
    });
  }
};
