import React from 'react';
import { AlertCircle, Clock, RefreshCw, XCircle } from 'lucide-react';

const ResumeMeetingModal = ({ meeting, onResume, onStartNew, onClose }) => {
  if (!meeting) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Incomplete Meeting Found
              </h2>
              <p className="text-sm text-white/80">
                Would you like to continue?
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Meeting Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                meeting.status === 'recording' 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {meeting.status === 'recording' ? '🔴 Recording' : '⏸️ Paused'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {formatDuration(meeting.duration_seconds || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Started</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {formatDate(meeting.created_at)}
              </span>
            </div>

            {meeting.chunk_count > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Audio Chunks</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {meeting.chunk_count} recorded
                </span>
              </div>
            )}
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Starting a new meeting will discard the current recording data.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
          <button
            onClick={onStartNew}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Start New
          </button>
          
          <button
            onClick={onResume}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Resume Meeting
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeMeetingModal;