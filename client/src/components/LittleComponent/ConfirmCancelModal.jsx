import React, { useState } from "react";

const ConfirmCancelModal = ({ isOpen, onClose, onConfirm }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm(); // Wait for async operation
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-[90%] max-w-md rounded-2xl shadow-xl p-6 relative">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Confirm Subscription Cancellation
        </h2>

        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
          Are you sure you want to cancel your subscription? After submitting the
          request, your plan will be cancelled, and we will initiate a refund within{" "}
          <b>15 working days</b>.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={!isLoading ? onClose : undefined}
            disabled={isLoading}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
              text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm rounded-lg font-medium text-white transition 
              ${isLoading 
                ? "bg-red-400 cursor-not-allowed" 
                : "bg-red-600 hover:bg-red-700"}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
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
                Processing...
              </span>
            ) : (
              "Submit"
            )}
          </button>
        </div>

        <button
          onClick={!isLoading ? onClose : undefined}
          disabled={isLoading}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ConfirmCancelModal;
