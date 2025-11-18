import React from 'react';
import { Clock, CheckCircle, XCircle, Loader2, PauseCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProcessingHistory = ({ processingItems = [] }) => {
    const navigate = useNavigate();

    const getStatusIcon = (status, awaitingHeaders) => {
        if (awaitingHeaders) {
            return <PauseCircle className="w-5 h-5 text-yellow-500" />;
        }
        
        switch (status) {
            case 'transcribing':
                return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
            case 'generating_mom':
                return <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />;
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'awaiting_headers':
                return <PauseCircle className="w-5 h-5 text-yellow-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusText = (status, progress, awaitingHeaders, taskType) => {
        if (awaitingHeaders) {
            return '⏸️ Awaiting Headers';
        }

        if (taskType) {
            return taskType;
        }
        
        if (status === 'transcribing') {
            if (progress < 30) return 'Uploading...';
            if (progress < 70) return 'Transcribing...';
            return 'Processing transcript...';
        }
        if (status === 'generating_mom') {
            if (progress < 85) return 'Generating MoM...';
            return 'Finalizing...';
        }
        if (status === 'awaiting_headers') return '⏸️ Set Headers to Continue';
        if (status === 'completed') return 'Completed ✓';
        if (status === 'failed') return 'Failed';
        return 'Queued';
    };

    const getProgressColor = (progress, awaitingHeaders) => {
        if (awaitingHeaders) return 'bg-yellow-500';
        if (progress < 30) return 'bg-blue-500';
        if (progress < 70) return 'bg-indigo-500';
        if (progress < 100) return 'bg-purple-500';
        return 'bg-green-500';
    };

    const handleItemClick = (item) => {
        if (item.awaitingHeaders) {
            navigate(`/generate-notes/meeting-result/${item.id}`);
        }
    };

    if (processingItems.length === 0) {
        return (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 h-full">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
                    <Loader2 className="w-5 h-5 mr-2 text-blue-500" />
                    Processing History
                </h2>
                <div className="flex flex-col items-center justify-center h-[calc(100%-3rem)] text-gray-500 dark:text-gray-400">
                    <Clock className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-center">No items processing</p>
                    <p className="text-xs text-center mt-1">Upload audio to see progress</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 h-full overflow-hidden">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
                <Loader2 className="w-5 h-5 mr-2 text-blue-500 animate-spin" />
                Processing History ({processingItems.length})
            </h2>
            <div className="space-y-3 overflow-y-auto h-[calc(100%-3rem)] pr-2">
                {processingItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600 hover:shadow-md transition-all ${
                            item.awaitingHeaders ? 'cursor-pointer hover:border-yellow-400 hover:scale-[1.02]' : ''
                        }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                {getStatusIcon(item.status, item.awaitingHeaders)}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-sm text-gray-800 dark:text-white truncate">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {getStatusText(item.status, item.progress, item.awaitingHeaders, item.taskType)}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-2">
                                {item.progress}%
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full ${getProgressColor(item.progress, item.awaitingHeaders)} transition-all duration-500 ease-out`}
                                style={{ width: `${item.progress}%` }}
                            >
                                {item.progress > 95 && !item.awaitingHeaders && (
                                    <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                )}
                            </div>
                        </div>

                        {item.awaitingHeaders && (
                            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-semibold flex items-center gap-1">
                                <PauseCircle className="w-3 h-3" />
                                Click to set headers and continue
                            </div>
                        )}

                        {item.error && (
                            <p className="text-xs text-red-500 mt-2 truncate">
                                Error: {item.error}
                            </p>
                        )}

                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Source: {item.source}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProcessingHistory;