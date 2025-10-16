import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { Helmet } from "react-helmet";

const Success = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState([]);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    setIsVisible(true);

    // Generate floating particles
    const particleArray = [];
    for (let i = 0; i < 20; i++) {
      particleArray.push({
        id: i,
        left: Math.random() * 100,
        animationDelay: Math.random() * 3,
        size: Math.random() * 8 + 4,
      });
    }
    setParticles(particleArray);

    // Fetch payment details
    const sessionId = searchParams.get("session_id");
    if (sessionId && token) {
      fetchPaymentDetails(sessionId);
    } else {
      setLoading(false);
    }
  }, [searchParams, token]);

  const fetchPaymentDetails = async (sessionId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/stripe/payment-success`,
        {
          params: { session_id: sessionId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setPaymentDetails(response.data.payment);
      }
    } catch (error) {
      console.error("Failed to fetch payment details:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = () => {
    if (paymentDetails?.invoice_pdf) {
      // Open Stripe invoice PDF in new tab
      window.open(paymentDetails.invoice_pdf, "_blank");
    } else {
      alert(
        "Invoice PDF is not available yet. Please try again later or contact support."
      );
    }
  };

  const viewInvoice = () => {
    if (paymentDetails?.invoice_pdf) {
      window.open(paymentDetails.invoice_pdf, "_blank");
    } else {
      alert(
        "Invoice PDF is not available yet. Please try again later or contact support."
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-emerald-600 dark:text-emerald-400">
            Loading your payment details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | Payment-Success</title>
        <link rel="canonical" href="https://officemom.me/success" />
      </Helmet>
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
          </div>

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
          </div>
        </div>

        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll pb-10">
          <div className="relative w-full min-h-screen overflow-hidden py-10">
            <div className="absolute inset-0">
              {particles.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute w-2 h-2 bg-emerald-300 dark:bg-emerald-600 
              rounded-full opacity-60 animate-bounce"
                  style={{
                    left: `${particle.left}%`,
                    animationDelay: `${particle.animationDelay}s`,
                    animationDuration: "3s",
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                  }}
                />
              ))}

              <div
                className="absolute top-20 left-20 w-64 h-64 
          bg-gradient-to-r from-emerald-300 to-teal-300 dark:from-emerald-700 dark:to-teal-700 
          rounded-full opacity-20 animate-pulse"
              ></div>
              <div
                className="absolute bottom-20 right-20 w-96 h-96 
            bg-gradient-to-r from-cyan-300 to-emerald-300 dark:from-cyan-700 dark:to-emerald-700 
            rounded-full opacity-15 animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>

            <div className="relative z-10 flex items-center justify-center px-4 sm:px-6 lg:px-8">
              <div
                className={`text-center transform transition-all duration-1000 w-full max-w-4xl ${
                  isVisible
                    ? "translate-y-0 opacity-100 scale-100"
                    : "translate-y-10 opacity-0 scale-95"
                }`}
              >
                {/* Success icon */}
                <div className="mb-3 flex justify-center">
                  <div className="relative">
                    <div
                      className="w-24 h-24 sm:w-32 sm:h-32 
                bg-gradient-to-r from-emerald-400 to-teal-500 
                dark:from-emerald-600 dark:to-teal-700 
                rounded-full flex items-center justify-center shadow-2xl animate-pulse"
                    >
                      <svg
                        className="w-12 h-12 sm:w-16 sm:h-16 text-white animate-bounce"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    {/* Ripple */}
                    <div
                      className="absolute inset-0 rounded-full 
                bg-emerald-400 dark:bg-emerald-600 
                opacity-25 animate-ping"
                    ></div>
                  </div>
                </div>

                {/* Heading */}
                <h1
                  className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold 
            bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 
            dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 
            bg-clip-text text-transparent mb-6 leading-tight"
                >
                  Payment Successful!
                </h1>

                <div className="flex flex-col">
                  {paymentDetails && (
                    <div className="mb-6 w-full mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-200 dark:border-emerald-600">
                      <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-6 text-center">
                        Subscription Confirmed 🎉
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Subscription Details */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                            Subscription Details
                          </h4>

                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">
                                Plan:
                              </span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {paymentDetails.plan_name}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">
                                Billing Cycle:
                              </span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                                {paymentDetails.billing_cycle}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">
                                Amount:
                              </span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                ${paymentDetails.amount}{" "}
                                {paymentDetails.currency}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">
                                Status:
                              </span>
                              <span className="font-semibold text-green-600 dark:text-green-400 capitalize">
                                {paymentDetails.payment_status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Billing Period */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                            Billing Period
                          </h4>

                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">
                                Current Period:
                              </span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                                {new Date(
                                  paymentDetails.current_period_start
                                ).toLocaleDateString()}{" "}
                                <br />
                                to <br />
                                {new Date(
                                  paymentDetails.current_period_end
                                ).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">
                                Subscription ID:
                              </span>
                              <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                                {paymentDetails.stripe_subscription_id?.slice(
                                  -8
                                )}
                              </span>
                            </div>

                            {paymentDetails.invoice_number && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">
                                  Invoice #:
                                </span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {paymentDetails.invoice_number}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Invoice Actions */}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          {paymentDetails.invoice_pdf ? (
                            <>
                              <button
                                onClick={viewInvoice}
                                className="flex-1 cursor-pointer px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold hover:shadow-lg"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                View Official Invoice
                              </button>

                              <button
                                onClick={downloadInvoice}
                                className="flex-1 cursor-pointer px-6 py-2 border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                Download Invoice PDF
                              </button>
                            </>
                          ) : (
                            <div className="text-center w-full py-4">
                              <p className="text-amber-600 dark:text-amber-400 mb-3">
                                ⏳ Your official invoice is being generated...
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                It may take a few moments. You can check your
                                email or visit the subscription page later to
                                download it.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={() => nav(token ? "/meeting" : "/login")}
                      className="group cursor-pointer relative px-8 py-3 
                bg-gradient-to-r from-emerald-500 to-teal-600 
                dark:from-emerald-600 dark:to-teal-700
                text-white font-semibold rounded-full shadow-xl hover:shadow-2xl 
                transform hover:scale-105 transition-all duration-300 ease-out"
                    >
                      <span className="relative z-10">Get Started</span>
                      <div
                        className="absolute inset-0 
                bg-gradient-to-r from-emerald-600 to-teal-700 
                dark:from-emerald-700 dark:to-teal-800 
                rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      ></div>
                    </button>

                    <button
                      onClick={() => nav("/subscription")}
                      className="px-8 cursor-pointer py-3 border-2 border-emerald-500 
                dark:border-emerald-400 
                text-emerald-600 dark:text-emerald-300 
                font-semibold rounded-full hover:bg-emerald-50 dark:hover:bg-gray-800 
                transform hover:scale-105 transition-all duration-300 ease-out"
                    >
                      Manage Subscription
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute top-10 right-10 text-6xl animate-spin-slow opacity-20 dark:opacity-30">
              ⭐
            </div>
            <div
              className="absolute bottom-10 left-10 text-4xl animate-bounce opacity-30 dark:opacity-40"
              style={{ animationDelay: "0.5s" }}
            >
              🎈
            </div>
          </div>
        </div>
        <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-float"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
        <div className="absolute bottom-32 right-32 w-5 h-5 bg-green-400 rounded-full opacity-40 animate-float animation-delay-1500"></div>
      </section>
    </>
  );
};

export default Success;
