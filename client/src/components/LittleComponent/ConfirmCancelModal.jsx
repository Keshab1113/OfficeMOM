import React from "react";

const ConfirmCancelModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

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
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
              text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 
              text-white font-medium transition"
          >
            Submit
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ConfirmCancelModal;
