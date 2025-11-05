import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  ArrowRight,
  Loader2,
  ChevronDown,
  Trash,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { useToast } from "../ToastContext";
import {
  clearAudioPreviews,
  removeAudioPreview,
  updateAudioDuration,
} from "../../redux/audioSlice";

export default function MultipleAudioPlayer({
  onContinue,
  isPreviewProcessing,
}) {
  const [audioData, setAudioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [playingStates, setPlayingStates] = useState({});
  const [currentTimes, setCurrentTimes] = useState({});
  const [durations, setDurations] = useState({});
  const [showAllAudio, setShowAllAudio] = useState(false);
  const audioRefs = useRef({});
  const { addToast } = useToast();
  const dispatch = useDispatch();

  const { token } = useSelector((state) => state.auth);
  const { previews } = useSelector((state) => state.audio);
  const lastPreview = previews.at(-1);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/history`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const incomplete = res.data.filter(
          (item) =>
            item.isMoMGenerated === 0 &&
            item.source === "Live Transcript Conversion"
        );
        setAudioData(incomplete);
        setLoading(false);
      } catch (err) {
        console.error("Get history error:", err);
      }
    };
    fetchHistory();
  }, [token, previews]);

  useEffect(() => {
    if (!isPreviewProcessing) {
      setProcessingId(null);
    }
  }, [isPreviewProcessing]);

  const togglePlayPause = (audioId) => {
    const audio = audioRefs.current[audioId];
    if (audio) {
      const isCurrentlyPlaying = playingStates[audioId];

      Object.keys(audioRefs.current).forEach((id) => {
        if (id !== audioId.toString() && audioRefs.current[id]) {
          audioRefs.current[id].pause();
          setPlayingStates((prev) => ({ ...prev, [id]: false }));
        }
      });

      if (isCurrentlyPlaying) {
        audio.pause();
        setPlayingStates((prev) => ({ ...prev, [audioId]: false }));
      } else {
        audio.play();
        setPlayingStates((prev) => ({ ...prev, [audioId]: true }));
      }
    }
  };

  const handleLoadedMetadata = (audioId) => {
    const audio = audioRefs.current[audioId];
    if (audio) {
      setDurations((prev) => ({ ...prev, [audioId]: audio.duration }));
    }
  };

  const handleTimeUpdate = (audioId) => {
    const audio = audioRefs.current[audioId];
    if (audio) {
      setCurrentTimes((prev) => ({ ...prev, [audioId]: audio.currentTime }));
      if (isFinite(audio.duration)) {
        const preview = audioData[audioId];
        if (preview && !preview.duration) {
          dispatch(
            updateAudioDuration({ id: preview.id, duration: audio.duration })
          );
        }
        setDurations((prev) => ({ ...prev, [audioId]: audio.duration }));
      }
    }
  };

  const handleProgressClick = (e, audioId) => {
    const audio = audioRefs.current[audioId];
    if (audio) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * durations[audioId];
      audio.currentTime = newTime;
      setCurrentTimes((prev) => ({ ...prev, [audioId]: newTime }));
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };
    for (const [unit, seconds] of Object.entries(intervals)) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (interval >= 1)
        return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
    }
    return "Just now";
  };

  const formatTime = (time) => {
    if (!time || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getProgressPercent = (audioId) => {
    const duration = durations[audioId];
    const currentTime = currentTimes[audioId];
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  };

  const handleDelete = async (audioId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/live-meeting/audio-files/${audioId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAudioData((prev) => prev.filter((item) => item.id !== audioId));
      dispatch(removeAudioPreview(audioId));
      addToast("success", `Audio ${audioId} deleted successfully`);
    } catch (err) {
      addToast("error", `Error deleting audio: ${err}`);
    }
  };

  const handleClear = () => {
    dispatch(clearAudioPreviews());
  };

  if (loading) {
    return (
      <div className="my-8 flex justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading Previous Recorded Meeting...
        </span>
      </div>
    );
  }

  return (
    <div className="mt-8 mb-0 ">
      <div className="relative bg-white/90 dark:bg-gray-900/30 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-xl dark:shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
            Audio Recordings ({audioData.length})
          </h4>
          <button
            onClick={() => setShowAllAudio(!showAllAudio)}
            disabled={audioData.length === 0}
            className="flex items-center disabled:cursor-not-allowed gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 border border-gray-200 dark:border-gray-700"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {showAllAudio ? "Hide" : "Show"} All
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
                showAllAudio ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
        {/* <button onClick={handleClear}>Clear Previews</button> */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden  ${
            audioData.length > 2 && "overflow-y-scroll"
          }`}
          style={{ maxHeight: showAllAudio ? "300px" : "0" }}
        >
          <div className="space-y-4">
            {audioData.map((audio, index) => {
              const isLastPreview =
                audio?.id === lastPreview?.id &&
                lastPreview.needToShow === true;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/80 rounded-xl p-4 border border-gray-200/70 dark:border-gray-700/70"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 md:max-w-[60%] max-w-[70%] overflow-hidden">
                      <p className="text-base text-gray-800 dark:text-gray-300 font-medium truncate max-w-[90%]">
                        {audio.title || "Unknown Meeting"}
                      </p>
                      <span className="text-[12px] text-gray-600 dark:text-gray-300">
                        {getTimeAgo(audio.uploadedAt)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(audio.id)}
                      disabled={processingId !== null || isLastPreview}
                      className="flex cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2 md:px-4 px-2 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      <span className=" md:block hidden">Delete</span>
                      <Trash className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        setProcessingId(audio.id);
                        await onContinue(audio.audioUrl);
                        handleDelete(audio.id);
                      }}
                      disabled={processingId !== null || isLastPreview}
                      className="flex cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed items-center md:ml-4 ml-2 gap-2 md:px-4 px-2 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      {processingId === audio.id ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className=" md:block hidden">
                            Processing...
                          </span>
                        </>
                      ) : (
                        <>
                          <span className=" md:block hidden">Create MoM</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <audio
                    ref={(el) => (audioRefs.current[index] = el)}
                    src={audio.audioUrl}
                    onTimeUpdate={() => handleTimeUpdate(index)}
                    onLoadedMetadata={() => handleLoadedMetadata(index)}
                    onError={(e) => console.error("Audio load error:", e)}
                    onEnded={() =>
                      setPlayingStates((prev) => ({ ...prev, [index]: false }))
                    }
                    className="hidden"
                  />
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => togglePlayPause(index)}
                      className="group cursor-pointer relative w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      {playingStates[index] ? (
                        <Pause className="w-4 h-4 text-white relative z-10" />
                      ) : (
                        <Play className="w-4 h-4 text-white ml-0.5 relative z-10" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div
                        className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer relative overflow-hidden group"
                        onClick={(e) => handleProgressClick(e, index)}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full relative transition-all duration-150 ease-out"
                          style={{ width: `${getProgressPercent(index)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <span>{formatTime(currentTimes[index])}</span>
                        <span>{formatTime(durations[index])}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center w-8 h-8 bg-gray-200/50 dark:bg-gray-700/50 rounded-full">
                      <Volume2 className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {audioData.length === 0 && (
          <h4 className=" text-sm text-center dark:text-white opacity-50">
            No Data Found
          </h4>
        )}
        <div className="mt-6 flex justify-center">
          <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
