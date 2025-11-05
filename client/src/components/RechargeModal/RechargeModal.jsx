import React from 'react';
import { X, Clock, Zap, CreditCard } from 'lucide-react';

const RechargeModal = ({ 
  isOpen, 
  onClose, 
  requiredMinutes = 0, 
  remainingMinutes = 0,
  onRecharge 
}) => {
  if (!isOpen) return null;

  const deficit = requiredMinutes - remainingMinutes;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Insufficient Minutes</h2>
              <p className="text-white/90 text-sm">Time to recharge!</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Minutes Info */}
          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-300">Required Minutes:</span>
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {requiredMinutes}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-300">Your Balance:</span>
                <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                  {remainingMinutes}
                </span>
              </div>
              <div className="border-t-2 border-orange-200 dark:border-orange-800 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">Need to Add:</span>
                  <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {deficit} min
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Available</span>
                <span>{remainingMinutes} / {requiredMinutes} minutes</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-400 to-red-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min((remainingMinutes / requiredMinutes) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              What You'll Get:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>More audio transcriptions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>AI-powered meeting notes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Multi-language support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Priority processing</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onRecharge}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
            >
              <CreditCard className="w-5 h-5" />
              Recharge Now
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RechargeModal;