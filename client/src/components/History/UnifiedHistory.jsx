import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { History, FileText, MoreVertical, Check, X, Pencil, Trash2, Clock, CheckCircle, XCircle, Loader2, PauseCircle, Sparkles, AlertTriangle, RotateCcw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { removeAudioPreview } from "../../redux/audioSlice";
import { useToast } from "../ToastContext";
import { DateTime } from "luxon";

// Notification Sound
const playNotificationSound = () => {
  try {
    const audio = new Audio('/Images/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio play failed:', e));
  } catch (error) {
    console.log('Notification sound error:', error);
  }
};

// Skeleton Loading Component
const SkeletonItem = () => (
  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden relative">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    <div className="flex justify-between items-center">
      <div className="flex gap-3 justify-start items-center flex-1 min-w-0">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2 animate-pulse" />
        </div>
      </div>
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
    </div>
  </div>
);

// New Badge Component with Glowing Effect
const NewBadge = () => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{
      type: "spring",
      stiffness: 500,
      damping: 15,
      delay: 0.5
    }}
    className="relative"
  >
    {/* Glowing background effect */}
    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-sm animate-pulse" />

    {/* Main badge */}
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        boxShadow: [
          "0 0 0 0 rgba(34, 197, 94, 0.7)",
          "0 0 0 10px rgba(34, 197, 94, 0)",
          "0 0 0 0 rgba(34, 197, 94, 0)"
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "loop"
      }}
      className="relative flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-[8px] font-bold shadow-lg"
    >
      <Sparkles className="w-3 h-3" />
      NEW
    </motion.div>
  </motion.div>
);

// Processing Item Component
const ProcessingItem = ({ item, onNavigate }) => {
  const getStatusIcon = (status, awaitingHeaders) => {
    if (status === 'failed') {
      return <XCircle className="w-7 h-7 text-red-500" />;
    }
    if (awaitingHeaders) {
      return <PauseCircle className="w-5 h-5 text-yellow-500 animate-pulse" />;
    }

    switch (status) {
      case 'transcribing':
        return <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />;
      case 'generating_mom':
        return <Loader2 className="w-7 h-7 text-purple-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'awaiting_headers':
        return <PauseCircle className="w-5 h-5 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status, awaitingHeaders, taskType, error) => {
    if (status === 'failed') {
      return '❌ Failed';
    }
    if (awaitingHeaders) {
      return '⸻ Awaiting Headers';
    }
    if (taskType) {
      return taskType;
    }

    if (status === 'transcribing') return 'Transcribing...';
    if (status === 'generating_mom') return 'Generating MoM...';
    if (status === 'awaiting_headers') return '⸻ Set Headers to Continue';
    if (status === 'completed') return 'Completed ✓';
    return 'Queued';
  };

  const getProgressColor = (progress, status, awaitingHeaders) => {
    if (status === 'failed') return 'bg-red-500';
    if (awaitingHeaders) return 'bg-yellow-500';
    if (progress < 30) return 'bg-blue-500';
    if (progress < 70) return 'bg-indigo-500';
    if (progress < 100) return 'bg-purple-500';
    return 'bg-green-500';
  };

  const handleClick = () => {
    if (item.awaitingHeaders) {
      onNavigate(`/generate-notes/meeting-result/${item.id}`);
    }
  };

  const isFailed = item.status === 'failed';
  const progress = item.progress || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      className={`rounded-xl p-4 border shadow-sm transition-all ${isFailed
        ? 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-300 dark:border-red-700/50'
        : item.awaitingHeaders
          ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-700/50 cursor-pointer hover:border-yellow-400'
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700/50'
        }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getStatusIcon(item.status, item.awaitingHeaders)}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-800 dark:text-white truncate">
              {item.title || "Processing..."}
            </h3>
            <p className={`text-xs ${isFailed
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400'
              }`}>
              {getStatusText(item.status, item.awaitingHeaders, item.taskType, item.error)}
            </p>
          </div>
        </div>
        {!isFailed && (
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-300 ml-2 tabular-nums">
            {progress}%
          </span>
        )}
      </div>

      {/* Progress Bar - Hide for failed items */}
      {!isFailed && (
        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden mb-2">
          <motion.div
            className={`h-full ${getProgressColor(progress, item.status, item.awaitingHeaders)} transition-colors duration-300`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      )}

      {/* Error Message */}
      {isFailed && item.error && (
        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700/50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-700 dark:text-red-300 font-medium mb-1">
                Error Details:
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 break-words">
                {item.error}
              </p>
            </div>
          </div>

          {/* Refund Info */}
          {item.minutesRefunded && item.refundedMinutes > 0 && (
            <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-700/50">
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {item.refundedMinutes} minutes refunded automatically
              </p>
            </div>
          )}
        </div>
      )}

      {/* Awaiting Headers Message */}
      {item.awaitingHeaders && !isFailed && (
        <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-semibold flex items-center gap-1">
          <PauseCircle className="w-3 h-3" />
          Click to set headers and continue
        </div>
      )}

      {/* <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        Source: {item.source}
      </p> */}
    </motion.div>
  );
};

// Completed History Item Component
const CompletedItem = ({ item, index, isHovered, onHoverChange, onEdit, onDelete, menuOpenId, onMenuToggle, onMarkAsViewed }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const editInputRef = useRef(null);
  const { addToast } = useToast();
  const token = useSelector((state) => state.auth.token);

  const utcDate = item.date || item.uploadedAt;
  const parsed = DateTime.fromISO(utcDate, { zone: "utc" });
  const localDate = parsed.isValid
    ? parsed.setZone(DateTime.local().zoneName)
    : DateTime.fromSQL(utcDate, { zone: "utc" }).setZone(DateTime.local().zoneName);

  const formattedDate = localDate.toFormat("dd LLL yyyy, hh:mm:ss a");

  // Mark as viewed only on click
  const handleClick = () => {
    if (!item.is_viewed) {
      onMarkAsViewed(item.id);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditingTitle(item.title || item.source || "");
    onMenuToggle(null);
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 100);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingTitle("");
  };

  const saveRename = async () => {
    if (!editingTitle.trim()) {
      cancelEditing();
      return;
    }
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/history/${item.id}`,
        { title: editingTitle.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onEdit(item.id, editingTitle.trim());
      setIsEditing(false);
      setEditingTitle("");
      addToast("success", "Title updated successfully");
    } catch (err) {
      console.error("Rename error:", err);
      addToast("error", "Failed to update title");
      cancelEditing();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      saveRename();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  // Determine if item is new (not viewed)
  const isNew = !item.is_viewed;
  const isFailed = item.status === 'failed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => onHoverChange(`${item.id}-${index}`)}
      onMouseLeave={() => onHoverChange(null)}
      className={`relative rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border ${isFailed
        ? "bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-700/50"
        : isNew
          ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700/50 shadow-lg shadow-green-500/10 animate-pulse-slow"
          : isHovered === `${item.id}-${index}`
            ? "bg-white dark:bg-gray-800/50 border-purple-300 dark:border-purple-600/50 shadow-lg shadow-purple-500/10"
            : "bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50"
        }`}
    >
      {/* New Badge - Only show for non-failed items */}
      {isNew && !isFailed && (
        <div className="absolute top-3 -left-1 z-20 -rotate-45">
          <NewBadge />
        </div>
      )}

      {/* Glowing border effect for new items */}
      {isNew && !isFailed && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/20 to-emerald-400/20 dark:from-green-500/10 dark:to-emerald-500/10 animate-pulse" />
      )}

      <div className="relative z-10 flex justify-between items-start gap-3">
        <div className="flex gap-3 justify-start items-center flex-1 min-w-0">
          <motion.div
            className={`p-2 rounded-lg ${isFailed
              ? "bg-gradient-to-br from-red-500 to-pink-500 shadow-lg shadow-red-500/30"
              : isNew
                ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/30"
                : isHovered === `${item.id}-${index}`
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-md"
                  : "bg-blue-100 dark:bg-blue-900/30"
              } transition-all duration-300`}
            whileHover={{ scale: 1.05, rotate: isFailed ? 0 : 5 }}
          >
            {isFailed ? (
              <XCircle className="w-5 h-5 text-white" />
            ) : (
              <FileText
                className={`w-5 h-5 ${isNew
                  ? "text-white"
                  : isHovered === `${item.id}-${index}`
                    ? "text-white"
                    : "text-blue-600 dark:text-blue-400"
                  }`}
              />
            )}
          </motion.div>

          {isEditing ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                ref={editInputRef}
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border-2 border-purple-400 dark:border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 dark:text-gray-200 shadow-sm"
                placeholder="Enter title..."
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={saveRename}
                className="p-2 hover:bg-green-100 cursor-pointer dark:hover:bg-green-900/30 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={cancelEditing}
                className="p-2 hover:bg-red-100 cursor-pointer dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-red-600 dark:text-red-400" />
              </motion.button>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              {isFailed ? (
                <div
                  className={`font-semibold transition-colors truncate block text-sm ${isFailed
                    ? "text-red-800 dark:text-red-200"
                    : ""}`}
                >
                  {item.title || item.source || "Unknown"}
                </div>
              ) : (
                <Link
                  to={`/momGenerate/${item.id}`}
                  onClick={handleClick}
                  className={`font-semibold transition-colors truncate block text-sm ${isNew
                    ? "text-green-800 dark:text-green-200 hover:text-emerald-600 dark:hover:text-emerald-400"
                    : "text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                >
                  {item.title || item.source || "Unknown"}
                </Link>
              )}
              <div className="flex items-center gap-2 mt-1 flex-nowrap overflow-hidden">
                <span className={`text-xs whitespace-nowrap flex-shrink-0 ${isFailed
                  ? "text-red-600 dark:text-red-400"
                  : isNew
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-500 dark:text-gray-400"
                  }`}>
                  {formattedDate}
                </span>
                {/* <span className={`w-1 h-1 rounded-full ${isFailed
                  ? "bg-red-400"
                  : isNew
                    ? "bg-green-400"
                    : "bg-gray-300 dark:bg-gray-600"
                  } flex-shrink-0`} /> */}
                {/* <span className={`text-xs font-medium capitalize whitespace-nowrap truncate ${isFailed
                  ? "text-red-600 dark:text-red-400"
                  : isNew
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-purple-600 dark:text-purple-400"
                  }`}>
                  {item.source}
                </span> */}
                {isFailed && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                      Failed
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Menu button - Show for all items including failed ones */}
        {!isEditing && (
          <div className="menu-container relative">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onMenuToggle(menuOpenId === item.id ? null : item.id);
              }}
              className={`p-2 cursor-pointer rounded-lg transition-all duration-200 ${isFailed
                ? "hover:bg-red-100 dark:hover:bg-red-900/30"
                : isNew
                  ? "hover:bg-green-100 dark:hover:bg-green-900/30"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              <MoreVertical className={`w-4 h-4 ${isFailed
                ? "text-red-600 dark:text-red-400"
                : isNew
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-500 dark:text-gray-400"
                }`} />
            </motion.button>

            <AnimatePresence>
              {menuOpenId === item.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-8 -top-8 mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 border-gray-200 rounded-xl shadow-xl z-[9999] overflow-hidden"
                >
                  <div className="py-1">
                    <button
                      onClick={startEditing}
                      className="w-full cursor-pointer px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-gray-700 dark:text-gray-300 flex items-center gap-3"
                    >
                      <Pencil className="w-4 h-4" />
                      Rename
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="w-full cursor-pointer px-4 py-2.5 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 flex items-center gap-3"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Error Message for failed completed items */}
      {isFailed && item.error && (
        <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700/50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-700 dark:text-red-300 font-medium mb-1">
                Error Details:
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 break-words">
                {item.error}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Main Unified History Component
const UnifiedHistory = ({ NeedFor, height }) => {
  const [completedHistory, setCompletedHistory] = useState([]);
  const [processingItems, setProcessingItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [previousProcessingIds, setPreviousProcessingIds] = useState(new Set());

  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const { addToast } = useToast();
  const dispatch = useDispatch();

  // Sort items by date (newest first)
  const sortByDate = (items) => {
    return items.sort((a, b) => {
      const dateA = new Date(a.date || a.uploadedAt || a.createdAt);
      const dateB = new Date(b.date || b.uploadedAt || b.createdAt);
      return dateB - dateA; // Descending order (newest first)
    });
  };

  // Fetch completed history
  const fetchCompletedHistory = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let filteredData = res.data.filter((item) => item.isMoMGenerated === 1);

      if (NeedFor) {
        filteredData = filteredData.filter((item) => item.source === NeedFor);
      }

      // Sort by date
      const sortedData = sortByDate(filteredData);
      setCompletedHistory(sortedData);
    } catch (err) {
      console.error("Get history error:", err);
    }
  };

  // Fetch processing items
  const fetchProcessingItems = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/process/history/processing`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let items = response.data.processingItems || [];

      // Filter by source if needed
      if (NeedFor) {
        items = items.filter((item) => item.source === NeedFor);
      }

      // Sort by date
      const sortedItems = sortByDate(items);

      // Create a map of current processing items for easy lookup
      const currentItemsMap = new Map(sortedItems.map(item => [item.id, item]));

      // Check for items that were in previous state but not in current
      const disappearedItems = [...previousProcessingIds].filter(id => !currentItemsMap.has(id));

      // For disappeared items, we need to check if they completed successfully or failed
      if (disappearedItems.length > 0) {
        try {
          // Fetch the current state of these items from the completed history
          const historyResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/history`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const allHistoryItems = historyResponse.data || [];

          disappearedItems.forEach(disappearedId => {
            const historyItem = allHistoryItems.find(item => item.id === disappearedId);

            if (historyItem) {
              // Only show success notification if the item is actually completed (isMoMGenerated === 1)
              // and not failed
              if (historyItem.isMoMGenerated === 1 && historyItem.processing_status !== 'failed') {
                playNotificationSound();
                addToast("success", `🎉 Your MoM "${historyItem.title}" is ready!`, 5000);
              } else {
                // Optionally, you can show a failure toast here if desired
                addToast("error", `❌ Processing failed, Please try again later.`, 5000);
              }
              // If it's failed, we don't show any success notification
            }
          });
        } catch (historyError) {
          console.error('Error checking history status:', historyError);
        }
      }

      setPreviousProcessingIds(new Set(sortedItems.map(item => item.id)));
      setProcessingItems(sortedItems);

      // Always refresh completed history when items disappear from processing
      if (disappearedItems.length > 0) {
        await fetchCompletedHistory();
      }
    } catch (error) {
      console.error('Error fetching processing status:', error);
    }
  };
  // Mark item as viewed
  const markAsViewed = async (historyId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/history/${historyId}/viewed`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setCompletedHistory(prev =>
        prev.map(item =>
          item.id === historyId ? { ...item, is_viewed: true } : item
        )
      );
    } catch (error) {
      console.error('Error marking as viewed:', error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchCompletedHistory(), fetchProcessingItems()]);
      setIsLoading(false);
    };
    loadAll();
  }, [token, NeedFor]);

  // Poll for processing updates
  useEffect(() => {
    if (processingItems.length === 0) return;

    const interval = setInterval(fetchProcessingItems, 10000);
    return () => clearInterval(interval);
  }, [processingItems.length]);

  // Handle menu click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".menu-container")) {
        setMenuOpenId(null);
      }
    };
    if (menuOpenId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [menuOpenId]);

  const handleEdit = (id, newTitle) => {
    setCompletedHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, title: newTitle } : item
      )
    );
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/history/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(removeAudioPreview(id));
      setCompletedHistory((prev) => prev.filter((item) => item.id !== id));
      setMenuOpenId(null);
      addToast("success", "Item deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      addToast("error", "Failed to delete item");
    }
  };

  const totalItems = processingItems.length + completedHistory.length;
  const newItemsCount = completedHistory.filter(item => !item.is_viewed && item.status !== 'failed').length;

  return (
    <div
      className="shadow-xl rounded-2xl w-full dark:bg-gradient-to-br dark:from-gray-900/95 dark:to-gray-800/95 bg-gradient-to-br from-white to-gray-50 p-6 flex flex-col border dark:border-gray-700/50 border-gray-200/50 relative backdrop-blur-sm"
      style={{ height: height || '30rem' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl shadow-lg shadow-purple-500/20">
            <History className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Meeting History
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {completedHistory.length > 0 && `${completedHistory.length} completed`}
            </p>
          </div>
        </div>
        {!isLoading && totalItems > 0 && (
          <div className="flex items-center gap-2">
            {newItemsCount > 0 && (
              <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-xs font-semibold text-green-700 dark:text-green-300">
                {newItemsCount} new
              </div>
            )}
            <div className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full text-xs font-semibold text-purple-700 dark:text-purple-300">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonItem key={index} />
          ))}
        </div>
      ) : totalItems === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 py-8">
          <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-full mb-4">
            <History className="w-12 h-12 opacity-50" />
          </div>
          <p className="font-semibold text-lg mb-1">No history yet</p>
          <p className="text-sm text-center max-w-xs">
            Your meeting history will appear here once you start creating minutes
          </p>
        </div>
      ) : (
        <div className="relative flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">
          <div className="space-y-3 pr-2">
            <AnimatePresence mode="popLayout">
              {/* Processing Items */}
              {processingItems.map((item) => (
                <ProcessingItem
                  key={`processing-${item.id}`}
                  item={item}
                  onNavigate={navigate}
                />
              ))}

              {/* Divider if both sections exist */}
              {processingItems.length > 0 && completedHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-t border-gray-200 dark:border-gray-600 my-2"
                />
              )}

              {/* Completed Items */}
              {completedHistory.map((item, index) => (
                <CompletedItem
                  key={`completed-${item.id}`}
                  item={item}
                  index={index}
                  isHovered={hoveredItemId}
                  onHoverChange={setHoveredItemId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  menuOpenId={menuOpenId}
                  onMenuToggle={setMenuOpenId}
                  onMarkAsViewed={markAsViewed}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thumb-purple-500::-webkit-scrollbar-thumb {
          background-color: rgb(168 85 247);
          border-radius: 3px;
        }
        .scrollbar-thumb-purple-500::-webkit-scrollbar-thumb:hover {
          background-color: rgb(147 51 234);
        }
        .scrollbar-track-gray-200::-webkit-scrollbar-track {
          background-color: rgb(229 231 235);
          border-radius: 3px;
        }
        .dark .scrollbar-track-gray-800::-webkit-scrollbar-track {
          background-color: rgb(31 41 55);
        }
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default UnifiedHistory;