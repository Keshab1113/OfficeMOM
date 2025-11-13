import React from "react";
import { useNavigate } from "react-router-dom";

const ConfirmCancelModal = ({
  isOpen,
  onClose,
  onConfirm,
  nextBillingDate,
  loadingCancel
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[9999]">
      <div
        className="
        w-[90%] max-w-md rounded-2xl p-6 relative shadow-2xl
        bg-white text-gray-900
        dark:bg-[#1E1E1E] dark:text-white
      "
      >
        {/* Close Button */}
        <button
          onClick={!loadingCancel ? onClose : undefined}
          disabled={loadingCancel}
          className="
            absolute top-4 right-4 text-gray-500 hover:text-gray-700
            dark:text-gray-400 dark:hover:text-gray-200
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-2">
          We're sorry to see you go 💔
        </h2>

        {/* Description */}
        <p
          className="
          text-gray-700 text-[15px] leading-relaxed mb-6
          dark:text-gray-300
        "
        >
          Your plan and remaining credits will stay active till the end of this
          billing period <b>({nextBillingDate})</b>.
          <br />
          <br />
          No renewal or payment collection will happen afterwards.
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          {/* Continue Unsubscribe */}
          <button
            onClick={!loadingCancel ? onConfirm : undefined}
            disabled={loadingCancel}
            className="
              w-full py-3 rounded-lg font-medium
              bg-gray-200 hover:bg-gray-300 text-gray-900
              dark:bg-[#2D2D2D] dark:hover:bg-[#3A3A3A] dark:text-white
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {loadingCancel ? (
              <span className="flex justify-center items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-gray-800 dark:text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 00-8 8z"
                  ></path>
                </svg>
                Cancelling subscription...
              </span>
            ) : (
              "Continue unsubscribe"
            )}
          </button>

          {/* Keep Subscription */}
          <button
            onClick={!loadingCancel ? onClose : undefined}
            disabled={loadingCancel}
            className="
              w-full py-3 rounded-lg font-medium
              bg-gray-100 hover:bg-gray-200 text-gray-800
              dark:bg-[#3A3A3A] dark:hover:bg-[#4A4A4A] dark:text-gray-200
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            Keep subscription
          </button>

          {/* Talk to us */}
          <button
            onClick={!loadingCancel ? () => navigate("/contact-us") : undefined}
            disabled={loadingCancel}
            className="
              w-full py-3 rounded-lg font-medium text-white
              bg-indigo-500 hover:bg-indigo-600
              dark:bg-[#685BFF] dark:hover:bg-[#5748ff]
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            Talk to us
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCancelModal;
