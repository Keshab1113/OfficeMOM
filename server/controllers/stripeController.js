const axios = require("axios");
const db = require("../config/db.js");

exports.createCheckoutSession = async (req, res) => {
  let connection;
  try {
    const {
      plan,
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

    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("success_url", `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${process.env.FRONTEND_URL}/failure`);
    
    // Add metadata to identify the user
    params.append("metadata[user_id]", userId || "");
    params.append("metadata[plan_name]", plan);

    // Add customer email - prioritize provided email, then user email
    const finalCustomerEmail = customerEmail || userEmail;
    if (finalCustomerEmail) {
      params.append("customer_email", finalCustomerEmail);
    }

    // Add payment method types
    (paymentMethods.length > 0 ? paymentMethods : ["card"]).forEach(
      (pm, idx) => {
        params.append(`payment_method_types[${idx}]`, pm);
      }
    );

    const interval = billingCycle === "yearly" ? "year" : "month";
    const unitAmount = Math.round(Number(price) * 100);

    // Add line item
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][product_data][name]", plan);
    params.append("line_items[0][price_data][unit_amount]", unitAmount);
    params.append("line_items[0][price_data][recurring][interval]", interval);
    params.append("line_items[0][quantity]", 1);

    // Make API request to Stripe
    const response = await axios.post(
      "https://api.stripe.com/v1/checkout/sessions",
      params,
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const session = response.data;

    // Store initial payment record in database
    connection = await db.getConnection();

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
        user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        plan,
        billingCycle,
        price,
        "usd",
        "pending",
        finalCustomerEmail || null,
        customerName || userName || null,
        JSON.stringify(paymentMethods),
        userId || null
      ]
    );

    connection.release();

    res.json({
      url: session.url,
      sessionId: session.id,
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

// New function to handle successful payments
exports.handlePaymentSuccess = async (req, res) => {
  let connection;
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    // Retrieve session from Stripe
    const sessionResponse = await axios.get(
      `https://api.stripe.com/v1/checkout/sessions/${session_id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
      }
    );

    const session = sessionResponse.data;

    // Update database with complete payment information
    connection = await db.getConnection();

    await connection.execute(
      `UPDATE stripe_payments 
       SET payment_status = ?,
           stripe_customer_id = ?,
           stripe_subscription_id = ?,
           customer_email = COALESCE(?, customer_email),
           updated_at = CURRENT_TIMESTAMP
       WHERE stripe_session_id = ?`,
      [
        session.payment_status,
        session.customer,
        session.subscription,
        session.customer_details?.email,
        session_id
      ]
    );

    // Get the updated payment record
    const [paymentRecords] = await connection.execute(
      `SELECT * FROM stripe_payments WHERE stripe_session_id = ?`,
      [session_id]
    );

    connection.release();

    if (paymentRecords.length === 0) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    const payment = paymentRecords[0];

    res.json({
      success: true,
      message: "Payment confirmed successfully",
      payment: {
        id: payment.id,
        plan_name: payment.plan_name,
        billing_cycle: payment.billing_cycle,
        amount: payment.amount,
        currency: payment.currency,
        payment_status: payment.payment_status,
        customer_email: payment.customer_email,
        customer_name: payment.customer_name,
        stripe_customer_id: payment.stripe_customer_id,
        stripe_subscription_id: payment.stripe_subscription_id,
        created_at: payment.created_at
      }
    });

  } catch (error) {
    if (connection) connection.release();
    console.error("Payment success error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to confirm payment",
      details: error.response?.data || error.message,
    });
  }
};

// Get user's billing history
exports.getBillingHistory = async (req, res) => {
  let connection;
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId && !userEmail) {
      return res.status(400).json({ error: "User identification required" });
    }

    connection = await db.getConnection();

    let query = `
      SELECT * FROM stripe_payments 
      WHERE (user_id = ? OR customer_email = ?)
      ORDER BY created_at DESC
    `;
    
    const [payments] = await connection.execute(query, [userId, userEmail]);

    connection.release();

    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    if (connection) connection.release();
    console.error("Billing history error:", error);
    res.status(500).json({
      error: "Failed to retrieve billing history"
    });
  }
};