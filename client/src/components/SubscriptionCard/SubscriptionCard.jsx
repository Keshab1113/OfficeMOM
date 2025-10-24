// SubscriptionCard.jsx
import axios from "axios";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FiCheck, FiZap, FiStar } from "react-icons/fi";
import { TfiCrown } from "react-icons/tfi";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const SubscriptionCard = () => {
    const {
        token,
    } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [billingHistory, setBillingHistory] = useState([]);

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
            fetchSubscriptionData();
        }
    }, [token]);

    const fetchSubscriptionData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [subscriptionRes, billingRes] = await Promise.all([
                axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/stripe/subscription-details`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                ),
                axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/stripe/billing-history`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                ),
            ]);


            if (subscriptionRes.data.success) {
                setSubscription(subscriptionRes.data.data);
            }

            if (billingRes.data.success) {
                setBillingHistory(billingRes.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load subscription data");
        } finally {
            setLoading(false);
        }
    };
    const mySubscription = plans.find((plan => plan.name === subscription?.plan_name));



    const features = mySubscription?.features || [
        "Unlimited meetings",
        "Advanced AI summaries",
        "Custom templates",
        "Priority support",
        "Team collaboration",
        "Export to multiple formats"
    ];

    return (
        <motion.div
            className="p-8 rounded-3xl lg:w-[40%] h-fit backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-400/30 shadow-2xl shadow-yellow-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/30">
                    <TfiCrown className="text-white text-xl" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{subscription?.plan_name || "Free"} Plan</h3>
                    <p className="text-yellow-600 dark:text-yellow-400 font-semibold">Active • ${subscription?.amount || 0}/month</p>
                </div>
            </div>

            <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-4 rounded-xl bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm">
                    <span className="text-gray-600 dark:text-gray-300">Billing Cycle</span>
                    <span className="font-bold text-gray-800 dark:text-white capitalize">{subscription?.billing_cycle || "N/A"}</span>
                </div>


            </div>

            <div className="space-y-3 mb-6">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FiZap className="text-yellow-500" />
                    {subscription?.plan_name} Features
                </h4>
                {features.map((feature, index) => (
                    <motion.div
                        key={feature}
                        className="flex items-center gap-3 text-sm"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                    >
                        <FiCheck className="text-green-500 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </motion.div>
                ))}
            </div>
            {subscription?.plan_name === "Free" ? (
                <motion.button
                    className="w-full cursor-pointer py-4 px-6 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all"
                    onClick={() => navigate("/pricing")}
                >
                    Upgrade Subscription
                </motion.button>
            ) : (
                <motion.button
                    className="w-full cursor-pointer py-4 px-6 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all"
                    onClick={() => navigate("/subscription")}
                >
                    Manage Subscription
                </motion.button>
            )}
        </motion.div>
    );
};

export default SubscriptionCard;