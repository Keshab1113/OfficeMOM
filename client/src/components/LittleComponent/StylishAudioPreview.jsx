// eslint-disable-next-line no-unused-vars
import { motion, useAnimation } from "framer-motion";
import React, { useState, useRef } from "react";
import { Play, Pause, Volume2, RotateCcw, ArrowRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { updateAudioDuration, updateNeedToShow } from "../../redux/audioSlice";

export default function StylishAudioPreview({ onRecordAgain }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const audioRef = useRef(null);
  const dispatch = useDispatch();
  const { previews } = useSelector((state) => state.audio);
  const lastPreview = previews.at(-1);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (!isNaN(d) && d !== Infinity) {
        setDuration(d);
      } else {
        setDuration(0); // fallback until playback starts
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (
        (isNaN(duration) || duration === 0) &&
        !isNaN(audioRef.current.duration) &&
        audioRef.current.duration !== Infinity
      ) {
        setDuration(audioRef.current.duration);
        dispatch(
          updateAudioDuration({
            id: lastPreview.id,
            duration: audioRef.current.duration,
          })
        );
      }
    }
  };

  const handleProgressClick = (e) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const totalDuration = duration || lastPreview?.duration || 0;
  const progressPercent =
    totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="my-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 dark:from-blue-500/30 dark:via-purple-500/30 dark:to-pink-500/30 rounded-2xl blur-xl"></div>

        <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-xl dark:shadow-2xl">
          <div className="flex items-center gap-3 mb-6 relative">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-400/50 dark:shadow-green-400/70 animate-pulse"></div>
            <h4 className="text-lg font-semibold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-white bg-clip-text text-transparent">
              Meeting Preview
            </h4>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="ml-auto flex items-center gap-1 cursor-pointer p-2"
            >
              <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"></div>
              <div
                className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </button>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-10 top-full mt-[-30px] w-fit flex flex-col bg-white dark:bg-gray-800 border dark:border-gray-600 border-amber-100 rounded-lg shadow-lg z-[9999]"
              >
                <button
                  // onClick={() => startEditing(item)}
                  className="w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  Add Meeting Name
                </button>
                <button
                  onClick={() => dispatch(updateNeedToShow({ id: lastPreview?.id, needToShow: false }))}
                  className="w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                >
                  Remove the preview
                </button>
              </motion.div>
            )}
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/80 rounded-xl p-4 border border-gray-200/70 dark:border-gray-700/70">
            <audio
              ref={audioRef}
              src={lastPreview?.audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />

            <div className="flex items-center gap-4">
              <button
                onClick={togglePlayPause}
                className="group relative w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 dark:from-blue-600 dark:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl dark:shadow-blue-500/25 dark:hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-white/20 dark:bg-white/30 rounded-full group-hover:bg-white/30 dark:group-hover:bg-white/40 transition-colors duration-300"></div>
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white relative z-10" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5 relative z-10" />
                )}
              </button>

              <div className="flex-1">
                <div
                  className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer relative overflow-hidden group"
                  onClick={handleProgressClick}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 dark:from-blue-500/40 dark:to-purple-500/40 rounded-full"></div>

                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-full relative transition-all duration-150 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 dark:bg-white/40 rounded-full"></div>

                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-gray-200 rounded-full shadow-lg border-2 border-blue-500 dark:border-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium tabular-nums">
                    {formatTime(currentTime)}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatTime(lastPreview?.duration)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center w-10 h-10 bg-gray-200/50 dark:bg-gray-700/50 rounded-full">
                <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
            </div>

            <div className="flex justify-center gap-1 mt-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 bg-gradient-to-t from-blue-400 to-purple-500 dark:from-blue-500 dark:to-purple-600 rounded-full ${
                    isPlaying ? "animate-pulse" : ""
                  }`}
                  style={{
                    height: `${Math.random() * 16 + 8}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`,
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() =>
                onRecordAgain && onRecordAgain(lastPreview?.audioUrl)
              }
              className="group flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg dark:hover:shadow-gray-900/50 transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <span className="font-medium">Restart Recording</span>
            </button>
          </div>

          <div className="mt-4 flex justify-center">
            <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-purple-500 dark:from-blue-500 dark:to-purple-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
