import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";

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
    // Simple invoice generation (you can enhance this with PDF generation)
    const invoiceContent = `
      OFFICE MOM INVOICE
      ==================
      
      Plan: ${paymentDetails?.plan_name}
      Billing Cycle: ${paymentDetails?.billing_cycle}
      Amount: $${paymentDetails?.amount} ${paymentDetails?.currency}
      Status: ${paymentDetails?.payment_status}
      Customer: ${
        paymentDetails?.customer_name || paymentDetails?.customer_email
      }
      Date: ${new Date(paymentDetails?.created_at).toLocaleDateString()}
      
      Thank you for your purchase!
    `;

    const blob = new Blob([invoiceContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${paymentDetails?.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    <section className="relative w-full min-h-screen overflow-hidden ">
      <div className="absolute inset-0">
        {/* Floating particles */}
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

        {/* Gradient orbs */}
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
      {/* Main content */}
      <div className="relative overflow-y-auto  overflow-scroll z-10  flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div
          className={`text-center transform transition-all duration-1000 ${
            isVisible
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-10 opacity-0 scale-95"
          }`}
        >
          {/* Success icon */}
          <div className="mb-8 flex justify-center">
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
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold 
            bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 
            dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 
            bg-clip-text text-transparent mb-6 leading-tight"
          >
            Payment Successful!
          </h1>
          <div className="flex md:flex-row flex-col">
            {/* Payment Details Card */}
            {paymentDetails && (
              <div className="mb-8 max-w-md mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-200 dark:border-emerald-600">
                <h3 className="text-xl font-semibold text-emerald-700 dark:text-emerald-400 mb-4">
                  Order Confirmation
                </h3>

                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Plan:
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {paymentDetails.plan_name}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Billing Cycle:
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {paymentDetails.billing_cycle}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Amount:
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ${paymentDetails.amount} {paymentDetails.currency}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Status:
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {paymentDetails.payment_status}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Date:
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {new Date(paymentDetails.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Download Invoice Button */}
                <button
                  onClick={downloadInvoice}
                  className="w-full mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
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
                  Download Invoice
                </button>
              </div>
            )}
            <div className=" flex flex-col">
              {/* Subheading */}
              <div className="mb-8">
                <p
                  className="text-xl sm:text-2xl lg:text-3xl 
              text-emerald-700 dark:text-emerald-400 font-semibold mb-2 animate-fade-in2"
                >
                  🎉 Welcome aboard! 🚀
                </p>
                <p
                  className="text-base sm:text-lg 
              text-emerald-600 dark:text-emerald-300 
              max-w-md mx-auto opacity-90"
                >
                  Your journey begins now. Get ready for an amazing experience!
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => nav(token ? "/meeting" : "/login")}
                  className="group cursor-pointer relative px-8 py-4 
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
                  onClick={() => nav("/billing")}
                  className="px-8 cursor-pointer py-4 border-2 border-emerald-500 
                dark:border-emerald-400 
                text-emerald-600 dark:text-emerald-300 
                font-semibold rounded-full hover:bg-emerald-50 dark:hover:bg-gray-800 
                transform hover:scale-105 transition-all duration-300 ease-out"
                >
                  View Billing History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Floating emoji elements */}
      <div className="absolute top-10 right-10 text-6xl animate-spin-slow2 opacity-20 dark:opacity-30">
        ⭐
      </div>
      <div
        className="absolute bottom-10 left-10 text-4xl animate-bounce opacity-30 dark:opacity-40"
        style={{ animationDelay: "0.5s" }}
      >
        🎈
      </div>
      <div
        className="absolute top-1/3 left-10 text-3xl animate-pulse opacity-25 dark:opacity-40"
        style={{ animationDelay: "1s" }}
      >
        ✨
      </div>
      <div
        className="absolute bottom-1/3 right-10 text-5xl animate-bounce opacity-20 dark:opacity-35"
        style={{ animationDelay: "1.5s" }}
      >
        🎊
      </div>
    </section>
  );
};

export default Success;
