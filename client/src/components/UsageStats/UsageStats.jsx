// UsageStats.jsx
import axios from "axios";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FiVideo, FiFile, FiUsers } from "react-icons/fi";
import { LuBot } from "react-icons/lu";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const UsageStats = () => {
  const navigate = useNavigate();
  const {
    token,
  } = useSelector((state) => state.auth);
  const [userHistory, setUserHistory] = useState(null);

  const fetchUserHistory = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/history/user-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        const historyData = response.data.data;
        setUserHistory(historyData);
      }
    } catch (error) {
      console.error('Error fetching user history:', error);
    }
  };

  useEffect(() => {
    fetchUserHistory();
  }, [token]);
  const stats = [
    {
      icon: FiVideo,
      label: "Online Meetings Joined",
      value: userHistory?.totalOnlineMeeting || "0",
      change: "meeting",
      color: "blue",
      progress: 80,
      description: "Gmeet, Zoom, Teams etc"
    },
    {
      icon: FiFile,
      label: "Files Processed",
      value: userHistory?.totalGeneratesNotes || "0",
      change: "audio-notes",
      color: "green",
      progress: 60,
      description: "Audio & Video files"
    },
    {
      icon: FiUsers,
      label: "New Meetings Started",
      value: userHistory?.totalLiveMeeting || "0",
      change: "live-meeting",
      color: "purple",
      progress: 50,
      description: "In Person Meeting"
    },
    {
      icon: LuBot,
      label: "Bot Sessions",
      value: 0,
      change: "bot-master",
      color: "orange",
      progress: 75,
      description: "Meeting Master sessions"
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        text: "text-blue-500",
        progress: "bg-blue-500"
      },
      green: {
        bg: "bg-green-500/10",
        border: "border-green-500/20",
        text: "text-green-500",
        progress: "bg-green-500"
      },
      purple: {
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        text: "text-purple-500",
        progress: "bg-purple-500"
      },
      orange: {
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        text: "text-orange-500",
        progress: "bg-orange-500"
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <motion.div
      className="p-6 lg:p-8 w-full rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/40 via-white/20 to-white/10 dark:from-gray-800/60 dark:via-gray-700/40 dark:to-gray-600/20 border border-white/30 dark:border-white/20 shadow-2xl shadow-blue-500/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
        Meeting Activity Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-4">
        {stats.map((stat, index) => {
          const colorClasses = getColorClasses(stat.color);

          return (
            <motion.div
              key={stat.label}
              className="p-4 lg:p-6 rounded-2xl bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all group cursor-pointer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 lg:p-3 rounded-xl ${colorClasses.bg} border ${colorClasses.border}`}>
                  <stat.icon className={`${colorClasses.text} text-lg lg:text-xl`} />
                </div>
                <button onClick={() => navigate(`/${stat.change}`)} className={`${colorClasses.text} ${colorClasses.border} border font-semibold text-xs lg:text-sm bg-white/50 dark:bg-gray-600/50 px-4 cursor-pointer py-1 rounded-full`}>
                  Start
                </button>
              </div>

              <h3 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
                {stat.value}
              </h3>
              <p className="text-gray-800 dark:text-white font-semibold text-sm lg:text-base">
                {stat.label}
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-xs lg:text-sm">
                {stat.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Section */}
      <motion.div
        className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="font-bold text-gray-800 dark:text-white text-lg">
              Total Meeting Activity
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Across all platforms and meeting types
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userHistory?.totalHistory || "0"}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Sessions</div>
            </div>
            
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UsageStats;