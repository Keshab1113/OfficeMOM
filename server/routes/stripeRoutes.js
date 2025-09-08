const express = require("express");
const axios = require("axios");
const router = express.Router();

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { plan, paymentMethods } = req.body;

    const prices = {
      Professional: 1200,
      Business: 1900,
    };

    // Stripe expects application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("success_url", `${process.env.FRONTEND_URL}/success`);
    params.append("cancel_url", `${process.env.FRONTEND_URL}/failure`);

    // Add payment method types
    (paymentMethods.length > 0 ? paymentMethods : ["card"]).forEach((pm, idx) => {
      params.append(`payment_method_types[${idx}]`, pm);
    });

    // Add line item
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][product_data][name]", plan);
    params.append("line_items[0][price_data][unit_amount]", prices[plan]);
    params.append("line_items[0][price_data][recurring][interval]", "month");
    params.append("line_items[0][quantity]", 1);

    // Make API request
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
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;




// const express = require("express");
// const Stripe = require("stripe");
// const router = express.Router();

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// router.post("/create-checkout-session", async (req, res) => {
//   try {
//     const { plan, paymentMethods } = req.body;

//     const prices = {
//       Professional: 1200,
//       Business: 1900,
//     };

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: paymentMethods.length > 0 ? paymentMethods : ["card"],
//       mode: "subscription",
//       line_items: [
//         {
//           price_data: {
//             currency: "usd",
//             product_data: {
//               name: plan,
//             },
//             unit_amount: prices[plan],
//             recurring: { interval: "month" },
//           },
//           quantity: 1,
//         },
//       ],
//       success_url: `${process.env.FRONTEND_URL}/success`,
//       cancel_url: `${process.env.FRONTEND_URL}/failure`,
//     });

//     res.json({ url: session.url });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// });

// module.exports = router;
