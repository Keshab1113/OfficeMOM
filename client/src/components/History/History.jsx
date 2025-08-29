// eslint-disable-next-line no-unused-vars
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { History, FileText, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const AllHistory = ({ title, sampleHistory, NeedFor }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [history, setHistory] = useState([]);
  const controls = useAnimation();
  const navigate = useNavigate();

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
      if (sampleHistory) {
        setHistory(sampleHistory);
      } else {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/history`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let filteredData = res.data;
        if (
          NeedFor === "Online Meeting Conversion" ||
          NeedFor === "Generate Notes Conversion" ||
          NeedFor === "Live Transcript Conversion"
        ) {
          filteredData = res.data.filter(
            item => item.source === NeedFor
          );
        }

        setHistory(filteredData);
      }

      if (!isPaused && history.length > 0) {
        controls.start({
          y: ["0%", "-100%"],
          transition: {
            repeat: Infinity,
            duration: history.length * 5,
            ease: "linear",
          },
        });
      }
    } catch (err) {
      console.error("Get history error:", err);
    }
  };

  fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token, history.length, NeedFor]);


  return (
    <div className=" h-[18rem] shadow-lg rounded-md w-full dark:bg-gray-900 bg-white p-4 overflow-hidden flex flex-col ">
      <div className="flex items-center gap-3 mb-4">
        <History className="text-purple-500 w-6 h-6" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title ? title : "Recent Meetings - MoM Generated"}
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
            animate={history.length > 2 && controls}
          >
            <ol className="space-y-3">
              {(history.length > 2 ? [...history, ...history] : history).map(
                (item, index) => {
                  const HDate = new Date(item.date || item.uploadedAt);
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
                      <div className=" flex justify-between">
                        <span className=" flex gap-2 justify-start items-center">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <Link
                            to={
                              !title
                                ? `/meeting-history/${
                                    sampleHistory ? "" : item.id
                                  }`
                                : "#"
                            }
                            className="text-gray-800 dark:text-gray-300 hover:text-blue-700 font-medium"
                          >
                            {item.source || "Live Transcript Conversion"}
                          </Link>
                        </span>
                        {title && (
                          <button
                            onClick={()=>navigate("/live-meeting")}
                            className=" text-black flex gap-1 justify-center items-center bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-800 dark:text-white capitalize text-xs cursor-pointer px-2 rounded-md "
                          >
                            <span className=" md:block hidden">Continue</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 ml-6 flex justify-between">
                        {localDate}
                        <span className=" capitalize">
                          {timeAgo(localDate)}
                        </span>
                      </div>
                    </li>
                  );
                }
              )}
            </ol>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default AllHistory;
