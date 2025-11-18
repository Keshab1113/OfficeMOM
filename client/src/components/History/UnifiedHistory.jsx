import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { History, FileText, MoreVertical, Check, X, Pencil, Trash2, Clock, CheckCircle, XCircle, Loader2, PauseCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { removeAudioPreview } from "../../redux/audioSlice";
import { useToast } from "../ToastContext";
import { DateTime } from "luxon";

// Notification Sound - using local file
const playNotificationSound = () => {
  try {
    const audio = new Audio('/Images/notification.mp3'); // Make sure notification.wav is in your public folder
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

// Processing Item Component
const ProcessingItem = ({ item, onNavigate }) => {
  const getStatusIcon = (status, awaitingHeaders) => {
    if (awaitingHeaders) {
      return <PauseCircle className="w-5 h-5 text-yellow-500 animate-pulse" />;
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
        return <PauseCircle className="w-5 h-5 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status, progress, awaitingHeaders, taskType) => {
    if (awaitingHeaders) {
      return '⸻ Awaiting Headers';
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
    if (status === 'awaiting_headers') return '⸻ Set Headers to Continue';
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

  const handleClick = () => {
    if (item.awaitingHeaders) {
      onNavigate(`/generate-notes/meeting-result/${item.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50 shadow-sm hover:shadow-lg transition-all ${
        item.awaitingHeaders ? 'cursor-pointer hover:border-yellow-400 hover:scale-[1.02]' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getStatusIcon(item.status, item.awaitingHeaders)}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-800 dark:text-white truncate">
              {item.title || "Processing..."}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getStatusText(item.status, item.progress, item.awaitingHeaders, item.taskType)}
            </p>
          </div>
        </div>
        {(item.status === 'transcribing' || item.status === 'generating_mom') && (
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-300 ml-2 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
            Processing
          </span>
        )}
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
    </motion.div>
  );
};

// Completed History Item Component
const CompletedItem = ({ item, index, isHovered, onHoverChange, onEdit, onDelete, menuOpenId, onMenuToggle, onMarkAsViewed }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [showNewBadge, setShowNewBadge] = useState(item.isNew || false);
  const editInputRef = useRef(null);
  const { addToast } = useToast();
  const token = useSelector((state) => state.auth.token);

  const utcDate = item.date || item.uploadedAt;
  const parsed = DateTime.fromISO(utcDate, { zone: "utc" });
  const localDate = parsed.isValid
    ? parsed.setZone(DateTime.local().zoneName)
    : DateTime.fromSQL(utcDate, { zone: "utc" }).setZone(DateTime.local().zoneName);

  const formattedDate = localDate.toFormat("dd LLL yyyy, hh:mm:ss a");

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

  const handleClick = async () => {
    if (showNewBadge) {
      setShowNewBadge(false);
      onMarkAsViewed(item.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => onHoverChange(`${item.id}-${index}`)}
      onMouseLeave={() => onHoverChange(null)}
      className={`bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 relative border ${
        isHovered === `${item.id}-${index}`
          ? "border-purple-300 dark:border-purple-600/50 shadow-lg shadow-purple-500/10"
          : "border-gray-100 dark:border-gray-700/50"
      }`}
    >
      {/* New Badge */}
      {showNewBadge && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="absolute -top-2 -right-2 z-10"
        >
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg animate-pulse">
            NEW
          </span>
        </motion.div>
      )}

      <div className="flex justify-between items-start gap-3">
        <div className="flex gap-3 justify-start items-center flex-1 min-w-0">
          <motion.div
            className={`p-2 rounded-lg ${
              isHovered === `${item.id}-${index}`
                ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-md"
                : "bg-blue-100 dark:bg-blue-900/30"
            } transition-all duration-300`}
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <FileText
              className={`w-5 h-5 ${
                isHovered === `${item.id}-${index}`
                  ? "text-white"
                  : "text-blue-600 dark:text-blue-400"
              }`}
            />
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
                className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={cancelEditing}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-red-600 dark:text-red-400" />
              </motion.button>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <Link
                to={`/momGenerate/${item.id}`}
                onClick={handleClick}
                className="text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 font-semibold transition-colors truncate block text-sm"
              >
                {item.title || item.source || "Unknown"}
              </Link>
              <div className="flex items-center gap-2 mt-1 flex-nowrap overflow-hidden">
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                  {formattedDate}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 capitalize whitespace-nowrap truncate">
                  {item.source}
                </span>
              </div>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="menu-container relative">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onMenuToggle(menuOpenId === item.id ? null : item.id)}
              className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </motion.button>

            <AnimatePresence>
              {menuOpenId === item.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border dark:border-gray-700 border-gray-200 rounded-xl shadow-xl z-[9999] overflow-hidden"
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
      
      setCompletedHistory(filteredData);
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
      
      // Check for newly completed items
      const currentProcessingIds = new Set(items.map(item => item.id));
      const completedIds = [...previousProcessingIds].filter(id => !currentProcessingIds.has(id));
      
      // Show notification for completed items
      completedIds.forEach(id => {
        const completedItem = processingItems.find(item => item.id === id);
        if (completedItem && completedItem.status !== 'failed') {
          playNotificationSound();
          addToast("success", `🎉 Your MoM "${completedItem.title}" is ready!`, 5000);
        }
      });
      
      setPreviousProcessingIds(currentProcessingIds);
      setProcessingItems(items);
      
      // Refresh completed history when items complete
      if (completedIds.length > 0) {
        await fetchCompletedHistory();
      }
    } catch (error) {
      console.error('Error fetching processing status:', error);
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
    const interval = setInterval(fetchProcessingItems, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [token, NeedFor, previousProcessingIds, processingItems]);

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
              {processingItems.length > 0 && `${processingItems.length} processing`}
              {processingItems.length > 0 && completedHistory.length > 0 && ' • '}
              {completedHistory.length > 0 && `${completedHistory.length} completed`}
            </p>
          </div>
        </div>
        {!isLoading && totalItems > 0 && (
          <div className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full text-xs font-semibold text-purple-700 dark:text-purple-300">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
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
      `}</style>
    </div>
  );
};

export default UnifiedHistory;