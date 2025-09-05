// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Up to 5 hours of transcription per month.",
    features: ["5 hours/month", "Basic transcription", "Email support"],
    button: "Get Started",
    highlight: false,
  },
  {
    name: "Professional",
    price: "$12/month",
    description:
      "Unlimited transcription, advanced AI features, and team collaboration tools.",
    features: [
      "20 hours/month",
      "AI-powered insights",
      "Team collaboration",
      "Priority support",
    ],
    button: "Upgrade Now",
    highlight: true,
  },
  {
    name: "Business",
    price: "$19/month",
    description:
      "Tailored solutions for enterprises with additional admin and security features.",
    features: [
      "Unlimited everything",
      "Dedicated account manager",
      "Advanced security",
      "Custom integrations",
    ],
    button: "Contact Sales",
    highlight: false,
  },
];

const PricingOptions = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-6 transition-colors duration-500">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
          Choose Your Plan
        </h2>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          From individuals to enterprises, we have the perfect solution for your
          transcription needs.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
              className={`rounded-2xl shadow-lg p-8 flex flex-col justify-between 
                ${
                  plan.highlight
                    ? "bg-indigo-600 text-white scale-105"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                }`}
            >
              <div>
                <h3 className="text-2xl font-semibold">{plan.name}</h3>
                <p
                  className={`mt-2 ${
                    plan.highlight
                      ? "text-indigo-100"
                      : "text-gray-500 dark:text-gray-300"
                  }`}
                >
                  {plan.description}
                </p>
                <p className="mt-6 text-4xl font-bold">{plan.price}</p>

                <ul className="mt-6 space-y-3 text-left">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-green-500">✔</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`mt-8 w-full cursor-pointer py-3 rounded-xl font-medium transition 
                  ${
                    plan.highlight
                      ? "bg-white text-indigo-600 hover:bg-gray-100"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
              >
                {plan.button}
              </button>
            </motion.div>
          ))}
          
        </div>
        <div className="text-center mt-16 w-full">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              All plans include a 14-day free trial. No credit card required.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                No setup fees
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Cancel anytime
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                24/7 support
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default PricingOptions;
