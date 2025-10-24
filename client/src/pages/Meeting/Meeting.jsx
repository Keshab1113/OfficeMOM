import { useState, useRef } from "react";
import Timing from "../../components/Timing/Timing";
import { cn } from "../../lib/utils";
import { FcConferenceCall } from "react-icons/fc";
import { useToast } from "../../components/ToastContext";
import { saveTranscriptFiles } from "../../components/TextTable/TextTable";
import TablePreview from "../../components/TablePreview/TablePreview";
import Footer from "../../components/Footer/Footer";
import { useSelector } from "react-redux";
import AllHistory from "../../components/History/History";
import { Video, Users, FileText } from "lucide-react";
import Heading from "../../components/LittleComponent/Heading";
import RealTablePreview from "../../components/TablePreview/RealTablePreview";
import { Helmet } from "react-helmet";
import axios from "axios";
import { io } from "socket.io-client";
import { processTranscriptWithDeepSeek } from "../../lib/apiConfig";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";

const meetingPlatforms = [
  {
    name: "Google Meet",
    icon: "/Icons/meet.svg",
    match: "meet.google.com",
    color: "bg-green-500",
  },
  {
    name: "Zoom",
    icon: "/Icons/zoom.svg",
    match: "zoom.us",
    color: "bg-blue-500",
  },
  {
    name: "Microsoft Teams",
    icon: "/Icons/teams.png",
    match: "teams.microsoft.com",
    color: "bg-purple-500",
  },
  {
    name: "Other Meeting",
    icon: "/Icons/other.webp",
    match: "",
    color: "bg-gray-500",
  },
];
const breadcrumbItems = [{ label: "Online Meeting" }];

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
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
      addToast("error", "Connection error occurred");
    });

    // Listen for Deepgram captions instead of transcript
    // 👇 Maintain live and final captions separately
    socket.on("caption", ({ text, isFinal }) => {
      if (!text) return;

      setTranscript((prev) => {
        if (isFinal) {
          // ✅ Add only finalized captions permanently
          return [...prev, text];
        } else {
          // ⏳ Interim — just update the last element visually
          return prev;
        }
      });

      setLiveTranscript(text);

      // ✅ Correct console log
      // console.log("Received caption:", text, "| isFinal:", isFinal);
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

      mediaRecorder.start(1000); // collect chunks every second
      console.log("MediaRecorder started");

      // --- Replace MediaRecorder with raw PCM streaming ---
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

      addToast("info", "Using microphone for meeting audio");
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
        formData.append("recordedAudio", file);
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
          setUploadedUserId(response?.data?.userId); // save userId here
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
      console.log("Table data received:", tableData); // Debug log
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
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const dateCreated = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const historyData = {
      source: "Online Meeting Conversion",
      date: dateCreated,
      data: data,
      language: detectLanguage,
      audio_id: audioID,
    };
    // await addHistory(token, historyData, addToast, updatedMeetingId);
    setShowModal2(false);
    setShowModal(false);
  };

  // const addHistory = async (token, historyData, addToast, updatedMeetingId) => {
  //   try {
  //     await axios.patch(
  //       `${
  //         import.meta.env.VITE_BACKEND_URL
  //       }/api/live-meeting/audio-files/${updatedMeetingId}`,
  //       historyData,
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );
  //   } catch (err) {
  //     console.error("Add history error:", err);
  //     addToast("error", "Failed to add history");
  //   }
  // };

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

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Smart Minutes of the Meeting (OfficeMoM) | Meeting</title>
        <link rel="canonical" href="https://officemom.me/meeting" />
      </Helmet>
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
          </div>

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
          </div>
        </div>
        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll ">
          <div className=" min-h-screen">
            {!showModal && <Breadcrumb items={breadcrumbItems} />}
            {!isMeetingActive && (
              <Heading
                heading="Take Notes from Online Meeting"
                subHeading="Connect Zoom, Google Meet, or Teams link and generate automatic MoM."
              />
            )}
            {showModal ? (
              <section className=" p-4 md:p-0 md:px-10 lg:px-0 lg:pl-10 lg:pr-6 lg:max-w-full max-w-screen">
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
                        audioID, // audio_id from upload
                        updatedMeetingId, // transcript_audio_id
                        uploadedUserId  // userId from upload
                      )
                    }
                    isSending={isSending}
                  />
                )}
              </section>
            ) : (
              <>
                {isMeetingActive ? (
                  <div className=" h-screen flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl">
                      <section className="px-8 flex flex-col items-center">
                        {/* Live Recording Status */}
                        <div className="mb-8 text-center">
                          <div className="flex items-center justify-center mb-4">
                            <div className="relative">
                              {/* Pulsing circles animation */}
                              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
                              <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50"></div>
                              <div className="relative w-6 h-6 bg-red-500 rounded-full"></div>
                            </div>
                          </div>

                          <h1 className="text-4xl pb-4 md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 animate-pulse mb-2">
                            Meeting is Live
                          </h1>

                          {/* Audio Wave Animation */}
                          <div className="flex items-center justify-center space-x-1 mb-6">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className="w-1 bg-gradient-to-t from-green-400 to-blue-500 rounded-full animate-pulse"
                                style={{
                                  height: `${Math.random() * 40 + 20}px`,
                                  animationDelay: `${i * 0.1}s`,
                                  animationDuration: `${Math.random() * 0.5 + 0.5
                                    }s`,
                                }}></div>
                            ))}
                            <span className="ml-4 text-green-400 font-semibold text-lg animate-pulse">
                              Listening...
                            </span>
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i + 5}
                                className="w-1 bg-gradient-to-t from-blue-500 to-green-400 rounded-full animate-pulse"
                                style={{
                                  height: `${Math.random() * 40 + 20}px`,
                                  animationDelay: `${(i + 5) * 0.1}s`,
                                  animationDuration: `${Math.random() * 0.5 + 0.5
                                    }s`,
                                }}></div>
                            ))}
                          </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                          <button
                            onClick={() => setShowCaptions(!showCaptions)}
                            className={`px-8 cursor-pointer py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg ${showCaptions
                              ? "bg-gradient-to-r from-blue-500 to-purple-600 shadow-blue-500/25"
                              : "bg-gradient-to-r from-gray-600 to-gray-700 shadow-gray-500/25 hover:from-blue-500 hover:to-purple-600"
                              }`}>
                            {showCaptions
                              ? "🔊 Hide Live Captions"
                              : "📝 Show Live Captions"}
                          </button>

                          <button
                            onClick={endMeeting}
                            disabled={showEndingModal}
                            className="px-8 cursor-pointer py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-red-400 disabled:to-pink-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25 disabled:transform-none">
                            {showEndingModal
                              ? "⏹️ Ending..."
                              : "🔴 End Meeting"}
                          </button>
                        </div>

                        {/* Live Captions */}
                        <div
                          className={`w-full transition-all duration-500 ease-in-out transform ${showCaptions
                            ? "opacity-100 translate-y-0 max-h-96"
                            : "opacity-0 -translate-y-4 max-h-0 overflow-hidden"
                            }`}>
                          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
                            <div className="flex items-center mb-4">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
                              <h3 className="text-xl font-semibold dark:text-white">
                                Live Captions
                              </h3>
                            </div>

                            <div
                              ref={captionsRef}
                              className="h-48 overflow-y-auto bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                              <div className="dark:text-white/90 leading-relaxed flex flex-wrap gap-1">
                                {/* Show all finalized transcript as plain text */}
                                {transcript.join(" ") + " "}

                                {/* Append live transcript in real-time */}
                                <span className="text-gray-300 italic">
                                  {liveTranscript}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Modal */}
                        {showEndingModal && (
                          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-white/10 animate-scaleIn">
                              <div className="text-center">
                                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                  <span className="text-2xl">🔴</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">
                                  Meeting Ended
                                </h3>
                                <p className="text-gray-300">
                                  Please wait, we are creating MoM...
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </section>
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full flex lg:flex-row flex-col pb-10">
                    <section className="h-fit pb-10 lg:w-[65%] w-screen md:px-10 px-4">
                      <Timing />
                      <div className="bg-white/80 mt-6 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 animate-fade-in-up">
                        <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 mb-0">
                          <button
                            onClick={() => setActiveTab(1)}
                            className={`flex-1 cursor-pointer py-3 px-4 rounded-lg font-semibold transition-all ${activeTab === 1
                              ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105"
                              : "text-gray-600 dark:text-gray-300 hover:text-indigo-600"
                              }`}>
                            <Video className="w-5 h-5 inline mr-2" />
                            Meeting Link
                          </button>
                          <button
                            onClick={() => setActiveTab(2)}
                            className={`flex-1 cursor-pointer py-3 px-4 rounded-lg font-semibold transition-all ${activeTab === 2
                              ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105"
                              : "text-gray-600 dark:text-gray-300 hover:text-indigo-600"
                              }`}>
                            <Users className="w-5 h-5 inline mr-2" />
                            ID & Password
                          </button>
                        </div>
                        <div className="space-y-6">
                          {activeTab === 1 && (
                            <div className="mt-2">
                              <h1 className="text-gray-600 dark:text-white md:text-xl text-lg mb-2">
                                Paste meeting URL
                              </h1>
                              <div className="flex gap-4 mb-2">
                                {meetingPlatforms.map((platform, index) => (
                                  <div
                                    key={platform.name}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg 
                        bg-gray-200 dark:bg-slate-700 hover:scale-105 transition-transform animate-fade-in-up
                        ${activePlatform === platform.name
                                        ? "ring-2 ring-offset-2 ring-blue-500"
                                        : ""
                                      }`}
                                    style={{
                                      animationDelay: `${500 + index * 100}ms`,
                                    }}>
                                    <img
                                      src={platform.icon}
                                      alt={platform.name}
                                      className="h-8 w-8"
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center border border-gray-500 rounded-lg p-2 w-full">
                                <FcConferenceCall className="text-blue-500 text-xl mr-2" />
                                <input
                                  type="text"
                                  placeholder={"Enter meeting link"}
                                  className="flex-1 outline-none bg-transparent text-gray-700 dark:text-white py-1"
                                  value={meetingLink}
                                  onChange={handleInputChange}
                                />
                              </div>
                            </div>
                          )}

                          {activeTab === 2 && (
                            <div className="mt-2 min-h-60 flex flex-col justify-center items-center">
                              {/* <h1 className="text-gray-600 dark:text-white md:text-xl text-lg mb-3">
                                Enter Meeting Details
                              </h1>
                              <div className="flex flex-col gap-4">
                                <input
                                  type="text"
                                  placeholder="Enter Meeting ID"
                                  className="border border-gray-500 rounded-lg p-3 w-full outline-none bg-transparent text-gray-700 dark:text-white"
                                  value={meetingId}
                                  onChange={(e) => setMeetingId(e.target.value)}
                                />
                                <input
                                  type="password"
                                  placeholder="Enter Meeting Password"
                                  className="border border-gray-500 rounded-lg p-3 w-full outline-none bg-transparent text-gray-700 dark:text-white"
                                  value={meetingPassword}
                                  onChange={(e) =>
                                    setMeetingPassword(e.target.value)
                                  }
                                />
                              </div> */}
                              <div className="relative">
                                {/* Animated background circles */}
                                <div className="absolute -inset-4">
                                  <div className="absolute top-0 left-0 w-8 h-8 bg-purple-500 rounded-full opacity-70 animate-ping"></div>
                                  <div className="absolute top-0 right-0 w-6 h-6 bg-blue-500 rounded-full opacity-60 animate-ping animation-delay-1000"></div>
                                  <div className="absolute bottom-0 left-0 w-7 h-7 bg-green-500 rounded-full opacity-80 animate-ping animation-delay-1500"></div>
                                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-yellow-500 rounded-full opacity-70 animate-ping animation-delay-500"></div>
                                </div>

                                {/* Main content */}
                                <div className="relative z-10 text-center">
                                  {/* Animated icon */}
                                  <div className="flex justify-center mb-4">
                                    <div className="relative">
                                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-spin">
                                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full"></div>
                                      </div>
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <svg
                                          className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-pulse"
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

                                  {/* Text with gradient animation */}
                                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent bg-size-200 bg-pos-0 animate-gradient">
                                    Under Progress...
                                  </h1>

                                  {/* Subtitle with fade animation */}
                                  <p className="text-gray-600 dark:text-gray-300 mt-3 animate-pulse">
                                    Feature coming soon!
                                  </p>

                                  {/* Animated dots */}
                                  <div className="flex justify-center space-x-1 mt-4">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-200"></div>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce animation-delay-400"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          disabled={!meetingLink.trim()}
                          onClick={startMeeting}
                          className={`mt-6 w-full py-4 flex justify-center items-center gap-2 rounded-lg text-gray-600 dark:text-white font-semibold transition-colors duration-300 ${meetingLink.trim()
                            ? "bg-blue-400 hover:bg-blue-500 cursor-pointer"
                            : "bg-gray-500/30 cursor-not-allowed"
                            }
                            ${activeTab === 2 ? "hidden" : ""}`}>
                          <FileText className="w-6 h-6" />
                          Start Meeting (Minutes of Meeting)
                        </button>
                        {/* <p className={`text-xs text-gray-400 mt-3 text-center ${activeTab === 2 ? "hidden" : ""}`}>
                          🆓 Meeting transcription is completely free now
                        </p> */}
                      </div>
                    </section>
                    <section className="lg:w-[35%] w-screen lg:pr-6 px-4 md:px-10 lg:px-0">
                      <AllHistory NeedFor={"Online Meeting Conversion"} />
                    </section>
                  </div>
                )}
              </>
            )}
          </div>
          <Footer />
        </div>
        <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-float"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
        <div className="absolute bottom-32 right-32 w-5 h-5 bg-green-400 rounded-full opacity-40 animate-float animation-delay-1500"></div>
      </section>
    </>
  );
};

export default Meeting;
