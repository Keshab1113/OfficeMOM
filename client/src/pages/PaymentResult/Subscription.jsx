import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  CreditCard,
  Download,
  Eye,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Helmet } from "react-helmet";
import ConfirmCancelModal from "../../components/LittleComponent/ConfirmCancelModal";
import { useToast } from "../../components/ToastContext";

const Subscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector((state) => state.auth);
  const nav = useNavigate();
  const navigate = useNavigate();
  const { addToast } = useToast();

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
        ).catch(err => {
          console.error('Subscription details error:', err);
          throw new Error(err.response?.data?.error || 'Failed to load subscription details');
        }),
        axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/stripe/billing-history`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ).catch(err => {
          console.error('Billing history error:', err);
          // Don't throw error for billing history, just log it
          return { data: { success: true, data: [] } };
        }),
      ]);

      console.log("Subscription response:", subscriptionRes);

      if (subscriptionRes.data.success) {
        setSubscription(subscriptionRes.data.data);
      } else {
        throw new Error(subscriptionRes.data.error || 'Failed to load subscription');
      }

      if (billingRes.data.success) {
        setBillingHistory(billingRes.data.data);
      }

    } catch (err) {
      console.error('Fetch subscription data error:', err);
      setError(err.message || "Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    setShowModal(false);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/stripe/cancel-subscription`,
        { subscriptionId: subscription.stripe_subscription_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchSubscriptionData();
      addToast("success", "Subscription cancellation requested successfully!");
    } catch (err) {
      console.error("Failed to cancel subscription", err);
      const errorMsg = err.response?.data?.error || "Failed to cancel subscription";
      addToast("error", errorMsg || "Failed to cancel subscription");
    }
  };

  const downloadInvoice = (invoicePdf, invoiceId) => {
    if (invoicePdf) {
      window.open(invoicePdf, "_blank");
    } else {
      alert("Invoice not available");
    }
  };

  const viewInvoice = (invoicePdf) => {
    if (invoicePdf) {
      window.open(invoicePdf, "_blank");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "canceled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "past_due":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-50 border-green-200";
      case "canceled":
        return "text-red-600 bg-red-50 border-red-200";
      case "past_due":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Loading subscription details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center text-center">
              {/* Icon with animated background */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-red-100 dark:bg-red-900/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-red-50 dark:bg-red-900/30 p-4 rounded-full">
                  <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400" />
                </div>
              </div>

              {/* Error heading */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Something Went Wrong
              </h3>

              {/* Error message */}
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                {error}
              </p>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={fetchSubscriptionData}
                  className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all duration-200 shadow-lg shadow-indigo-500/30 font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  onClick={() => navigate("/contact-us")}
                  className="flex-1 cursor-pointer px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all duration-200 font-medium"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Smart Minutes of the Meeting (OfficeMoM) | Subscription</title>
        <link rel="canonical" href="https://officemom.me/subscription" />
      </Helmet>
      <section className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
          </div>
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
          </div>
        </div>
        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll pb-10 ">
          <div className="min-h-screen lg:px-0 md:px-4 px-4 py-10 lg:py-10 flex flex-col container mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Subscription Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your subscription and billing information
              </p>
            </div>

            {!subscription ? (
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Active Subscription0
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You don't have an active subscription. Upgrade to unlock
                  premium features.
                </p>
                <button
                  onClick={() => nav("/pricing")}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  View Plans
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Subscription Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Current Subscription Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Current Plan
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          Manage your subscription and billing
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(
                          subscription.subscription_status
                        )}`}
                      >
                        {getStatusIcon(subscription.subscription_status)}
                        <span className="text-sm font-medium capitalize">
                          {subscription.subscription_status?.replace(
                            "_",
                            " "
                          ) || "Unknown"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 border-b pb-2">
                          Plan Details
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Plan Name:
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {subscription.plan_name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Billing Cycle:
                            </span>
                            {subscription.plan_name === "Free" ? (
                              <span className="font-semibold text-gray-900 dark:text-white">
                                N/A
                              </span>) : (
                              <span className="font-semibold text-gray-900 dark:text-white capitalize">
                                {subscription.billing_cycle}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Amount:
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              ${subscription.amount} {subscription.currency}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 border-b pb-2">
                          Billing Period
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Current Period:
                            </span>
                            {subscription.plan_name === "Free" ? (
                              <span className="font-semibold text-gray-900 dark:text-white">
                                Life Time
                              </span>) : (
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {new Date(
                                  subscription.created_at
                                ).toLocaleDateString()}{" "}
                                -{" "}
                                {(() => {
                                  const startDate = new Date(
                                    subscription.created_at
                                  );
                                  let endDate = new Date(startDate);

                                  if (subscription.billing_cycle === "yearly") {
                                    endDate.setFullYear(
                                      endDate.getFullYear() + 1
                                    );
                                  } else if (
                                    subscription.billing_cycle === "monthly"
                                  ) {
                                    endDate.setMonth(endDate.getMonth() + 1);
                                  }

                                  return endDate.toLocaleDateString();
                                })()}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Auto Renewal:
                            </span>
                            {subscription.plan_name === "Free" ? (
                              <span className="font-semibold text-gray-900 dark:text-white">
                                N/A
                              </span>) : (
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {subscription.subscription_status === "active"
                                  ? "Enabled"
                                  : "Disabled"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>


                    <div className="flex md:flex-row flex-col gap-3">
                      {(subscription.subscription_status === "active" && subscription.plan_name != "Free") && (
                        <button
                          onClick={() => setShowModal(true)}
                          className="px-4 cursor-pointer py-2 border border-red-300 text-red-600 dark:text-red-400 
                        hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          Cancel Subscription
                        </button>
                      )}
                      <button
                        onClick={() => nav("/pricing")}
                        className="px-4 cursor-pointer py-2 border border-green-300 text-green-600 dark:text-green-400 
                        hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      >
                        Upgrade Subscription
                      </button>
                    </div>

                  </div>

                  {/* Billing History */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6  mb-20">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Billing History
                    </h2>

                    {billingHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                          No billing history found
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[20rem] overflow-y-auto">
                        {billingHistory.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-4 border border-gray-200 
                          dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {payment.plan_name}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(
                                    payment.created_at
                                  ).toLocaleDateString()}{" "}
                                  • ${payment.amount} {payment.currency}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${payment.payment_status === "paid"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                  }`}
                              >
                                {payment.payment_status}
                              </span>

                              {payment.invoice_pdf && (
                                <>
                                  <button
                                    onClick={() =>
                                      viewInvoice(payment.invoice_pdf)
                                    }
                                    className="p-2 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    title="View Invoice"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      downloadInvoice(
                                        payment.invoice_pdf,
                                        payment.stripe_invoice_id
                                      )
                                    }
                                    className="p-2 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    title="Download Invoice"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar - Quick Actions */}
                <div className="space-y-6">
                  {/* Account Summary */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Account Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Customer ID:
                        </span>

                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          {subscription.stripe_customer_id?.slice(-8) || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Subscription ID:
                        </span>
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          {subscription.stripe_subscription_id?.slice(-8) || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Member Since:
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(
                            subscription.created_at
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Support Card */}
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-6">
                    <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                      Need Help?
                    </h3>
                    <p className="text-indigo-700 dark:text-indigo-300 text-sm mb-4">
                      Having issues with your subscription or billing? Our
                      support team is here to help.
                    </p>
                    <button
                      onClick={() => navigate("/contact-us")}
                      className="w-full cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <ConfirmCancelModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={cancelSubscription}
        />
        <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-float"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
        <div className="absolute bottom-32 right-32 w-5 h-5 bg-green-400 rounded-full opacity-40 animate-float animation-delay-1500"></div>
      </section>
    </>
  );
};

export default Subscription;
