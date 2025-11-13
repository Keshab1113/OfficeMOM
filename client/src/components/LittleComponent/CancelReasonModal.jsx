import React from "react";

const reasons = [
  "The meeting notes/transcription quality didn’t meet my expectations",
  "The AI summaries aren't accurate enough for my use case",
  "The plan feels too expensive for me right now",
  "I no longer need to generate meeting notes",
  "I switched to another meeting/notes tool",
  "I’m not using OfficeMoM as much as I expected",
  "The tool is too complicated or hard to use",
  "The processing time for long audio/video files is too slow",
  "I faced issues while uploading audio or video files",
  "Features I expected are missing or incomplete",
  "I want to pause my subscription for now",
  "Others",
];


const CancelReasonModal = ({ isOpen, onClose, onSelectReason }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-[90%] max-w-lg rounded-2xl shadow-xl p-6 relative">

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          We're sorry to see you go 💔
        </h2>

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          We'd love to understand why you're leaving so we can improve your experience.
        </p>

        <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200">
          Why are you canceling your plan?
        </h3>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {reasons.map((reason, idx) => (
            <button
              key={idx}
              onClick={() => onSelectReason(reason)}
              className="w-full text-left px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200"
            >
              {reason}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 cursor-pointer px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Keep subscribing
        </button>

        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>

      </div>
    </div>
  );
};

export default CancelReasonModal;
