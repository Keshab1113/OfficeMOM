// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import axios from "axios";
import { useEffect, useState } from "react";
import { X, Check, Star, Zap, Shield, Users, Brain, Globe } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PlanComparison from "./PlanComparison";
import SkeletonItem from "./SkeletonItem";

const PricingOptions = () => {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [currency, setCurrency] = useState("local"); // 'USD' or 'local'
  const { token } = useSelector((state) => state.auth);
  const nav = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [location, setLocation] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [localCurrency, setLocalCurrency] = useState("USD");

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/plans`
      );

      if (response?.data?.success) {
        setPlans(response?.data?.data);
      } else {
        setError(response?.data?.message || "Failed to fetch plans");
      }
    } catch (err) {
      console.error("Fetch plans error: ", err);
      setError(err.response?.data?.message || err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (token) {
      const fetchSubscription = async () => {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/subscription`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setSubscription(res.data.data);
        } catch (err) {
          console.error("Failed to load subscription details.", err);
        }
      };

      fetchSubscription();
    }
  }, [token]);

  useEffect(() => {
    const fetchLocation = async (lat, lon) => {
      try {
        const url =
          lat && lon
            ? `${import.meta.env.VITE_BACKEND_URL
            }/api/location?lat=${lat}&lon=${lon}&includeRates=true`
            : `/api/location?includeRates=true`;

        const res = await axios.get(url);
        const locationData = res.data.data;
        setLocation(locationData);
        // Set local currency based on location
        if (locationData?.currency) {
          setLocalCurrency(locationData.currency);
        }

        // Use exchange rates from API response
        if (res.data.exchangeRates) {
          setExchangeRate(res.data.exchangeRates[locationData.currency] || 1);
        }
      } catch (err) {
        console.error("Failed to fetch location:", err);
      }
    };

    // Try browser geolocation first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn(
            "Geolocation failed, falling back to IP:",
            error.message
          );
          fetchLocation();
        }
      );
    } else {
      fetchLocation();
    }
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
    nav("/checkout", { state: { selectedPlan: plan, billingCycle: billingCycle } });
  };

  const calculateYearlySavings = (monthlyPrice) => {
    return (monthlyPrice * 12 - monthlyPrice * 12 * 0.9).toFixed(0);
  };

  // Format price with English numerals
  const formatPrice = (price) => {
    if (currency === "USD" || !exchangeRate) {
      return {
        amount: price,
        formatted: `$${price}`,
        currency: "USD"
      };
    }

    const localPrice = price * exchangeRate;

    // Always use 'en' locale for English numerals, but keep the currency
    try {
      const formatted = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: localCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(localPrice);

      return {
        amount: localPrice,
        formatted,
        currency: localCurrency
      };
    } catch (error) {
      // Fallback to USD
      return {
        amount: price,
        formatted: `$${price}`,
        currency: "USD"
      };
    }
  };

  // Format savings with English numerals
  const formatSavings = (savings) => {
    if (currency === "USD" || !exchangeRate) {
      return `$${savings}`;
    }

    const localSavings = savings * exchangeRate;

    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: localCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(localSavings);
    } catch (error) {
      return `$${savings}`;
    }
  };

  if (loading) {
    return (
      <div className=" text-center dark:text-gray-100">
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin w-16 h-16 text-gray-500 dark:text-gray-100"></div>
        </div>
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className=" text-center dark:text-gray-100">
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin w-16 h-16 text-red-500"></div>
        </div>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen  py-20 px-4 transition-colors duration-500">
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
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:mb-8 mb-4">
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
                        className={`flex cursor-pointer items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${billingCycle === option.value
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

              {/* Currency Toggle */}
              <div className="flex justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                    {[
                      { value: "USD", label: "USD", icon: "$" },
                      { value: "local", label: localCurrency, icon: <Globe size={16} /> },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setCurrency(option.value)}
                        className={`flex cursor-pointer items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${currency === option.value
                          ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          }`}
                      >
                        {option.icon}
                        {option.label}
                        {option.value === "local" && location?.country && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                            {location.country}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
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
            : plans && plans.length > 0
              ? plans.map((plan, indx) => {
                if (!plan?.name) return null;
                const IconComponent = getPlanIcon(plan.name);
                const displayPrice =
                  billingCycle === "yearly" ? plan.yearlyPrice : plan.price;
                const originalYearlyPrice = plan.price * 12;

                const formattedPrice = formatPrice(displayPrice);
                const formattedYearlyPrice = formatPrice(originalYearlyPrice);
                const formattedSavings = formatSavings(calculateYearlySavings(plan.price));

                return (
                  <motion.div
                    key={plan.id}
                    className={`relative rounded-2xl p-4 flex flex-col h-full transition-all duration-300 ${plan.isHighlighted
                      ? "bg-gradient-to-br dark:from-indigo-600/30 dark:to-purple-600/30 from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/25 transform lg:scale-105 border-2 border-indigo-500 "
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700"
                      }`}
                  >
                    {/* Popular Badge */}
                    {plan.isPopular === 1 && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className=" text-xs bg-gradient-to-r from-amber-400 to-amber-500 text-white px-4 py-1.5 rounded-full font-medium flex items-center gap-1 shadow-lg">
                          Most Popular
                        </div>
                      </div>
                    )}

                    {/* Plan Icon */}
                    {IconComponent && (
                      <div
                        className={`mb-6 p-3 rounded-xl w-fit ${plan.isHighlighted
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
                        className={`text-2xl font-bold mb-2 ${plan.isHighlighted
                          ? "text-white"
                          : "text-gray-900 dark:text-white"
                          }`}
                      >
                        {plan.name}
                      </h3>
                      <p
                        className={`text-sm leading-relaxed ${plan.isHighlighted
                          ? "text-indigo-100"
                          : "text-gray-600 dark:text-gray-400"
                          }`}
                      >
                        {plan.description}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-0 flex-wrap overflow-hidden min-w-0">
                        <span
                          className={`text-3xl font-bold truncate ${plan.isHighlighted
                            ? "text-white"
                            : "text-gray-900 dark:text-white"
                            }`}
                        >
                          {formattedPrice.formatted}
                        </span>
                        <span
                          className={`text-lg whitespace-nowrap ${plan.isHighlighted
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
                            {formattedYearlyPrice.formatted}/year
                          </div>
                          <div className={`text-sm font-medium ${plan.isHighlighted ? "text-green-100" : "text-green-500"}`}>
                            Save {formattedSavings} per year
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features &&
                        plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <Check
                              size={18}
                              className={`flex-shrink-0 mt-0.5 ${plan.isHighlighted
                                ? "text-green-300"
                                : "text-green-500"
                                }`}
                            />
                            <span
                              className={`text-sm ${plan.isHighlighted
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
                      disabled={subscription?.plan_name === plan.name}
                      className={`w-full disabled:cursor-not-allowed cursor-pointer py-3.5 px-6 rounded-xl font-semibold transition-all duration-200 ${plan.isHighlighted
                        ? "bg-white text-indigo-600 hover:bg-gray-50 hover:shadow-lg transform hover:-translate-y-0.5"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5"
                        } ${subscription?.plan_id > indx && "hidden"}`}
                    >
                      {subscription?.plan_name === plan.name ? "Subscribed" : plan.buttonText}
                    </button>
                  </motion.div>
                );
              })
              : Array.from({ length: 5 }).map((_, index) => (
                <SkeletonItem key={index} />
              ))}
        </div>

        <h1 className=" mt-10 text-gray-600 dark:text-gray-200 text-center">Note: All Payments will be charged in USD. All other currencies are for reference only.</h1>

        {/* Trust Indicators */}
        <div className="mt-6 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 md:gap-8 gap-2 max-w-2xl mx-auto">
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
      <PlanComparison
        plans={plans}
        billingCycle={billingCycle}
        currency={currency}
        exchangeRate={exchangeRate}
        localCurrency={localCurrency}
      />
    </div>
  );
};

export default PricingOptions;