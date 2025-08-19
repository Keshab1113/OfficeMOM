// eslint-disable-next-line no-unused-vars
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { History, FileText } from "lucide-react";

const AllHistory = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [history, setHistory] = useState([]);
  const controls = useAnimation();

  function timeAgo(localDate) {
    const today = new Date();
    const inputDate = new Date(localDate);
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    const diffTime = today - inputDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "today";
    } else if (diffDays === 1) {
      return "1 day ago";
    } else if (diffDays > 1) {
      return `${diffDays} days ago`;
    } else {
      return "in the future";
    }
  }

  useEffect(() => {
    if (isPaused) {
      controls.stop();
    } else {
      controls.start({
        y: ["0%", "-100%"],
        transition: {
          repeat: Infinity,
          duration: history.length * 5,
          ease: "linear",
        },
      });
    }
  }, [isPaused, controls, history.length]);

  const token = useSelector((state) => state.auth.token);
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/history`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHistory(res.data);
      } catch (err) {
        console.error("Get history error:", err);
      }
    };
    fetchHistory();
  }, [token]);

  return (
    <div className=" h-[18rem] shadow-lg rounded-md w-full dark:bg-gray-900 bg-white p-4 overflow-hidden flex flex-col ">
      <div className="flex items-center gap-3 mb-4">
        <History className="text-purple-500 w-6 h-6" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Meetings
        </h2>
      </div>
      {history.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-700 font-medium">
          No data found
        </div>
      ) : (
        <div className="relative flex-1 overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-full"
            animate={controls}
          >
            <ol className="space-y-3">
              {[...history, ...history].map((item, index) => {
                const HDate = new Date(item.date);
                const localDate =
                  HDate.getFullYear() +
                  "-" +
                  String(HDate.getMonth() + 1).padStart(2, "0") +
                  "-" +
                  String(HDate.getDate()).padStart(2, "0");
                return (
                  <li
                    key={index}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className="bg-gray-100 dark:bg-gray-800 bg-opacity-80 rounded-lg p-3 shadow-sm flex flex-col cursor-pointer transition-transform duration-300"
                  >
                    <span className=" flex gap-2 justify-start items-center">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-800 dark:text-gray-300 font-medium">
                        {item.source}
                      </span>
                    </span>

                    <div className="text-sm text-gray-600 dark:text-gray-400 ml-6 flex justify-between">
                      {localDate}
                      <span className=" capitalize">{timeAgo(localDate)}</span>
                    </div>
                  </li>
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
