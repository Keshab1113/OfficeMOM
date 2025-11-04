/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from "react";
import Timing from "../../components/Timing/Timing";
import { cn } from "../../lib/utils";
import { FcConferenceCall } from "react-icons/fc";
import { useToast } from "../../components/ToastContext";
import { saveTranscriptFiles } from "../../components/TextTable/TextTable";
import TablePreview from "../../components/TablePreview/TablePreview";
import Footer from "../../components/Footer/Footer";
import { useSelector } from "react-redux";
import AllHistory from "../../components/History/History";
import { Video, Users, FileText, Play, Pause, Square, Mic, Shield, Zap, Clock, CheckCircle, BrushCleaning } from "lucide-react";
import RealTablePreview from "../../components/TablePreview/RealTablePreview";
import { Helmet } from "react-helmet";
import axios from "axios";
import { io } from "socket.io-client";
import { processTranscriptWithDeepSeek } from "../../lib/apiConfig";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";
import MeetingFeatures from "../../components/MeetingInstructions/MeetingFeatures";
import MeetingInstruction from "../../components/MeetingInstructions/MeetingInstruction";
import { DateTime } from "luxon";

const meetingPlatforms = [
  {
    name: "Google Meet",
    icon: "/Icons/meet.svg",
    match: "meet.google.com",
    color: "bg-green-500",
    description: "Secure video meetings for teams"
  },
  {
    name: "Zoom",
    icon: "/Icons/zoom.svg",
    match: "zoom.us",
    color: "bg-blue-500",
    description: "Video conferencing and webinars"
  },
  {
    name: "Microsoft Teams",
    icon: "/Icons/teams.png",
    match: "teams.microsoft.com",
    color: "bg-purple-500",
    description: "Collaboration and communication platform"
  },
  {
    name: "Other Meeting",
    icon: "/Icons/other.webp",
    match: "",
    color: "bg-gray-500",
    description: "Any other meeting platform"
  },
];

const breadcrumbItems = [{ label: "Online Meeting" }];

// New Instructions Component


const Meeting = () => {
  const [activeTab, setActiveTab] = useState(1);
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [meetingPassword, setMeetingPassword] = useState("");
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [finalTranscript, setFinalTranscript] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEndingModal, setShowEndingModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [showFullData, setShowFullData] = useState(null);
  const [audioID, setAudioID] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [activePlatform, setActivePlatform] = useState(null);
  const [showCaptions, setShowCaptions] = useState(false);
  const [detectLanguage, setDetectLanguage] = useState("");
  const [updatedMeetingId, setUpdatedMeetingId] = useState(null);
  const [uploadedUserId, setUploadedUserId] = useState(null);
  const [historyID, setHistoryID] = useState(null);
  const [meetingTime, setMeetingTime] = useState(0); // in seconds
  const [timerActive, setTimerActive] = useState(false);

  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const { addToast } = useToast();
  const recordedChunksRef = useRef([]);
  const screenStreamRef = useRef(null);

  const [liveTranscript, setLiveTranscript] = useState("");
  const captionsRef = useRef(null);

  const startMeeting = async () => {
    if (!meetingLink) {
      addToast("error", "Please paste a meeting link");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      addToast("error", "Your browser doesn't support audio recording");
      return;
    }

    setIsMeetingActive(true);

    // Use Socket.IO instead of raw WebSocket
    const socket = io(import.meta.env.VITE_BACKEND_URL, {
      transports: ["websocket"],
    });
    wsRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server with Socket.IO", socket.id);

      // Join a room (for example, using meetingLink as roomId)
      socket.emit("host:join-room", { roomId: meetingLink });
      setTimerActive(true);
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
      addToast("error", "Connection error occurred");
    });

    // Listen for Deepgram captions instead of transcript
    socket.on("caption", ({ text, isFinal }) => {
      if (!text) return;

      setTranscript((prev) => {
        if (isFinal) {
          return [...prev, text];
        } else {
          return prev;
        }
      });

      setLiveTranscript(text);
    });

    // Start audio capture
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const systemStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
      });
      screenStreamRef.current = systemStream;

      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      audioContext.createMediaStreamSource(micStream).connect(destination);
      audioContext.createMediaStreamSource(systemStream).connect(destination);

      const stream = destination.stream;
      mediaStreamRef.current = stream;

      // Add MediaRecorder to capture full session audio
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.start(1000);
      console.log("MediaRecorder started");

      const audioContext2 = new AudioContext({ sampleRate: 16000 });
      const source = audioContext2.createMediaStreamSource(stream);
      const processor = audioContext2.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(audioContext2.destination);

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const buffer = convertFloat32ToPCM16(input);
        if (socket.connected) {
          socket.emit("audio-chunk", buffer);
        }
      };

      function convertFloat32ToPCM16(buffer) {
        const l = buffer.length;
        const output = new Int16Array(l);
        for (let i = 0; i < l; i++) {
          const s = Math.max(-1, Math.min(1, buffer[i]));
          output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return output.buffer;
      }

      const tableSection = document.getElementById("listening");
      if (tableSection) {
        tableSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      addToast("success", "Meeting started successfully! Live transcription is active.");
    } catch (error) {
      addToast(
        "error",
        "Microphone access denied. Please allow microphone permissions"
      );
      console.error("Meeting start failed:", error);
      socket.disconnect();
    }
  };

  const endMeeting = async () => {
    console.log("Clicked end meeting button", mediaRecorderRef.current);
    setTimerActive(false);
    setShowEndingModal(true);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "audio/mpeg",
        });
        const file = new File([blob], `recording_${Date.now()}.mp3`, {
          type: "audio/mpeg",
        });
        const formData = new FormData();
        formData.append("audio", file);
        formData.append("source", "Online Meeting Conversion");
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/upload/upload-audio`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );
          setHistoryID(response?.data?.id);
          setAudioID(response?.data?.audioId);
          setUpdatedMeetingId(response?.data?.transcriptAudioId);
          setUploadedUserId(response?.data?.userId);
          setShowEndingModal(false);
          setFinalTranscript(response.data.transcription || "");
          setDetectLanguage(response.data.language);
          setShowModal(true);
          setIsMeetingActive(false);
        } catch (error) {
          console.error("AssemblyAI transcription failed:", error);
          addToast("error", "Failed to transcribe audio");
        }
      };
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    setMeetingLink("");
  };

  const { email, fullName, token } = useSelector((state) => state.auth);

  const handleSaveHeaders = async (
    headers,
    audioIdFromUpload,
    transcriptAudioIdFromUpload,
    userIdFromUpload
  ) => {
    setIsSending(true);
    try {
      const tableData = await processTranscriptWithDeepSeek(
        finalTranscript,
        headers,
        audioIdFromUpload,
        userIdFromUpload,
        transcriptAudioIdFromUpload,
        detectLanguage,
        historyID
      );
      console.log("Table data received:", tableData);
      if (!Array.isArray(tableData.final_mom)) {
        addToast("error", "Could not process meeting notes");
        return;
      }

      setTranscript([]);
      setShowFullData(tableData.final_mom);
      setIsSending(false);
      setShowModal2(true);
    } catch (error) {
      console.error("Error converting transcript:", error);
      addToast("error", "Failed to convert transcript");
      setShowModal2(false);
      setShowModal(false);
    }
  };

  const HandleSaveTable = async (data, downloadOptions) => {
    saveTranscriptFiles(data, addToast, downloadOptions, email, fullName);
    // 🕒 Get user's local time
    const formattedUTCDate = DateTime.utc().toFormat("yyyy-LL-dd HH:mm:ss");

const historyData = {
  source: "Online Meeting Conversion",
  date: formattedUTCDate, // send UTC time to backend
  data: data,
  language: detectLanguage,
  audio_id: audioID,
};
    setShowModal2(false);
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value.trim();
    setMeetingLink(value);
    if (value === "") {
      setActivePlatform(null);
      return;
    }
    const matched = meetingPlatforms.find(
      (p) => p.match && value.includes(p.match)
    );
    if (matched) {
      setActivePlatform(matched.name);
    } else {
      setActivePlatform("Other Meeting");
    }
  };

  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => {
        setMeetingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (captionsRef.current && showCaptions) {
      const scrollContainer = captionsRef.current;
      // Smooth scroll to bottom with a small delay to ensure content is rendered
      setTimeout(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [transcript, liveTranscript, showCaptions]);

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" name="robots" content="noindex, nofollow" />
        <title>Smart Minutes of the Meeting (OfficeMoM) | Meeting</title>
        <link rel="canonical" href="https://officemom.me/meeting" />
      </Helmet>
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Enhanced Background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
            <div className="absolute top-3/4 left-1/3 w-60 h-60 bg-green-300 dark:bg-green-600 rounded-full blur-3xl animate-pulse-slow animation-delay-3000"></div>
          </div>

          {/* Enhanced Grid pattern */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
          </div>
        </div>

        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll lg:pb-0 pb-10">
          <div className="min-h-screen">
            {!showModal && <Breadcrumb items={breadcrumbItems} />}

            {/* Enhanced Hero Section */}
            {!isMeetingActive && !showModal && (
              <div className="text-center mb-8 mt-10 px-4">
                <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-fade-in-up pb-1 lg:pb-3">
                  Smart Meeting Assistant
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto animate-fade-in-up animation-delay-300">
                  Transform your meetings with AI-powered transcription, automatic minutes, and actionable insights
                </p>
              </div>
            )}

            {showModal ? (
              <section className="p-4 md:p-0 md:px-10 lg:px-0 lg:pl-10 lg:pr-6 lg:max-w-full max-w-screen container mx-auto px-4 flex justify-center items-center">
                {showModal2 ? (
                  <RealTablePreview
                    showFullData={showFullData}
                    detectLanguage={detectLanguage}
                    onSaveTable={(data, downloadOptions) => {
                      HandleSaveTable(data, downloadOptions);
                    }}
                  />
                ) : (
                  <TablePreview
                    onSaveHeaders={(headers) =>
                      handleSaveHeaders(
                        headers,
                        audioID,
                        updatedMeetingId,
                        uploadedUserId
                      )
                    }
                    isSending={isSending}
                  />
                )}
              </section>
            ) : (
              <>
                {isMeetingActive ? (
                  <div className="h-screen flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl">
                      <section className="md:px-8 flex flex-col items-center ">
                        {/* Enhanced Live Recording Status */}
                        <div className="mb-8 text-center">
                          <div className="flex items-center justify-center mb-4">
                            <div className="relative">
                              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
                              <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50"></div>
                              <div className="relative w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                                <Mic className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          </div>

                          <h1 className="text-4xl pb-4 md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 animate-pulse mb-2">
                            Meeting is Live
                          </h1>

                          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                            AI transcription is actively capturing your meeting
                          </p>


                          {/* Enhanced Audio Wave Animation */}
                          <div className="flex items-center justify-center space-x-1 mb-6  h-[5rem]">
                            {[...Array(7)].map((_, i) => (
                              <div
                                key={i}
                                className="w-2 bg-gradient-to-t from-green-400 to-blue-500 rounded-full animate-pulse"
                                style={{
                                  height: `${Math.random() * 50 + 20}px`,
                                  animationDelay: `${i * 0.1}s`,
                                  animationDuration: `${Math.random() * 0.5 + 0.5}s`,
                                }}></div>
                            ))}
                            <span className="ml-4 text-green-400 font-semibold text-lg animate-pulse flex items-center">
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-ping"></div>
                              Listening...
                            </span>
                            {[...Array(7)].map((_, i) => (
                              <div
                                key={i + 7}
                                className="w-2 bg-gradient-to-t from-blue-500 to-green-400 rounded-full animate-pulse"
                                style={{
                                  height: `${Math.random() * 50 + 20}px`,
                                  animationDelay: `${(i + 7) * 0.1}s`,
                                  animationDuration: `${Math.random() * 0.5 + 0.5}s`,
                                }}></div>
                            ))}
                          </div>
                          <div className="mb-4">
                            <div className="inline-flex items-center bg-black/30 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                              <Clock className="w-5 h-5 text-green-400 mr-2" />
                              <span className="text-2xl font-mono font-bold text-white">
                                {formatTime(meetingTime)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Control Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                          <button
                            onClick={() => setShowCaptions(!showCaptions)}
                            className={`px-8 cursor-pointer py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 ${showCaptions
                              ? "bg-gradient-to-r from-blue-500 to-purple-600 shadow-blue-500/25"
                              : "bg-gradient-to-r from-gray-600 to-gray-700 shadow-gray-500/25 hover:from-blue-500 hover:to-purple-600"
                              }`}>
                            {showCaptions ? (
                              <>
                                <Pause className="w-5 h-5" />
                                Hide Live Captions
                              </>
                            ) : (
                              <>
                                <Play className="w-5 h-5" />
                                Show Live Captions
                              </>
                            )}
                          </button>

                          <button
                            onClick={endMeeting}
                            disabled={showEndingModal}
                            className="px-8 cursor-pointer py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-red-400 disabled:to-pink-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25 disabled:transform-none flex items-center justify-center gap-2">
                            <Square className="w-5 h-5" />
                            {showEndingModal ? "Ending..." : "End Meeting"}
                          </button>
                        </div>

                        <div
                          className={`w-full  transition-all duration-500 ease-in-out ${showCaptions
                            ? "opacity-100 max-h-96"
                            : "opacity-0 max-h-0 overflow-hidden"
                            }`}>
                          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
                            <div className="flex items-center mb-4">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
                              <h3 className="text-xl font-semibold dark:text-white flex items-center">
                                <Mic className="w-5 h-5 mr-2" />
                                Live Captions
                              </h3>
                              <span className="ml-auto text-sm text-green-400 font-medium bg-green-400/20 px-3 py-1 rounded-full">
                                LIVE
                              </span>
                            </div>

                            {/* Remove animations from the text container */}
                            <div
                              ref={captionsRef}
                              className="h-48 overflow-y-auto bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                              <div className="dark:text-white/90 leading-relaxed text-lg">
                                {transcript.map((text, index) => (
                                  <span key={index} className="mr-1">
                                    {text}
                                  </span>
                                ))}
                                {liveTranscript && (
                                  <span className="text-green-300 ml-1">
                                    {liveTranscript}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 flex justify-between items-center text-sm dark:text-gray-300 text-gray-700">
                              <span>Words captured: {transcript.join(' ').split(' ').filter(word => word.length > 0).length}</span>
                              <span>Language: Auto-detected</span>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Modal */}
                        {showEndingModal && (
                          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-white/10 animate-scaleIn max-w-md w-full mx-4">
                              <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                  <Square className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">
                                  Processing Meeting
                                </h3>
                                <p className="text-gray-300 mb-4">
                                  Generating your meeting minutes with AI...
                                </p>
                                <div className="flex justify-center space-x-2">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce animation-delay-200"></div>
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce animation-delay-400"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </section>
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full flex flex-col gap-6 lg:gap-10 pb-10 container mx-auto px-4 lg:px-6">
                    {/* Timing Component - Full width on all devices */}
                    <div className="w-full">
                      <Timing />
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full">
                      {/* Meeting Input Card - Full width on mobile/tablet, 2/3 on desktop */}
                      <div className="lg:col-span-2 w-full">
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-white/20">
                          {/* Tab Navigation */}
                          <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 mb-4 sm:mb-6">
                            <button
                              onClick={() => setActiveTab(1)}
                              className={`flex-1 cursor-pointer py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all flex items-center justify-center text-sm sm:text-base ${activeTab === 1
                                ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-md transform"
                                : "text-gray-600 dark:text-gray-300 hover:text-indigo-600"
                                }`}
                            >
                              <Video className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                              <span className="hidden md:inline">Meeting Link</span>
                              <span className="md:hidden">Link</span>
                            </button>
                            <button
                              onClick={() => setActiveTab(2)}
                              className={`flex-1 cursor-pointer py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all flex items-center justify-center text-sm sm:text-base ${activeTab === 2
                                ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-md transform"
                                : "text-gray-600 dark:text-gray-300 hover:text-indigo-600"
                                }`}
                            >
                              <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                              <span className="hidden md:inline">ID & Password</span>
                              <span className="md:hidden">ID & Pass</span>
                            </button>
                          </div>

                          <div className="space-y-4 sm:space-y-6">
                            {activeTab === 1 && (
                              <div className="space-y-4">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                                  <h1 className="text-gray-600 dark:text-white text-lg sm:text-xl flex items-center">
                                    <FcConferenceCall className="mr-2" />
                                    Paste meeting URL
                                  </h1>
                                  <span className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-2 py-1 rounded-full self-start sm:self-center sm:ml-2">
                                    Recommended
                                  </span>
                                </div>

                                {/* Platform Selection Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                  {meetingPlatforms.map((platform, index) => (
                                    <div
                                      key={platform.name}
                                      className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg transition-all cursor-pointer bg-gray-200 dark:bg-slate-700 hover:scale-105 ${activePlatform === platform.name
                                        ? "ring-2 ring-offset-1 sm:ring-offset-2 ring-blue-500 bg-blue-100 dark:bg-blue-800"
                                        : ""
                                        }`}
                                      onClick={() => {
                                        setActivePlatform(platform.name);
                                        if (platform.match) {
                                          setMeetingLink(`https://${platform.match}/...`);
                                        }
                                      }}
                                    >
                                      <img
                                        src={platform.icon}
                                        alt={platform.name}
                                        className="h-6 w-6 sm:h-8 sm:w-8"
                                      />
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                                        {platform.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Input Field */}
                                <div className="flex items-center border border-gray-500 rounded-lg p-3 w-full bg-white/50 dark:bg-slate-700/50 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                                  <FcConferenceCall className="text-blue-500 text-lg sm:text-xl mr-2 sm:mr-3 flex-shrink-0" />
                                  <input
                                    type="text"
                                    placeholder="Paste your meeting link here..."
                                    className="flex-1 outline-none bg-transparent text-gray-700 dark:text-white py-1 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
                                    value={meetingLink}
                                    onChange={handleInputChange}
                                  />
                                </div>

                                {/* Platform Detection Message */}
                                {activePlatform && (
                                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-800 dark:text-blue-300">
                                      <span className="font-semibold">{activePlatform}</span> detected. Make sure you've joined the meeting before starting transcription.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {activeTab === 2 && (
                              <div className="min-h-48 sm:min-h-60 flex flex-col justify-center items-center py-4">
                                <div className="relative text-center">
                                  <div className="absolute -inset-3 sm:-inset-4">
                                    <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-full opacity-70 animate-ping"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 sm:w-6 sm:h-6 bg-blue-500 rounded-full opacity-60 animate-ping animation-delay-1000"></div>
                                    <div className="absolute bottom-0 left-0 w-5 h-5 sm:w-7 sm:h-7 bg-green-500 rounded-full opacity-80 animate-ping animation-delay-1500"></div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-5 sm:h-5 bg-yellow-500 rounded-full opacity-70 animate-ping animation-delay-500"></div>
                                  </div>

                                  <div className="relative z-10 text-center">
                                    <div className="flex justify-center mb-3 sm:mb-4">
                                      <div className="relative">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-spin">
                                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white dark:bg-gray-800 rounded-full"></div>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <svg
                                            className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400 animate-pulse"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M13 10V3L4 14h7v7l9-11h-7z"
                                            />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>

                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">
                                      Coming Soon!
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 max-w-md px-2">
                                      We're currently working on direct meeting integration. For now, please use the meeting link option above.
                                    </p>
                                    <div className="flex items-center justify-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                      <div className="flex items-center">
                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1 sm:mr-2 animate-pulse"></div>
                                        In Development
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                              <button
                                onClick={startMeeting}
                                disabled={!meetingLink}
                                className="flex-1 cursor-pointer py-3 sm:py-4 px-4 sm:px-8 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform  shadow-lg shadow-green-500/25 disabled:transform-none flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
                              >
                                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                                Start Transcription
                              </button>

                              <button
                                onClick={() => {
                                  setMeetingLink("");
                                  setActivePlatform(null);
                                }}
                                className="px-4 cursor-pointer sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base"
                              >

                                <BrushCleaning className="w-4 h-4 sm:w-5 sm:h-5" />
                                Clear
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* History Sidebar - Full width on mobile/tablet, 1/3 on desktop */}
                      <div className="lg:col-span-1 w-full">
                        <div className="h-80 sm:h-96 lg:h-[27rem] w-full">
                          <AllHistory NeedFor={"Online Meeting Conversion"} height="100%" />
                        </div>
                      </div>
                    </div>

                    {/* OnlineMeeting Component - Full width on all devices */}
                    <div className="w-full">
                      <MeetingInstruction needFor={"Online Meeting Conversion"} />
                    </div>
                    <MeetingFeatures />
                  </div>
                )}
              </>
            )}
          </div>
          <Footer />
        </div>
      </section>
    </>
  );
};

export default Meeting;