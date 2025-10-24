// eslint-disable-next-line no-unused-vars
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { History, FileText, MoreVertical, Check, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { removeAudioPreview } from "../../redux/audioSlice";
import { useToast } from "../ToastContext";

// Skeleton component for loading state
const SkeletonItem = () => (
  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-3 shadow-sm border border-transparent">
    <div className="flex justify-between items-center">
      <div className="flex gap-2 justify-start items-center flex-1 min-w-0">
        <div className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-md animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
      </div>
      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
    </div>
    <div className="ml-8 mt-2 flex justify-between items-center">
      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
      <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded-full w-16 animate-pulse"></div>
    </div>
  </div>
);

const AllHistory = ({ title, NeedFor, height }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [history, setHistory] = useState([]);
  const [notCompleted, setNotCompleted] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const controls = useAnimation();
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
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays > 1) return `${diffDays} days ago`;
    return "in the future";
  }

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true); // Set loading to true when starting fetch
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
        setIsLoading(false); // Set loading to false when fetch completes
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
    } catch (err) {
      console.error("Rename error:", err);
      cancelEditing();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this history item?"))
      return;
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
      addToast("success", `Audio ${id} deleted successfully`);
    } catch (err) {
      console.error("Delete error:", err);
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
  const displayHistory =
    allData.length > 2 ? [...allData, ...allData] : allData;

  useEffect(() => {
    if (allData.length > 2 && !isPaused && !editingId && !menuOpenId) {
      controls.start({
        y: ["0%", "-50%"],
        transition: {
          repeat: Infinity,
          duration: allData.length * 3,
          ease: "linear",
        },
      });
    } else {
      controls.stop();
    }
  }, [allData.length, isPaused, editingId, menuOpenId, controls]);

  return (
    <div className={`h-[18rem] shadow-lg rounded-md w-full dark:bg-gray-900/30 bg-white p-4 flex flex-col border dark:border-gray-700 border-gray-200 relative ${NeedFor && (height || " md:h-[80vh]")}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <History className="text-purple-600 dark:text-purple-400 w-5 h-5" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {title ? title : "Recent Meetings - MoM Generated"}
        </h2>
      </div>

      {/* Show skeleton loading state */}
      {isLoading ? (
        <div className="flex-1 space-y-3">
          {Array.from({ length: NeedFor ? 4 : 2 }).map((_, index) => (
            <SkeletonItem key={index} />
          ))}
        </div>
      ) : allData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <History className="w-12 h-12 mb-2 opacity-50" />
          <p className="font-medium">No history found</p>
          <p className="text-sm">Your meeting history will appear here</p>
        </div>
      ) : (
        <div className="relative flex-1 overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-full"
            animate={
              allData.length > 2 && !isPaused && !menuOpenId ? controls : {}
            }
          >
            <ol className="space-y-3 relative">
              {displayHistory.map((item, index) => {
                const HDate = new Date(item.date || item.uploadedAt);
                const localDate =
                  HDate.getFullYear() +
                  "-" +
                  String(HDate.getMonth() + 1).padStart(2, "0") +
                  "-" +
                  String(HDate.getDate()).padStart(2, "0") +
                  " " +
                  String(HDate.getHours()).padStart(2, "0") +
                  ":" +
                  String(HDate.getMinutes()).padStart(2, "0") +
                  ":" +
                  String(HDate.getSeconds()).padStart(2, "0");
                const isHovered = hoveredItemId === `${item.id}-${index}`;
                const isEditing = editingId === item.id;

                return (
                  <motion.li
                    key={`${item.id}-${index}`}
                    onMouseEnter={() => {
                      setIsPaused(true);
                      setHoveredItemId(`${item.id}-${index}`);
                    }}
                    onMouseLeave={() => {
                      setIsPaused(false);
                      setHoveredItemId(null);
                    }}
                    className={`bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-3 shadow-sm transition-all duration-300 relative border border-transparent ${isHovered ? "shadow-md" : ""
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 justify-start items-center flex-1 min-w-0">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>

                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => handleKeyPress(e, item.id)}
                              className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-600 border border-purple-300 dark:border-purple-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-gray-200"
                            />
                            <button
                              onClick={() => saveRename(item.id)}
                              className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                            >
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            >
                              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        ) : (
                          <Link
                            to={!title ? `/momGenerate/${item.id}` : "#"}
                            className="text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors truncate flex-1"
                            onDoubleClick={() => title && startEditing(item)}
                          >
                            {item.title || item.source || "Unknown"}
                          </Link>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="menu-container relative">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setMenuOpenId(
                                menuOpenId === item.id ? null : item.id
                              );
                              setIsPaused(menuOpenId !== item.id);
                            }}
                            className="p-1.5 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </motion.button>

                          {menuOpenId === item.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-10 top-full mt-[-30px] w-fit flex bg-white dark:bg-gray-800 border dark:border-gray-600 border-amber-100 rounded-lg shadow-lg z-[9999]"
                            >
                              <button
                                onClick={() => startEditing(item)}
                                className="w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                              >
                                Rename
                              </button>
                              {title && (
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                                >
                                  Delete
                                </button>
                              )}
                              {title && (
                                <button
                                  onClick={() => {
                                    navigate("/live-meeting");
                                    setMenuOpenId(null);
                                    setIsPaused(false);
                                  }}
                                  className="w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-purple-600 dark:text-purple-400"
                                >
                                  Create MoM
                                </button>
                              )}
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>

                    <motion.div
                      className="text-xs text-gray-500 dark:text-gray-400 ml-8 mt-1 flex justify-between items-center"
                      initial={{ opacity: 0.7 }}
                      whileHover={{ opacity: 1 }}
                    >
                      <span>{localDate}</span>
                      <span className="capitalize bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full text-xs">
                        {timeAgo(localDate)}
                      </span>
                    </motion.div>
                  </motion.li>
                );
              })}
            </ol>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AllHistory;