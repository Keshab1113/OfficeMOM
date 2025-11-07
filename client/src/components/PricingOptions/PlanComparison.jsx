import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  X,
  Check,
  Star,
  Zap,
  Shield,
  Users,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Crown,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

const PlanComparison = ({ plans, billingCycle }) => {
  const [selectedPlans, setSelectedPlans] = useState([0, 1]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Dynamically generate features based on plan data from database
  const features = useMemo(() => {
    if (!plans || plans.length === 0) return [];

    return [
      {
        category: "Usage Limits",
        icon: TrendingUp,
        items: [
          {
            name: "Monthly Minutes",
            values: plans.reduce((acc, plan) => {
              if (plan.name === "Free") {
                acc[plan.name] = `${
                  plan.totalLifetimeMinutes || 100
                } total (lifetime)`;
              } else {
                acc[plan.name] = `${plan.monthlyMinutes || 0}/month`;
              }
              return acc;
            }, {}),
          },
          {
            name: "Extra Minute Cost",
            values: plans.reduce((acc, plan) => {
              acc[plan.name] = plan.requiresRecharge
                ? `$${plan.extraMinuteCost || 0.01}`
                : "Not available";
              return acc;
            }, {}),
          },
          {
            name: "File Upload Limit",
            values: plans.reduce((acc, plan) => {
              acc[plan.name] = plan.perFileMinutesLimit
                ? `${plan.perFileMinutesLimit} min/file`
                : "Unlimited";
              return acc;
            }, {}),
          },
          {
            name: "Meeting Limit",
            values: plans.reduce((acc, plan) => {
              acc[plan.name] = plan.perMeetingMinutesLimit
                ? `${plan.perMeetingMinutesLimit} min/meeting`
                : "Unlimited";
              return acc;
            }, {}),
          },
        ],
      },
      {
        category: "Core Features",
        icon: Sparkles,
        items: [
          {
            name: "Priority Processing",
            values: plans.reduce((acc, plan) => {
              // Assuming priority processing is available for all paid plans
              acc[plan.name] = plan.price > 0 ? "✅" : "❌";
              return acc;
            }, {}),
          },
          {
            name: "AI-powered Insights",
            values: plans.reduce((acc, plan) => {
              // Available for Professional and above
              acc[plan.name] = plan.price >= 9 ? "✅" : "❌";
              return acc;
            }, {}),
          },
          {
            name: "Team Management",
            values: plans.reduce((acc, plan) => {
              if (plan.name === "Professional Plus")
                return { ...acc, [plan.name]: "Basic" };
              if (plan.name === "Business" || plan.name === "Business Plus")
                return { ...acc, [plan.name]: "Advanced" };
              return { ...acc, [plan.name]: "❌" };
            }, {}),
          },
          {
            name: "Custom Integrations",
            values: plans.reduce((acc, plan) => {
              // Available for Business and above
              acc[plan.name] = plan.price >= 37 ? "✅" : "❌";
              return acc;
            }, {}),
          },
        ],
      },
      {
        category: "Support & Security",
        icon: Shield,
        items: [
          {
            name: "Email Support",
            values: plans.reduce((acc, plan) => {
              acc[plan.name] = "✅";
              return acc;
            }, {}),
          },
          {
            name: "Priority Support",
            values: plans.reduce((acc, plan) => {
              // Available for Professional Plus and above
              acc[plan.name] = plan.price >= 19 ? "✅" : "❌";
              return acc;
            }, {}),
          },
          {
            name: "Dedicated Manager",
            values: plans.reduce((acc, plan) => {
              // Available for Business Plus only
              acc[plan.name] = plan.name === "Business Plus" ? "✅" : "❌";
              return acc;
            }, {}),
          },
          {
            name: "Advanced Security",
            values: plans.reduce((acc, plan) => {
              // Available for Professional Plus and above
              acc[plan.name] = plan.price >= 19 ? "✅" : "❌";
              return acc;
            }, {}),
          },
        ],
      },
      {
        category: "Additional Benefits",
        icon: Crown,
        items: [
          {
            name: "Export Options",
            values: plans.reduce((acc, plan) => {
              if (plan.name === "Free") return { ...acc, [plan.name]: "Basic" };
              if (plan.name === "Professional")
                return { ...acc, [plan.name]: "Standard" };
              return { ...acc, [plan.name]: "Advanced" };
            }, {}),
          },
          {
            name: "Storage Duration",
            values: plans.reduce((acc, plan) => {
              if (plan.name === "Free")
                return { ...acc, [plan.name]: "30 days" };
              return { ...acc, [plan.name]: "1 year" };
            }, {}),
          },
          {
            name: "API Access",
            values: plans.reduce((acc, plan) => {
              // Available for Business and above
              acc[plan.name] = plan.price >= 37 ? "✅" : "❌";
              return acc;
            }, {}),
          },
          {
            name: "SLA Guarantee",
            values: plans.reduce((acc, plan) => {
              // Available for Professional Plus and above
              acc[plan.name] = plan.price >= 19 ? "✅" : "❌";
              return acc;
            }, {}),
          },
        ],
      },
    ];
  }, [plans]);

  const visibleFeatures = isExpanded ? features : features.slice(0, 2);

  const togglePlanSelection = (planIndex) => {
    setSelectedPlans((prev) => {
      if (prev.includes(planIndex)) {
        // Don't allow deselecting if only two are selected
        if (prev.length <= 2) return prev;
        return prev.filter((p) => p !== planIndex);
      } else {
        // Max 4 plans to compare
        if (prev.length >= 3) return prev;
        return [...prev, planIndex];
      }
    });
  };

  const getPlanPrice = (plan) => {
    if (billingCycle === "yearly") {
      return plan.yearlyPrice || Math.round(plan.price * 12 * 0.9);
    }
    return plan.price;
  };

  const getYearlySavings = (plan) => {
    if (plan.price === 0) return 0;
    const yearlyPrice = plan.yearlyPrice || plan.price * 12 * 0.9;
    const fullYearPrice = plan.price * 12;
    return Math.round(fullYearPrice - yearlyPrice);
  };

  // Get icon for plan
  const getPlanIcon = (planName) => {
    const iconMap = {
      Professional: Zap,
      "Professional Plus": Users,
      Business: Shield,
      "Business Plus": Crown,
    };
    return iconMap[planName] || Star;
  };

  // Get gradient for plan
  const getPlanGradient = (planName) => {
    const gradientMap = {
      Free: "from-gray-400 to-gray-600",
      Professional: "from-blue-500 to-indigo-600",
      "Professional Plus": "from-purple-500 to-pink-600",
      Business: "from-orange-500 to-red-600",
      "Business Plus": "from-yellow-400 to-orange-600",
    };
    return gradientMap[planName] || "from-indigo-500 to-purple-600";
  };

  // Show loading state if no plans
  if (!plans || plans.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading comparison data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-20 ">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full border border-indigo-200 dark:border-indigo-800 mb-6">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Feature Comparison
          </span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">
            Find Your Perfect Plan
          </span>
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Compare features side-by-side and discover which plan unlocks the capabilities you need
        </p>
      </motion.div>

      {/* Plan Selection Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200 dark:border-gray-700 mb-10 backdrop-blur-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Select Plans to Compare
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose up to 3 plans ({selectedPlans.length}/3 selected)
            </p>
          </div>
          {selectedPlans.length > 2 && (
            <button
              onClick={() => setSelectedPlans([0, 1])}
              className="text-sm px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all font-medium hover:scale-105 active:scale-95"
            >
              Reset Selection
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {plans.map((plan, index) => {
            const IconComponent = getPlanIcon(plan.name);
            const isSelected = selectedPlans.includes(index);
            
            return (
              <button
                key={plan.id || plan.name}
                onClick={() => togglePlanSelection(index)}
                className={`relative flex flex-col items-center gap-3 px-4 py-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden hover:scale-105 hover:-translate-y-1 active:scale-95 ${
                  isSelected
                    ? "border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-500/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md"
                }`}
              >
                <div
                  className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${
                    isSelected ? "opacity-100" : ""
                  } bg-gradient-to-br ${getPlanGradient(plan.name)} opacity-5`}
                />

                <div className="relative z-10 w-full">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`p-2 rounded-xl transition-all duration-300 ${
                        isSelected
                          ? `bg-gradient-to-br ${getPlanGradient(plan.name)}`
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      <IconComponent
                        size={20}
                        className={isSelected ? "text-white" : "text-gray-600 dark:text-gray-400"}
                      />
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500 scale-110"
                          : "border-gray-400 dark:border-gray-500"
                      }`}
                    >
                      {isSelected && (
                        <Check size={14} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                  </div>

                  <div className="text-left">
                    <p className={`font-bold  mb-1 ${isSelected?"text-gray-100 dark:text-white":"text-gray-900 dark:text-white"}`}>{plan.name}</p>
                    <p className={`text-sm  ${isSelected?"text-gray-100 dark:text-gray-100":"text-gray-600 dark:text-gray-400"}`}>
                      ${getPlanPrice(plan)}/{billingCycle === "yearly" ? "yr" : "mo"}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-gray-800/50 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-xl"
      >
        {/* Table Header with Plan Info */}
        <div className="grid grid-cols-12 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
          <div className="col-span-12 lg:col-span-3 p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Features</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Compare all capabilities
            </p>
          </div>

          {selectedPlans.map((planIndex) => {
            const plan = plans[planIndex];
            const IconComponent = getPlanIcon(plan.name);
            
            return (
              <div
                key={plan.id || plan.name}
                className="col-span-6 lg:col-span-3 p-6 lg:p-8 border-2 border-gray-200 dark:border-gray-700"
              >
                <div className="text-center">
                  <div
                    className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${getPlanGradient(
                      plan.name
                    )} mb-4 shadow-lg transform hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>

                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h4>

                  <div className="mb-3">
                    <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                      ${getPlanPrice(plan)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      per {billingCycle === "yearly" ? "year" : "month"}
                    </div>
                  </div>

                  {plan.price > 0 && billingCycle === "yearly" && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                      <TrendingUp className="w-3 h-3" />
                      Save ${getYearlySavings(plan)}
                    </div>
                  )}

                  {plan.price === 0 && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-semibold">
                      Forever Free
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Categories */}
        {visibleFeatures.map((category, categoryIndex) => {
          const CategoryIcon = category.icon;
          
          return (
            <div key={category.category}>
              {/* Category Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <div className="p-5 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <CategoryIcon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                    {category.category}
                  </h4>
                </div>
              </div>

              {/* Feature Items */}
              {category.items.map((feature, featureIndex) => (
                <div
                  key={feature.name}
                  className={`grid grid-cols-12 border-b border-gray-100 dark:border-gray-700/50 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                    featureIndex % 2 === 0
                      ? "bg-white dark:bg-gray-800/30"
                      : "bg-gray-50/50 dark:bg-gray-800/50"
                  }`}
                >
                  <div className="col-span-12 lg:col-span-3 p-5 lg:p-6 flex items-center">
                    <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm lg:text-base">
                      {feature.name}
                    </div>
                  </div>

                  {selectedPlans.map((planIndex) => {
                    const plan = plans[planIndex];
                    const value = feature.values[plan.name];
                    const isCheckmark = value === "✅" || value === "❌";

                    return (
                      <div
                        key={`${plan.name}-${feature.name}`}
                        className="col-span-6 lg:col-span-3 p-5 lg:p-6 border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                      >
                        {isCheckmark ? (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                              value === "✅"
                                ? "bg-green-100 dark:bg-green-900/30"
                                : "bg-red-100 dark:bg-red-900/30"
                            }`}
                          >
                            {value === "✅" ? (
                              <Check className="w-5 h-5 text-green-600 dark:text-green-400" strokeWidth={3} />
                            ) : (
                              <X className="w-5 h-5 text-red-500 dark:text-red-400" strokeWidth={3} />
                            )}
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="inline-flex px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-semibold transition-all hover:scale-105">
                              {value}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}

        {/* Expand/Collapse Footer */}
        <div className="p-8 text-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-t-2 border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95"
          >
            {isExpanded ? (
              <>
                <ChevronUp size={20} />
                Show Less Features
              </>
            ) : (
              <>
                <ChevronDown size={20} />
                Show All Features
              </>
            )}
          </button>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 font-medium">
            {isExpanded
              ? `Viewing all ${features.reduce((total, cat) => total + cat.items.length, 0)} features`
              : `Showing ${visibleFeatures.reduce(
                  (total, cat) => total + cat.items.length,
                  0
                )} of ${features.reduce((total, cat) => total + cat.items.length, 0)} features`}
          </p>
        </div>
      </motion.div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        viewport={{ once: true }}
        className="text-center mt-12 p-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800"
      >
        <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
        <p className="text-gray-700 dark:text-gray-300 text-lg mb-2 font-semibold">
          Still not sure which plan is right for you?
        </p>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Our team is here to help you find the perfect fit for your needs
        </p>
        <Link
          to="/contact-us"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
        >
          Contact Sales Team
        </Link>
      </motion.div>
    </div>
  );
};

export default PlanComparison;