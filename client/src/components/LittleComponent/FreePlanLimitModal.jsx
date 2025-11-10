import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FreePlanLimitModal = ({ isOpen, message, onClose }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-[90%] max-w-md relative text-center animate-fade-in-up border border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-3 cursor-pointer right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-blue-600 mb-2">
          Free Plan Limit Reached
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message ||
            "You're on the free plan — audio uploads are limited to 30 minutes. Upgrade your plan to continue with longer recordings."}
        </p>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate("/pricing")}
            className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg transition-all"
          >
            Upgrade Plan
          </button>
          <button
            onClick={onClose}
            className="border border-gray-400 cursor-pointer dark:border-gray-600 px-5 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default FreePlanLimitModal;
