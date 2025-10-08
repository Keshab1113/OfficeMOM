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
} from "lucide-react";
import {Link} from "react-router-dom";

const PlanComparison = ({ plans, billingCycle }) => {
  const [selectedPlans, setSelectedPlans] = useState([0, 1]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Dynamically generate features based on plan data from database
  const features = useMemo(() => {
    if (!plans || plans.length === 0) return [];

    return [
      {
        category: "Usage Limits",
        items: [
          {
            name: "Monthly Minutes",
            values: plans.reduce((acc, plan) => {
              if (plan.name === "Free") {
                acc[plan.name] = `${
                  plan.totalLifetimeMinutes || 300
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
      "Business Plus": Users,
    };
    return iconMap[planName] || null;
  };

  // Show loading state if no plans
  if (!plans || plans.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4 border-t mt-10 border-slate-200 dark:border-slate-600">
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
    <div className="max-w-7xl mx-auto pt-20 md:px-4 border-t mt-10 border-slate-200 dark:border-slate-600">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
          Compare Plans
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Detailed feature comparison to help you choose the perfect plan for
          your needs
        </p>
      </motion.div>

      {/* Plan Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select plans to compare ({selectedPlans.length}/3 selected)
          </h3>
          {selectedPlans.length > 2 && (
            <button
              onClick={() => setSelectedPlans([0, 1])}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              Reset selection
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {plans.map((plan, index) => {
            const IconComponent = getPlanIcon(plan.name);
            return (
              <button
                key={plan.id || plan.name}
                onClick={() => togglePlanSelection(index)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 flex-1 min-w-[200px] ${
                  selectedPlans.includes(index)
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-md"
                    : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:border-gray-400 hover:shadow-sm"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedPlans.includes(index)
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-gray-400"
                  }`}
                >
                  {selectedPlans.includes(index) && (
                    <Check size={12} className="text-white" />
                  )}
                </div>

                <span className="font-medium text-sm sm:text-base">
                  {plan.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
          <div className="col-span-12 lg:col-span-3 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Plan Features
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Compare all features side by side
            </p>
          </div>
          {selectedPlans.map((planIndex) => {
            const plan = plans[planIndex];
            const IconComponent = getPlanIcon(plan.name);
            return (
              <div
                key={plan.id || plan.name}
                className="col-span-6 lg:col-span-3 p-6 border-l border-gray-200 dark:border-gray-600"
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      {plan.name}
                    </h4>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                    ${getPlanPrice(plan)}
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-normal ml-1">
                      /{billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                  {plan.price > 0 && billingCycle === "yearly" && (
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Save ${getYearlySavings(plan)}/year
                    </div>
                  )}
                  {plan.price === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Forever free
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Rows */}
        {visibleFeatures.map((category, categoryIndex) => (
          <div key={category.category}>
            {/* Category Header */}
            <div className="bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-600">
              <div className="col-span-12 p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                  <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                  {category.category}
                </h4>
              </div>
            </div>

            {/* Feature Items */}
            {category.items.map((feature, featureIndex) => (
              <div
                key={feature.name}
                className={`grid grid-cols-12 border-b border-gray-100 dark:border-gray-700 transition-colors ${
                  featureIndex % 2 === 0
                    ? "bg-gray-50/30 dark:bg-gray-800/30"
                    : "bg-white dark:bg-gray-800"
                } hover:bg-gray-100 dark:hover:bg-gray-700/50`}
              >
                <div className="col-span-12 lg:col-span-3 p-4 lg:p-6">
                  <div className="font-medium text-gray-900 dark:text-white text-sm lg:text-base">
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
                      className="col-span-6 lg:col-span-3 p-4 lg:p-6 border-l border-gray-200 dark:border-gray-600 flex items-center justify-center"
                    >
                      <div
                        className={`text-center ${
                          isCheckmark
                            ? "text-xl"
                            : "text-sm font-medium text-gray-700 dark:text-gray-300"
                        } ${
                          isCheckmark && value === "✅" ? "text-green-500" : ""
                        } ${
                          isCheckmark && value === "❌" ? "text-red-400" : ""
                        }`}
                      >
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}

        {/* Expand/Collapse Button */}
        <div className="p-6 text-center bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all duration-200 hover:shadow-lg"
          >
            {isExpanded ? (
              <>
                Show Less Features
                <ChevronUp size={16} />
              </>
            ) : (
              <>
                Show All Features
                <ChevronDown size={16} />
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {isExpanded
              ? `Showing all ${features.reduce(
                  (total, cat) => total + cat.items.length,
                  0
                )} features`
              : `Showing ${visibleFeatures.reduce(
                  (total, cat) => total + cat.items.length,
                  0
                )} of ${features.reduce(
                  (total, cat) => total + cat.items.length,
                  0
                )} features`}
          </p>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-center mt-8">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Need help choosing the right plan?{" "}
          <Link
            to="/contact-us"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Contact our sales team
          </Link>{" "}
          for personalized advice.
        </p>
      </div>
    </div>
  );
};

export default PlanComparison;
