// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { CreditCard, ChevronDown } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

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
    description: "Advanced AI features, and team collaboration tools.",
    features: ["20 hours/month", "AI-powered insights", "Priority support"],
    button: "Upgrade Now",
    highlight: true,
  },
  {
    name: "Business",
    price: "$19/month",
    description:
      "Tailored solutions for enterprises with additional admin and security features.",
    features: [
      "Upto 200 hours/month",
      "Advanced security",
      "Custom integrations",
    ],
    button: "Contact Sales",
    highlight: false,
  },
];
const paymentOptions = [
  {
    value: "card",
    label: "Card Payment",
    icon: "💳",
    description: "Visa, Mastercard, Amex",
    disabled: false,
  },
  {
    value: "alipay",
    label: "Alipay",
    icon: "🟦",
    description: "Pay with Alipay",
    disabled: true,
  },
  {
    value: "wechat_pay",
    label: "WeChat Pay",
    icon: "💚",
    description: "WeChat payment",
    disabled: true,
  },
  {
    value: "ideal",
    label: "iDEAL",
    icon: "🟠",
    description: "Netherlands banks",
    disabled: true,
  },
  {
    value: "sofort",
    label: "Sofort",
    icon: "🔴",
    description: "European banks",
    disabled: true,
  },
  {
    value: "sepa_debit",
    label: "SEPA Debit",
    icon: "🏦",
    description: "EU bank transfer",
    disabled: true,
  },
];

const PricingOptions = () => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const nav = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const selectedOption = paymentOptions.find(
    (option) => option.value === paymentMethod
  );

  const handleCheckout = async (plan) => {
    try {
      const res = await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/stripe/create-checkout-session`,
        {
          plan,
          paymentMethods: [paymentMethod],
        }
      );

      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error("Error during checkout:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-6 transition-colors duration-500 flex justify-center items-center">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
          Choose Your Plan
        </h2>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          From individuals to enterprises, we have the perfect solution for your
          transcription needs.
        </p>

        {/* Payment Options Trigger */}
        <div className="flex justify-end mt-2 relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs cursor-pointer text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800"
          >
            {selectedOption
              ? `Payment: ${selectedOption.label}`
              : "Choose Payment Option"}
          </button>

          {/* Dropdown (floating over content) */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 md:w-[50%] w-[90%]">
              <div className="overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                <div className="py-2">
                  {paymentOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        if (!option.disabled) {
                          setPaymentMethod(option.value);
                          setIsOpen(false); // auto-close
                        }
                      }}
                      className={`group relative cursor-pointer px-6 py-4 transition-all duration-200 ${
                        option.disabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20"
                      } ${
                        option.value === paymentMethod
                          ? "bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20"
                          : ""
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 group-hover:from-purple-100 group-hover:to-blue-100 dark:group-hover:from-purple-800 dark:group-hover:to-blue-800 transition-all duration-200">
                          <span className="text-lg">{option.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200">
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                            {option.description}
                          </div>
                        </div>
                        {option.value === paymentMethod && (
                          <div className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-8 lg:grid-cols-3">
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
                onClick={() =>
                  token
                    ? plan.name === "Professional" || plan.name === "Business"
                      ? handleCheckout(plan.name)
                      : nav(token ? "/meeting" : "/login")
                    : nav("/login")
                }
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
          <div className="flex items-center justify-center md:gap-8 gap-2 text-sm text-gray-500 dark:text-gray-400">
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
