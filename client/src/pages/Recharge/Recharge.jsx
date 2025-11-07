import React, { useState } from 'react';
import Breadcrumb from '../../components/LittleComponent/Breadcrumb';
import Footer from '../../components/Footer/Footer';
import { CreditCard, DollarSign, Clock, Shield, Zap, CheckCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../components/ToastContext';

const breadcrumbItems = [{ label: "Recharge" }];

const Recharge = () => {
    const [rechargeAmount, setRechargeAmount] = useState('5');
    const [selectedAmount, setSelectedAmount] = useState(5);
    const [isProcessing, setIsProcessing] = useState(false);
    const { token } = useSelector((state) => state.auth);
    const nav = useNavigate();
    const { addToast } = useToast();

    const quickAmounts = [5, 10, 20, 50, 100, 200];

    const handleAmountSelect = (amount) => {
        setSelectedAmount(amount);
        setRechargeAmount(amount.toString());
    };

    const handleCustomAmount = (e) => {
        const value = e.target.value;
        setRechargeAmount(value);
        if (value && parseFloat(value) >= 5) {
            setSelectedAmount(null);
        }
    };

    const calculateMinutes = (amount) => {
        const rate = 0.01; // $0.01 per minute
        return Math.floor(amount / rate);
    };

    const handleRecharge = async (e) => {
        e.preventDefault();

        if (!token) {
            nav("/login");
            return;
        }

        if (!rechargeAmount || parseFloat(rechargeAmount) < 5) {
            addToast("error", "Minimum recharge amount is $5");
            return;
        }

        setIsProcessing(true);

        try {
            const amount = parseFloat(rechargeAmount);
            const minutes = calculateMinutes(amount);

            console.log(`🔄 Creating recharge session for $${amount} (${minutes} minutes)`);

            // Create a recharge session with Stripe
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/stripe/create-recharge-session`,
                {
                    amount: amount,
                    minutes: minutes,
                    type: "recharge"
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.data.url) {
                console.log(`✅ Redirecting to Stripe: ${res.data.url}`);
                // Redirect to Stripe Checkout
                window.location.href = res.data.url;
            } else {
                throw new Error("No checkout URL received");
            }
        } catch (err) {
            console.error("Recharge error:", err);
            setIsProcessing(false);

            if (err.response?.data?.error) {
                addToast("error", err.response.data.error);
            } else {
                addToast("error", "Failed to process recharge. Please try again.");
            }
        }
    };

    // Alternative approach if you want to reuse the existing checkout page:
    const handleRechargeAlternative = async (e) => {
        e.preventDefault();

        if (!token) {
            nav("/login");
            return;
        }

        if (!rechargeAmount || parseFloat(rechargeAmount) < 5) {
            addToast("error", "Minimum recharge amount is $5");
            return;
        }

        setIsProcessing(true);

        try {
            const amount = parseFloat(rechargeAmount);
            const minutes = calculateMinutes(amount);

            // Create a custom plan object for the recharge
            const rechargePlan = {
                name: `Minutes Recharge - ${minutes} minutes`,
                description: `Top-up ${minutes} minutes to your account`,
                price: amount,
                features: [
                    `${minutes} transcription minutes`,
                    "$0.01 per minute rate",
                    "No expiration date",
                    "Use with your current plan"
                ],
                isRecharge: true,
                minutes: minutes
            };

            // Navigate to checkout with recharge data
            nav("/checkout", {
                state: {
                    selectedPlan: rechargePlan,
                    billingCycle: "one_time",
                    isRecharge: true,
                    rechargeAmount: amount,
                    rechargeMinutes: minutes
                }
            });
        } catch (err) {
            console.error("Recharge error:", err);
            setIsProcessing(false);
            addToast("error", "Failed to process recharge. Please try again.");
        }
    };

    const currentAmount = parseFloat(rechargeAmount) || 0;
    const minutes = calculateMinutes(currentAmount);

    return (
        <section className="relative min-h-screen w-full overflow-hidden">
            {/* Enhanced Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
                {/* Animated background elements */}
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
                    <div className="absolute top-3/4 left-1/3 w-60 h-60 bg-pink-300 dark:bg-pink-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1500"></div>
                </div>

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-10 dark:opacity-5">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(120,119,198,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(120,119,198,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
                </div>
            </div>

            <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll">
                <div className="min-h-screen lg:px-4 md:px-4 px-4 py-20 lg:py-28 flex flex-col md:gap-12 gap-8 container mx-auto">
                    <Breadcrumb items={breadcrumbItems} />
                    <div className="text-center">
                        <h1 className="text-4xl lg:text-5xl pb-2 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                            Recharge Minutes
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
                            Add minutes to your account and unlock powerful transcription features
                        </p>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto w-full">
                        {/* Left Side - Pricing & Info */}
                        <div className="lg:w-2/3 space-y-8">
                            {/* Pricing Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 lg:p-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Rate Info */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                                                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">Cost Rate</h3>
                                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">$0.01 / min</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                                                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">Validity</h3>
                                                <p className="text-lg text-gray-700 dark:text-gray-300">Until fully consumed</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                                                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">Minimum Recharge</h3>
                                                <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">$5.00</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Amounts */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Quick Select</h4>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                            {quickAmounts.map((amount) => (
                                                <button
                                                    key={amount}
                                                    onClick={() => handleAmountSelect(amount)}
                                                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${selectedAmount === amount
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300'
                                                        }`}
                                                >
                                                    <div className="font-bold text-lg">${amount}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {calculateMinutes(amount)} min
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 lg:p-8">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-green-500" />
                                    What You Get With Recharge
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {[
                                        "AI-powered audio transcriptions",
                                        "Multi-language support",
                                        "Priority processing",
                                        "Meeting notes generation",
                                        "Unlimited storage",
                                        "24/7 customer support"
                                    ].map((feature, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Recharge Form */}
                        <div className="lg:w-1/3">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 lg:p-8 sticky top-8">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <CreditCard className="w-6 h-6 text-blue-500" />
                                    Recharge Now
                                </h3>

                                <form onSubmit={handleRecharge} className="space-y-6">
                                    {/* Amount Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Recharge Amount ($)
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 dark:text-gray-400">$</span>
                                            </div>
                                            <input
                                                type="number"
                                                min="5"
                                                step="0.01"
                                                value={rechargeAmount}
                                                onChange={handleCustomAmount}
                                                placeholder="Enter amount"
                                                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors"
                                                required
                                            />
                                        </div>
                                        {currentAmount < 5 && currentAmount > 0 && (
                                            <p className="text-red-500 text-sm mt-2">Minimum recharge amount is $5</p>
                                        )}
                                    </div>

                                    {/* Summary */}
                                    {currentAmount >= 5 && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Recharge Summary</h4>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-blue-700 dark:text-blue-300">Amount:</span>
                                                <span className="font-semibold text-blue-900 dark:text-blue-100">${currentAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-blue-700 dark:text-blue-300">Rate:</span>
                                                <span className="text-blue-900 dark:text-blue-100">$0.01 / min</span>
                                            </div>
                                            <div className="border-t border-blue-200 dark:border-blue-700 pt-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-blue-900 dark:text-blue-100">Total Minutes:</span>
                                                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                        {minutes} min
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Button */}
                                    <button
                                        type="submit"
                                        disabled={isProcessing || currentAmount < 5}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="w-5 h-5" />
                                                Pay ${currentAmount >= 5 ? currentAmount.toFixed(2) : '0.00'}
                                            </>
                                        )}
                                    </button>

                                    {/* Security Note */}
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            Secure payment processed with encryption
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <h1 className='text-center dark:text-stone-100 text-gray-600'>Note: You will get features of your current plan only</h1>
                </div>
                <Footer />
            </div>

            {/* Floating elements */}
            <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-float"></div>
            <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
            <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
            <div className="absolute bottom-32 right-32 w-5 h-5 bg-green-400 rounded-full opacity-40 animate-float animation-delay-1500"></div>
            <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-yellow-400 rounded-full opacity-50 animate-float animation-delay-3000"></div>
        </section>
    );
};

export default Recharge;