// eslint-disable-next-line no-unused-vars
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { History, FileText, MoreVertical, Check, X, Pencil, Trash2, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { removeAudioPreview } from "../../redux/audioSlice";
import { useToast } from "../ToastContext";
import { DateTime } from "luxon";


// Enhanced Skeleton component with shimmer effect
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

const AllHistory = ({ title, NeedFor, height }) => {
  const [history, setHistory] = useState([]);
  const [notCompleted, setNotCompleted] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const editInputRef = useRef(null);
  const { addToast } = useToast();
  const dispatch = useDispatch();

  function timeAgo(localDate) {
    const today = new Date();
    const inputDate = new Date(localDate);
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    const diffTime = today - inputDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays > 1 && diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays > 7 && diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays > 30) return `${Math.floor(diffDays / 30)} months ago`;
    return "Future";
  }

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/history`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const completed = res.data.filter((item) => item.isMoMGenerated === 1);
        const incomplete = res.data.filter((item) => item.isMoMGenerated === 0);
        setNotCompleted(incomplete);
        let filteredData = completed;
        if (
          NeedFor === "Online Meeting Conversion" ||
          NeedFor === "Generate Notes Conversion" ||
          NeedFor === "Live Transcript Conversion"
        ) {
          filteredData = res.data.filter((item) => item.source === NeedFor && item.isMoMGenerated === 1);
        }
        setHistory(filteredData);
      } catch (err) {
        console.error("Get history error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [token, NeedFor]);

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditingTitle(item.title || item.source || "");
    setMenuOpenId(null);
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 100);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const saveRename = async (id) => {
    if (!editingTitle.trim()) {
      cancelEditing();
      return;
    }
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/history/${id}`,
        { title: editingTitle.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistory((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, title: editingTitle.trim() } : item
        )
      );
      setNotCompleted((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, title: editingTitle.trim() } : item
        )
      );
      setEditingId(null);
      setEditingTitle("");
      addToast("success", "Title updated successfully");
    } catch (err) {
      console.error("Rename error:", err);
      addToast("error", "Failed to update title");
      cancelEditing();
    }
  };

  const handleDelete = async (id) => {
    // if (!window.confirm("Are you sure you want to delete this history item?"))
    //   return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/history/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      dispatch(removeAudioPreview(id));
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setNotCompleted((prev) => prev.filter((item) => item.id !== id));
      setMenuOpenId(null);
      addToast("success", "Item deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      addToast("error", "Failed to delete item");
    }
  };

  const handleKeyPress = (e, id) => {
    if (e.key === "Enter") {
      saveRename(id);
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

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

  const allData = title ? notCompleted : history;

  return (
    <div className={` shadow-xl rounded-2xl w-full dark:bg-gradient-to-br dark:from-gray-900/95 dark:to-gray-800/95 bg-gradient-to-br from-white to-gray-50 p-6 flex flex-col border dark:border-gray-700/50 border-gray-200/50 relative backdrop-blur-sm`} style={{ height: height || '30rem' }}>
      {/* Header with gradient accent */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl shadow-lg shadow-purple-500/20">
            <History className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {title ? title : "Recent Meetings"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {title ? "Pending MoM" : "MoM Generated"}
            </p>
          </div>
        </div>
        {!isLoading && allData.length > 0 && (
          <div className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full  text-xs font-semibold text-purple-700 dark:text-purple-300 flex justify-center items-center whitespace-nowrap">
            
              {allData.length}{" "}{allData.length === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>

      {/* Show skeleton loading state */}
      {isLoading ? (
        <div className="flex-1 space-y-3">
          {Array.from({ length: NeedFor ? 4 : 2 }).map((_, index) => (
            <SkeletonItem key={index} />
          ))}
        </div>
      ) : allData.length === 0 ? (
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
            {allData.map((item, index) => {
              // Convert UTC date to user's local time
// Convert UTC date to user's local timezone using Luxon
// Convert UTC or SQL date to user's local timezone dynamically using Luxon
// Convert UTC or SQL date to user's *local* timezone using Luxon
const utcDate = item.date || item.uploadedAt;

// Try ISO first, fallback to SQL; always interpret as UTC then convert to local
const parsed = DateTime.fromISO(utcDate, { zone: "utc" });
const localDate = parsed.isValid
  ? parsed.setZone(DateTime.local().zoneName)
  : DateTime.fromSQL(utcDate, { zone: "utc" }).setZone(DateTime.local().zoneName);

// Show full date and time
const formattedDate = localDate.toFormat("dd LLL yyyy, hh:mm:ss a");




              const isHovered = hoveredItemId === `${item.id}-${index}`;
              const isEditing = editingId === item.id;

              return (
                <div
                  key={`${item.id}-${index}`}
                  onMouseEnter={() => {
                    setHoveredItemId(`${item.id}-${index}`);
                  }}
                  onMouseLeave={() => {
                    setHoveredItemId(null);
                  }}
                  className={`bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 relative border ${isHovered
                    ? "border-purple-300 dark:border-purple-600/50 shadow-lg shadow-purple-500/10"
                    : "border-gray-100 dark:border-gray-700/50"
                    }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3 justify-start items-center flex-1 min-w-0">
                      <motion.div
                        className={`p-2 rounded-lg ${isHovered
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-md"
                          : "bg-blue-100 dark:bg-blue-900/30"
                          } transition-all duration-300`}
                        whileHover={{ scale: 1.05, rotate: 5 }}
                      >
                        <FileText className={`w-5 h-5 ${isHovered ? "text-white" : "text-blue-600 dark:text-blue-400"
                          }`} />
                      </motion.div>

                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyPress(e, item.id)}
                            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border-2 border-purple-400 dark:border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 dark:text-gray-200 shadow-sm"
                            placeholder="Enter title..."
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => saveRename(item.id)}
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
                            to={!title ? `/momGenerate/${item.id}` : "#"}
                            className="text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 font-semibold transition-colors truncate block text-sm"
                            onDoubleClick={() => title && startEditing(item)}
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
                            {/* <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" /> */}
                            {/* <span className="text-xs font-medium text-purple-600 dark:text-purple-400 capitalize">
                              {timeAgo(localDate)}
                            </span> */}
                          </div>
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="menu-container relative">
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setMenuOpenId(
                              menuOpenId === item.id ? null : item.id
                            );
                            setIsPaused(menuOpenId !== item.id);
                          }}
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
                                  onClick={() => startEditing(item)}
                                  className="w-full cursor-pointer px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-gray-700 dark:text-gray-300 flex items-center gap-3"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Rename
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="w-full cursor-pointer px-4 py-2.5 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 flex items-center gap-3"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                                {title && (
                                  <button
                                    onClick={() => {
                                      navigate("/live-meeting");
                                      setMenuOpenId(null);
                                      setIsPaused(false);
                                    }}
                                    className="w-full cursor-pointer px-4 py-2.5 text-left text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-purple-600 dark:text-purple-400 flex items-center gap-3 border-t border-gray-100 dark:border-gray-700"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Create MoM
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      )}

      <style >{`
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
    </div >
  );
};

export default AllHistory;