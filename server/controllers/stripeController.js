const axios = require("axios");
const db = require("../config/db.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log(`✅ Webhook received: ${event.type}`);

    // Log important event data for debugging
    if (event.type === 'checkout.session.completed') {
      console.log('🔍 Session data:', {
        id: event.data.object.id,
        subscription: event.data.object.subscription,
        payment_status: event.data.object.payment_status,
        metadata: event.data.object.metadata
      });
    }

    if (event.type === 'invoice.payment_succeeded') {
      console.log('🔍 Invoice data:', {
        id: event.data.object.id,
        subscription: event.data.object.subscription,
        number: event.data.object.number,
        invoice_pdf: event.data.object.invoice_pdf
      });
    }

  } catch (err) {
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  let connection;
  try {
    connection = await db.getConnection();

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('🔄 Processing checkout.session.completed');
        await handleCheckoutSessionCompleted(event.data.object, connection);
        break;

      case 'invoice.payment_succeeded':
        console.log('🔄 Processing invoice.payment_succeeded');
        await handleInvoicePaymentSucceeded(event.data.object, connection);
        break;

      case 'customer.subscription.updated':
        console.log('🔄 Processing customer.subscription.updated');
        await handleSubscriptionUpdated(event.data.object, connection);
        break;

      case 'customer.subscription.deleted':
        console.log('🔄 Processing customer.subscription.deleted');
        await handleSubscriptionDeleted(event.data.object, connection);
        break;

      default:
        console.log(`⚡ Unhandled event type: ${event.type}`);
    }

    connection.release();
    res.json({ received: true, processed: event.type });
  } catch (error) {
    if (connection) connection.release();
    console.error('❌ Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed', details: error.message });
  }
};

// 🔹 WEBHOOK EVENT HANDLERS
async function handleCheckoutSessionCompleted(session, connection) {
  const safeValue = (v) => (v === undefined ? null : v);

  console.log(`🔄 Processing session: ${session.id}, subscription: ${session.subscription}`);

  try {
    // Get subscription details
    const subscriptionResponse = await axios.get(
      `${process.env.STRIPE_URL}/subscriptions/${session.subscription}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
      }
    );

    const subscriptionData = subscriptionResponse.data;
    console.log(`✅ Subscription data retrieved:`, {
      status: subscriptionData.status,
      current_period_start: subscriptionData.current_period_start,
      current_period_end: subscriptionData.current_period_end,
      has_period_start: !!subscriptionData.current_period_start,
      has_period_end: !!subscriptionData.current_period_end
    });

    // 🔹 FIX: Ensure all values are properly converted to null if undefined
    const paymentStatus = safeValue(session.payment_status);
    const subscriptionId = safeValue(session.subscription);
    const subscriptionStatus = safeValue(subscriptionData.status);
    const currentPeriodStart = subscriptionData.current_period_start
      ? safeValue(subscriptionData.current_period_start)
      : null;
    const currentPeriodEnd = subscriptionData.current_period_end
      ? safeValue(subscriptionData.current_period_end)
      : null;

    console.log(`📊 Final update values:`, {
      paymentStatus,
      subscriptionId,
      subscriptionStatus,
      currentPeriodStart,
      currentPeriodEnd
    });

    // Update payment record with subscription details
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

    console.log(`✅ Database updated for session: ${session.id}, rows affected: ${updateResult.affectedRows}`);

    // Check if update actually worked
    const [updatedRecord] = await connection.execute(
      `SELECT stripe_subscription_id, subscription_status, current_period_start, current_period_end 
       FROM stripe_payments WHERE stripe_session_id = ?`,
      [session.id]
    );

    console.log(`📋 Updated record:`, updatedRecord[0]);

    // Update user subscription details if we have user_id
    if (session.metadata && session.metadata.user_id) {
      await updateUserSubscriptionDetails(session.metadata.user_id, session.metadata.plan_name, connection);
    } else {
      console.warn('⚠️ No user_id in session metadata');
    }

  } catch (error) {
    console.error('❌ Error in handleCheckoutSessionCompleted:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice, connection) {
  const safeValue = (v) => (v === undefined ? null : v);

  console.log(`🔄 Processing invoice: ${invoice.id}, subscription: ${invoice.subscription}`);

  if (invoice.subscription) {
    try {
      // 🔹 FIX: Ensure all values are properly converted
      const invoiceId = safeValue(invoice.id);
      const invoiceNumber = safeValue(invoice.number);
      const invoicePdf = safeValue(invoice.invoice_pdf);
      const subscriptionId = safeValue(invoice.subscription);

      console.log(`📊 Invoice update values:`, {
        invoiceId,
        invoiceNumber,
        invoicePdf,
        subscriptionId
      });

      // Update the most recent payment record for this subscription
      const [updateResult] = await connection.execute(
        `UPDATE stripe_payments 
         SET stripe_invoice_id = ?,
             invoice_number = ?,
             invoice_pdf = ?,
             payment_status = 'paid',
             updated_at = CURRENT_TIMESTAMP
         WHERE stripe_subscription_id = ?
         ORDER BY created_at DESC 
         LIMIT 1`,
        [
          invoiceId,
          invoiceNumber,
          invoicePdf,
          subscriptionId
        ]
      );

      console.log(`✅ Invoice updated for subscription: ${subscriptionId}, rows affected: ${updateResult.affectedRows}`);

      // Verify the update
      const [updatedRecord] = await connection.execute(
        `SELECT stripe_invoice_id, invoice_number, invoice_pdf 
         FROM stripe_payments WHERE stripe_subscription_id = ?`,
        [subscriptionId]
      );

      console.log(`📋 Updated invoice record:`, updatedRecord[0]);

    } catch (error) {
      console.error('❌ Error updating invoice:', error);
    }
  } else {
    console.warn('⚠️ Invoice has no subscription:', invoice.id);
  }
}

async function handleSubscriptionUpdated(subscription, connection) {
  const safeValue = (v) => (v === undefined ? null : v);

  // 🔹 FIX: Ensure all values are properly converted
  const subscriptionStatus = safeValue(subscription.status);
  const currentPeriodStart = safeValue(subscription.current_period_start);
  const currentPeriodEnd = safeValue(subscription.current_period_end);
  const subscriptionId = safeValue(subscription.id);

  await connection.execute(
    `UPDATE stripe_payments 
     SET subscription_status = ?,
         current_period_start = FROM_UNIXTIME(?),
         current_period_end = FROM_UNIXTIME(?),
         updated_at = CURRENT_TIMESTAMP
     WHERE stripe_subscription_id = ?`,
    [
      subscriptionStatus,
      currentPeriodStart,
      currentPeriodEnd,
      subscriptionId
    ]
  );
  console.log(`✅ Subscription updated: ${subscriptionId}, status: ${subscriptionStatus}`);

  // If subscription was canceled, update user subscription details
  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    if (subscription.metadata && subscription.metadata.user_id) {
      await downgradeToFreePlan(subscription.metadata.user_id, connection);
    }
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
       (user_id, stripe_payment_id, total_minutes, total_remaining_time, total_used_time, monthly_limit, monthly_used, monthly_remaining) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
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
           total_minutes = ?, 
           total_remaining_time = ?, 
           total_used_time = ?, 
           monthly_limit = ?, 
           monthly_used = ?, 
           monthly_remaining = ? 
       WHERE user_id = ?`,
      [
        payment.id,
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

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  let connection;
  try {
    const { subscriptionId } = req.body;
    const userId = req.user?.id;

    if (!subscriptionId) {
      return res.status(400).json({ error: "Subscription ID is required" });
    }

    // Verify the subscription belongs to the user
    connection = await db.getConnection();
    const [subscriptions] = await connection.execute(
      `SELECT * FROM stripe_payments WHERE stripe_subscription_id = ? AND user_id = ?`,
      [subscriptionId, userId]
    );

    if (subscriptions.length === 0) {
      connection.release();
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Cancel subscription in Stripe (at period end)
    const params = new URLSearchParams();
    params.append("invoice_now", "false");
    params.append("prorate", "false");

    const response = await axios.post(
      `${process.env.STRIPE_URL}/subscriptions/${subscriptionId}`,
      params,
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Webhook will handle the database update when subscription is actually canceled
    connection.release();

    res.json({
      success: true,
      message: "Subscription cancellation scheduled",
      data: response.data,
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