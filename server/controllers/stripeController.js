const axios = require("axios");

/**
 * @desc Create Stripe Checkout Session
 * @route POST /api/stripe/create-checkout-session
 * @access Private
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    const { plan, paymentMethods, billingCycle, price } = req.body;

    if (!plan || !paymentMethods || !billingCycle || !price) {
      return res
        .status(400)
        .json({ error: "Missing required fields in request body" });
    }

    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("success_url", `${process.env.FRONTEND_URL}/success`);
    params.append("cancel_url", `${process.env.FRONTEND_URL}/failure`);

    // Add payment method types
    (paymentMethods.length > 0 ? paymentMethods : ["card"]).forEach(
      (pm, idx) => {
        params.append(`payment_method_types[${idx}]`, pm);
      }
    );

    // Determine interval (monthly or yearly)
    const interval = billingCycle === "yearly" ? "year" : "month";

    // Stripe expects price in cents
    const unitAmount = Math.round(Number(price) * 100);

    // Add line item
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][product_data][name]", plan);
    params.append("line_items[0][price_data][unit_amount]", unitAmount);
    params.append(
      "line_items[0][price_data][recurring][interval]",
      interval
    );
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

    res.json({ url: response.data.url });
  } catch (error) {
    console.error("Stripe error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to create checkout session",
      details: error.response?.data || error.message,
    });
  }
};
