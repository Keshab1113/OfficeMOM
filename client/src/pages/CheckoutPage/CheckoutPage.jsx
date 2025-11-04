import React, { useState } from "react";
import {
    ShoppingBag,
    CreditCard,
    ShieldCheck,
    Lock,
    ArrowRight,
    Check,
    Home,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../components/ToastContext";
import axios from "axios";
import { useSelector } from "react-redux";
import { Helmet } from "react-helmet";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";
import Footer from "../../components/Footer/Footer";

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

const breadcrumbItems = [{ label: "Pricing", href: "/pricing" }, { label: "Checkout" }];

const CheckoutPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const plan = location.state?.selectedPlan;
    const billingCycle = location.state?.billingCycle;
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const { addToast } = useToast();
    const { token } = useSelector((state) => state.auth);

    const handleCheckout = async () => {
        setLoadingCheckout(true);
        if (!paymentMethod) {
            addToast("error", "Please select a payment method");
            setLoadingCheckout(false);
            return;
        }

        try {
            const finalPrice =
                billingCycle === "yearly"
                    ? plan?.yearlyPrice
                    : plan?.price;

            // Get the correct priceID based on billing cycle
            const priceID =
                billingCycle === "yearly"
                    ? plan?.yearly_priceID
                    : plan?.priceID;

            const requestData = {
                plan: plan?.name,
                paymentMethods: [paymentMethod],
                billingCycle: billingCycle,
                price: finalPrice,
            };

            if (priceID) {
                requestData.priceID = priceID;
            }

            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL
                }/api/stripe/create-checkout-session`,
                requestData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.data.url) {
                setLoadingCheckout(false);
                window.location.href = res.data.url;
            }
        } catch (err) {
            setLoadingCheckout(false);
            console.error("Checkout error:", err);
            addToast("error", "Failed to process checkout. Please try again.");
        }
    };
    // Redirect if no plan is selected
    React.useEffect(() => {
        if (!plan) {
            navigate("/pricing");
        }
    }, [plan, navigate]);

    if (!plan) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-16 h-16 text-gray-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirecting to pricing...</p>
                </div>
            </div>
        );
    }

    const displayPrice =
        billingCycle === "yearly" ? plan.yearlyPrice : plan.price;
    const priceLabel = billingCycle === "yearly" ? "/year" : "/month";
    const originalYearlyPrice = plan.price * 12;

    return (
        <>
            <Helmet>
                <meta charSet="utf-8" />
                <title>Smart Minutes of the Meeting (OfficeMoM) | UserProfile</title>
                <link rel="canonical" href="https://officemom.me/profile" />
            </Helmet>
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
                    <div className="min-h-screen py-10 lg:py-10 px-4 lg:px-4 2xl:px-0 flex flex-col md:gap-12 gap-8 container mx-auto">
                        <Breadcrumb items={breadcrumbItems} />
                        <div className=" gap-8 space-y-4">
                            {/* Header Navigation */}
                            <div className=" py-6 dark:text-white text-black">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <h3 className="text-2xl md:text-4xl font-bold">Complete Your Purchase</h3>
                                </div>
                                <p className="text-purple-100">Secure checkout for {plan.name} plan</p>
                            </div>

                            {/* Main Content */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">


                                <div className="flex flex-col lg:flex-row">
                                    {/* LEFT SIDE — Product Info */}
                                    <div className="lg:w-2/5 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 p-6 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
                                        <div className="flex flex-col items-center text-center">
                                            {plan.image && (
                                                <div className="relative mb-4">
                                                    <img
                                                        src={plan.image}
                                                        alt={plan.name}
                                                        className="w-32 h-32 object-cover rounded-2xl shadow-lg border-4 border-white dark:border-gray-800"
                                                    />
                                                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                                        POPULAR
                                                    </div>
                                                </div>
                                            )}

                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                {plan.name}
                                            </h3>

                                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 w-full mb-4">
                                                <div className="flex items-baseline justify-center gap-1">
                                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                                        ${displayPrice}
                                                    </span>
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        {priceLabel}
                                                    </span>
                                                </div>
                                                {billingCycle === "yearly" && plan.price > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                                            ${originalYearlyPrice}/year
                                                        </div>
                                                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                                                            Save $
                                                            {(originalYearlyPrice - plan.yearlyPrice).toFixed(
                                                                0
                                                            )}{" "}
                                                            per year
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Billed annually
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                                                {plan.description?.replaceAll('"', "")}
                                            </p>

                                            {plan.features && plan.features.length > 0 && (
                                                <div className="w-full space-y-3">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white text-left flex items-center gap-2">
                                                        <Check size={16} className="text-green-500" />
                                                        What's included:
                                                    </h4>
                                                    <ul className="space-y-2 text-left">
                                                        {plan.features.map((f, i) => (
                                                            <li
                                                                key={i}
                                                                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                                                            >
                                                                <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                    <Check
                                                                        size={12}
                                                                        className="text-green-600 dark:text-green-400"
                                                                    />
                                                                </div>
                                                                <span>{f.name || f}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* RIGHT SIDE — Payment Options */}
                                    <div className="lg:w-3/5 p-6">
                                        <div className="mb-6">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                                <CreditCard size={20} className="text-purple-500" />
                                                Choose Payment Method
                                            </h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                Select your preferred way to pay securely
                                            </p>
                                            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                                                        Billing Cycle:
                                                    </span>
                                                    <span className="text-sm text-blue-700 dark:text-blue-200 font-semibold capitalize">
                                                        {billingCycle}
                                                        {billingCycle === "yearly" && (
                                                            <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                                Save 10%
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-6 max-h-50 overflow-y-auto pr-2">
                                            {paymentOptions.map((option) => (
                                                <div
                                                    key={option.value}
                                                    onClick={() =>
                                                        !option.disabled && setPaymentMethod(option.value)
                                                    }
                                                    className={`flex items-center gap-4 px-4 py-2 rounded-xl border-2 transition-all cursor-pointer group ${option.disabled
                                                        ? "opacity-50 cursor-not-allowed grayscale"
                                                        : "hover:border-purple-500 hover:shadow-lg"
                                                        } ${paymentMethod === option.value
                                                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md"
                                                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                                        }`}
                                                >
                                                    <div
                                                        className={`p-2 rounded-lg ${paymentMethod === option.value
                                                            ? "bg-purple-500 text-white"
                                                            : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30"
                                                            }`}
                                                    >
                                                        <span className="text-xl">{option.icon}</span>
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-900 dark:text-white">
                                                            {option.label}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {option.description}
                                                        </div>
                                                    </div>

                                                    {paymentMethod === option.value && (
                                                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <Check size={14} className="text-white" />
                                                        </div>
                                                    )}

                                                    {!option.disabled && paymentMethod !== option.value && (
                                                        <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full flex-shrink-0"></div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Security Badge */}
                                        <div className="flex items-center justify-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 mb-4">
                                            <ShieldCheck
                                                size={20}
                                                className="text-green-600 dark:text-green-400"
                                            />
                                            <span className="text-sm text-green-800 dark:text-green-300 font-medium">
                                                Secure SSL Encryption • 256-bit Security
                                            </span>
                                        </div>

                                        <button
                                            onClick={handleCheckout}
                                            disabled={!paymentMethod || loadingCheckout}
                                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 cursor-pointer rounded-xl font-bold shadow-lg transition-all duration-200 transform  active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed group"
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {loadingCheckout ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        <span>Processing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Complete Purchase</span>
                                                        <ArrowRight
                                                            size={20}
                                                            className="group-hover:translate-x-1 transition-transform"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </button>

                                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-center gap-2">
                                            <Lock size={14} />
                                            Payments secured by Stripe. Your financial data is encrypted and
                                            protected.
                                        </p>

                                        {/* Trust badges */}
                                        <div className="flex justify-center gap-4 mt-2 opacity-60">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                PCI Compliant
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">•</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                SSL Secure
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">•</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                GDPR Ready
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Footer />
                </div>
                <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-float"></div>
                <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
                <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
                <div className="absolute bottom-32 right-32 w-5 h-5 bg-green-400 rounded-full opacity-40 animate-float animation-delay-1500"></div>
                <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-yellow-400 rounded-full opacity-50 animate-float animation-delay-3000"></div>
            </section>
        </>
    );
};

export default CheckoutPage;