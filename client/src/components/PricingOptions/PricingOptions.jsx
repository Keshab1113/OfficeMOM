// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import axios from "axios";
import { useEffect, useState } from "react";
import { X, Check, Star, Zap, Shield, Users, Brain } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ToastContext";
import PlanComparison from "./PlanComparison";

const paymentOptions = [
  {
    value: "card",
    label: "Credit Card",
    icon: "💳",
    description: "Visa, Mastercard, American Express",
    disabled: false,
  },
  {
    value: "paypal",
    label: "PayPal",
    icon: "🔵",
    description: "Pay with PayPal account",
    disabled: true,
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
];

const SkeletonItem = () => (
  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-3 shadow-sm border border-transparent">
    <div className="flex justify-between items-center">
      <div className="flex gap-2 justify-start items-center flex-1 min-w-0">
        <div className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-md animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
      </div>
      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
    </div>
    <div className="ml-8 mt-2 flex justify-between items-center">
      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
      <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded-full w-16 animate-pulse"></div>
    </div>
  </div>
);

const PricingOptions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const { token } = useSelector((state) => state.auth);
  const nav = useNavigate();
  const { addToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/plans`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setPlans(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const getPlanIcon = (planName) => {
    const iconMap = {
      Free: Users,
      Professional: Zap,
      "Professional Plus": Brain,
      Business: Shield,
      "Business Plus": Users,
    };
    return iconMap[planName];
  };

  const handleOpenModal = (plan) => {
    if (!token) {
      nav("/login");
      return;
    }
    if (plan.name === "Free") {
      nav("/meeting");
      return;
    }
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCheckout = async () => {
    if (!paymentMethod) {
      addToast("error", "Please select a payment method");
      return;
    }

    try {
      const finalPrice =
        billingCycle === "yearly"
          ? selectedPlan.yearlyPrice
          : selectedPlan.price;

      const res = await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/stripe/create-checkout-session`,
        {
          plan: selectedPlan.name,
          paymentMethods: [paymentMethod],
          billingCycle,
          price: finalPrice,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      addToast("error", "Failed to process checkout. Please try again.");
    }
  };

  const calculateYearlySavings = (monthlyPrice) => {
    return (monthlyPrice * 12 - monthlyPrice * 12 * 0.9).toFixed(0);
  };

  if (loading) {
    return (
      <div>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin w-16 h-16 text-gray-500"></div>
        </div>
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin w-16 h-16 text-red-500"></div>
        </div>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-20 px-4 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16 mt-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
              Scalable transcription solutions for individuals, teams, and
              enterprises. Start free and upgrade as you grow.
            </p>

            {/* Billing Toggle - Top */}
            <div className="flex justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                  {[
                    { value: "monthly", label: "Monthly" },
                    { value: "yearly", label: "Yearly" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setBillingCycle(option.value)}
                      className={`flex cursor-pointer items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                        billingCycle === option.value
                          ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {option.label}
                      {option.value === "yearly" && (
                        <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Save 10%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <SkeletonItem key={index} />
              ))
            : plans.map((plan, index) => {
                const IconComponent = getPlanIcon(plan.name);
                const displayPrice =
                  billingCycle === "yearly" ? plan.yearlyPrice : plan.price;
                const originalYearlyPrice = plan.price * 12;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`relative rounded-2xl p-4 flex flex-col h-full transition-all duration-300 ${
                      plan.isHighlighted
                        ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/25 transform scale-105 border-2 border-indigo-500"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {/* Popular Badge */}
                    {plan.isPopular === 1 && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className=" text-xs bg-gradient-to-r from-amber-400 to-amber-500 text-white px-4 py-1.5 rounded-full font-medium flex items-center gap-1 shadow-lg">
                          {/* <Star size={14} /> */}
                          Most Popular
                        </div>
                      </div>
                    )}

                    {/* Plan Icon */}
                    {IconComponent && (
                      <div
                        className={`mb-6 p-3 rounded-xl w-fit ${
                          plan.isHighlighted
                            ? "bg-white/20"
                            : "bg-indigo-100 dark:bg-indigo-900/30"
                        }`}
                      >
                        <IconComponent
                          size={24}
                          className={
                            plan.isHighlighted
                              ? "text-white"
                              : "text-indigo-600"
                          }
                        />
                      </div>
                    )}

                    {/* Plan Header */}
                    <div className="mb-6">
                      <h3
                        className={`text-2xl font-bold mb-2 ${
                          plan.isHighlighted
                            ? "text-white"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {plan.name}
                      </h3>
                      <p
                        className={`text-sm leading-relaxed ${
                          plan.isHighlighted
                            ? "text-indigo-100"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {plan.description}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-4xl font-bold ${
                            plan.isHighlighted
                              ? "text-white"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          ${displayPrice}
                        </span>
                        <span
                          className={`text-lg ${
                            plan.isHighlighted
                              ? "text-indigo-100"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {billingCycle === "yearly" ? "/year" : "/month"}
                        </span>
                      </div>

                      {plan.price > 0 && billingCycle === "yearly" && (
                        <div className="mt-2 space-y-1">
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                            ${originalYearlyPrice}/year
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                            Save ${calculateYearlySavings(plan.price)} per year
                          </div>
                        </div>
                      )}

                      {/* {plan.price > 0 && billingCycle === "monthly" && (
                        <p
                          className={`text-sm mt-1 ${
                            plan.isHighlighted
                              ? "text-indigo-100"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          ${plan.yearlyPrice}/year with yearly plan
                        </p>
                      )} */}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features &&
                        plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <Check
                              size={18}
                              className={`flex-shrink-0 mt-0.5 ${
                                plan.isHighlighted
                                  ? "text-green-300"
                                  : "text-green-500"
                              }`}
                            />
                            <span
                              className={`text-sm ${
                                plan.isHighlighted
                                  ? "text-indigo-100"
                                  : "text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {feature}
                            </span>
                          </li>
                        ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleOpenModal(plan)}
                      className={`w-full cursor-pointer py-3.5 px-6 rounded-xl font-semibold transition-all duration-200 ${
                        plan.isHighlighted
                          ? "bg-white text-indigo-600 hover:bg-gray-50 hover:shadow-lg transform hover:-translate-y-0.5"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5"
                      }`}
                    >
                      {plan.buttonText}
                    </button>
                  </motion.div>
                );
              })}
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { icon: Shield, text: "Secure & Encrypted" },
              { icon: Zap, text: "Instant Setup" },
              { icon: Users, text: "24/7 Support" },
            ].map((item, index) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400"
              >
                <item.icon size={20} className="text-indigo-500" />
                <span className="font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white max-h-[90vh]  dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Complete Your Purchase
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose Payment Options
              </p>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {paymentOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() =>
                    !option.disabled && setPaymentMethod(option.value)
                  }
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    option.disabled
                      ? "opacity-50 cursor-not-allowed grayscale"
                      : "hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  } ${
                    paymentMethod === option.value
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <span className="text-xl">{option.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                  {paymentMethod === option.value && (
                    <Check
                      size={16}
                      className="text-indigo-600 flex-shrink-0"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={!paymentMethod}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Proceed to Checkout
            </button>

            {/* Security Notice */}
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
              🔒 Secure payment processed by Stripe. Your data is protected.
            </p>
          </motion.div>
        </div>
      )}

      <PlanComparison plans={plans} billingCycle={billingCycle} />
    </div>
  );
};

export default PricingOptions;
