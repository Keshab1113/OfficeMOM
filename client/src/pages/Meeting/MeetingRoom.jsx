import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../../components/ToastContext";
import Footer from "../../components/Footer/Footer";
import { useSelector } from "react-redux";
import { Play, Pause, Square, Mic, Clock, Share, AlertCircle } from "lucide-react";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";
import { Helmet } from "react-helmet";
import axios from "axios";
import { io } from "socket.io-client";
import RechargeModal from './../../components/RechargeModal/RechargeModal';

const breadcrumbItems = [{ label: "Online Meeting" }];

export default function MeetingRoom() {
    const { meetingId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const meetingLink = state?.meetingLink || "";
    const activePlatform = state?.activePlatform || "";
    const { token } = useSelector((s) => s.auth);

    const [transcript, setTranscript] = useState([]);
    const [liveTranscript, setLiveTranscript] = useState("");
    const [showCaptions, setShowCaptions] = useState(false);
    const [showEndingModal, setShowEndingModal] = useState(false);
    const [meetingTime, setMeetingTime] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isScreenShared, setIsScreenShared] = useState(false);
    const [showScreenSharePrompt, setShowScreenSharePrompt] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    const [rechargeInfo, setRechargeInfo] = useState(null);



    const wsRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const screenStreamRef = useRef(null);
    const captionsRef = useRef(null);
    const micStreamRef = useRef(null);
const isEndingRef = useRef(false);
const planTypeRef = useRef(null);
const meetingTimeRef = useRef(0); 
    // Timer
    // useEffect(() => {
    //     let interval;
    //     if (timerActive) {
    //         interval = setInterval(() => setMeetingTime((prev) => prev + 1), 1000);
    //     }
    //     return () => clearInterval(interval);
    // }, [timerActive]);

useEffect(() => {
    const fetchSubscription = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/subscription`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            planTypeRef.current = res.data?.data?.plan_name?.toLowerCase().includes("free") ? "free" : "paid";
            console.log("User Plan Type:", planTypeRef.current);
        } catch (err) {
            console.error("Subscription check failed:", err);
        }
    };

    fetchSubscription();
}, [token]);

useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
        setMeetingTime((prev) => {
            const newTime = prev + 1;
            meetingTimeRef.current = newTime; // ✅ keep live time synced

            // 🧪 Auto-end after 2 minutes for free users
            if (planTypeRef.current === "free" && newTime >= 120) {
                addToast("info", "Free plan meeting limit reached (auto-ended after 2 minutes for testing).");
                endMeeting();
            }

            return newTime;
        });
    }, 1000);

    return () => clearInterval(interval);
}, [timerActive]);



    // Scroll captions down automatically
    useEffect(() => {
        if (captionsRef.current && showCaptions) {
            setTimeout(() => {
                captionsRef.current.scrollTo({
                    top: captionsRef.current.scrollHeight,
                    behavior: "smooth",
                });
            }, 100);
        }
    }, [transcript, liveTranscript, showCaptions]);

    const startScreenSharing = async () => {
        if (!meetingLink) {
            addToast("error", "Please paste a meeting link");
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            addToast("error", "Your browser doesn't support audio recording");
            return;
        }

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
            micStreamRef.current = micStream;
            screenStreamRef.current = systemStream;
            setIsScreenShared(true);
            setShowScreenSharePrompt(false);

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

    const toggleMute = () => {
        if (micStreamRef.current) {
            micStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(prev => !prev);
            addToast(isMuted ? "success" : "info", isMuted ? "Mic unmuted" : "Mic muted");
        }
    };


    const stopAllMedia = () => {
        console.log("Stopping all media...");
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording")
            mediaRecorderRef.current.stop();
        if (mediaStreamRef.current)
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        if (screenStreamRef.current)
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
        if (wsRef.current) wsRef.current.disconnect();
        setTimerActive(false);
    };



    // const endMeeting = async () => {

    //     if (showEndingModal) return;
    //     setTimerActive(false);
    //     setShowEndingModal(true);
    //     setIsRecording(false);
    //     stopAllMedia();

    //     try {
    //         if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
    //             await new Promise((resolve) => {
    //                 mediaRecorderRef.current.onstop = resolve;
    //                 mediaRecorderRef.current.stop();
    //             });
    //         }

    //         const finalTranscript = transcript.join(" ");
    //         if (recordedChunksRef.current.length > 0) {
    //             const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
    //             const file = new File([blob], `meeting_recording_${Date.now()}.webm`, {
    //                 type: "audio/webm",
    //             });

    //             const formData = new FormData();
    //             const meetingDurationInMinutes = Math.ceil(meetingTime / 60);
    //             formData.append("audio", file);
    //             formData.append("source", "Online Meeting Conversion");
    //             formData.append("meetingDuration", meetingDurationInMinutes);



    //             try {
    //                 const response = await axios.post(
    //                     `${import.meta.env.VITE_BACKEND_URL}/api/upload/upload-audio`,
    //                     formData,
    //                     {
    //                         headers: {
    //                             Authorization: `Bearer ${token}`,
    //                             "Content-Type": "multipart/form-data",
    //                         },
    //                     }
    //                 );

    //                 const data = response.data;

    //                 // ✅ Navigate to result page after successful upload
    //                 navigate(`/meeting/${meetingId}/result`, {
    //                     state: {
    //                         finalTranscript: data.transcription || finalTranscript,
    //                         detectLanguage: data.language || "en",
    //                         audioID: data.audioId,
    //                         updatedMeetingId: data.transcriptAudioId,
    //                         uploadedUserId: data.userId,
    //                         historyID: data.id,
    //                         transcription: data.transcription || finalTranscript,
    //                     },
    //                 });

    //                 // ✅ Show success toast with minutes info
    //                 const successMessage = data.minutesUsed
    //                     ? `${data.message || "Meeting processed successfully!"} (${data.minutesUsed} minutes used, ${data.remainingMinutes} remaining)`
    //                     : data.message || "Meeting processed successfully!";

    //                 addToast("success", successMessage);

    //             } catch (err) {
    //                 console.error("Upload failed:", err);

    //                 // 🚨 Handle insufficient minutes error (402)
    //                 if (err.response?.status === 402) {
    //                     const errorData = err.response.data;

    //                     addToast(
    //                         "error",
    //                         `Insufficient Minutes: You need ${errorData.requiredMinutes} minutes but only have ${errorData.remainingMinutes} minutes remaining. Please recharge to continue.`,
    //                         10000
    //                     );

    //                     // Optional: trigger your recharge modal or UI flow
    //                     if (setShowRechargeModal) {
    //                         setShowRechargeModal(true);
    //                         setRechargeInfo({
    //                             required: errorData.requiredMinutes,
    //                             remaining: errorData.remainingMinutes,
    //                             deficit: errorData.requiredMinutes - errorData.remainingMinutes,
    //                         });
    //                     }

    //                     // Stop here (don’t navigate)
    //                     return;
    //                 }

    //                 // ❌ Other errors
    //                 navigate(`/meeting/${meetingId}/result`, {
    //                     state: { finalTranscript, detectLanguage: "en", transcription: finalTranscript },
    //                 });
    //                 addToast("error", err.response?.data?.message || err.message || "Failed to process meeting audio");
    //             }
    //         } else {
    //             navigate(`/meeting/${meetingId}/result`, {
    //                 state: { finalTranscript, detectLanguage: "en", transcription: finalTranscript },
    //             });
    //         }
    //     } catch (error) {
    //         console.error("Error ending meeting:", error);
    //         addToast("error", "Failed to process meeting recording");
    //     } finally {
    //         setShowEndingModal(false);
    //     }
    // };

    const endMeeting = async () => {
    // 🧠 Prevent double uploads
    if (isEndingRef.current) return;
    isEndingRef.current = true;

    if (showEndingModal) return;
    setTimerActive(false);
    setShowEndingModal(true);
    setIsRecording(false);
    stopAllMedia();

    try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            await new Promise((resolve) => {
                mediaRecorderRef.current.onstop = resolve;
                mediaRecorderRef.current.stop();
            });
        }

        const finalTranscript = transcript.join(" ");
        if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
            const file = new File([blob], `meeting_recording_${Date.now()}.webm`, {
                type: "audio/webm",
            });

            const formData = new FormData();
            const durationSeconds = meetingTimeRef.current || meetingTime;
const meetingDurationInMinutes = Math.ceil(durationSeconds / 60);
console.log("🕒 Meeting duration (accurate):", durationSeconds, "seconds =", meetingDurationInMinutes, "minutes");


            formData.append("audio", file);
            formData.append("source", "Online Meeting Conversion");
            formData.append("meetingDuration", meetingDurationInMinutes);

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

                const data = response.data;
                navigate(`/meeting/${meetingId}/result`, {
                    state: {
                        finalTranscript: data.transcription || finalTranscript,
                        detectLanguage: data.language || "en",
                        audioID: data.audioId,
                        updatedMeetingId: data.transcriptAudioId,
                        uploadedUserId: data.userId,
                        historyID: data.id,
                        transcription: data.transcription || finalTranscript,
                    },
                });

                const successMessage = data.minutesUsed
                    ? `${data.message || "Meeting processed successfully!"} (${data.minutesUsed} minutes used, ${data.remainingMinutes} remaining)`
                    : data.message || "Meeting processed successfully!";

                addToast("success", successMessage);
            } catch (err) {
                console.error("Upload failed:", err);

                if (err.response?.status === 402) {
                    const errorData = err.response.data;
                    addToast(
                        "error",
                        `Insufficient Minutes: You need ${errorData.requiredMinutes} minutes but only have ${errorData.remainingMinutes} minutes remaining. Please recharge.`,
                        10000
                    );

                    if (setShowRechargeModal) {
                        setShowRechargeModal(true);
                        setRechargeInfo({
                            required: errorData.requiredMinutes,
                            remaining: errorData.remainingMinutes,
                            deficit: errorData.requiredMinutes - errorData.remainingMinutes,
                        });
                    }
                    return;
                }

                navigate(`/meeting/${meetingId}/result`, {
                    state: { finalTranscript, detectLanguage: "en", transcription: finalTranscript },
                });
                addToast("error", err.response?.data?.message || err.message || "Failed to process meeting audio");
            }
        } else {
            navigate(`/meeting/${meetingId}/result`, {
                state: { finalTranscript, detectLanguage: "en", transcription: finalTranscript },
            });
        }
    } catch (error) {
        console.error("Error ending meeting:", error);
        addToast("error", "Failed to process meeting recording");
    } finally {
        setShowEndingModal(false);
    }
};


    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    };

    // ✅ UI identical to yours
    return (
        <>
            <Helmet>
                <meta charSet="utf-8" name="robots" content="noindex, nofollow" />
                <title>Smart Minutes of the Meeting (OfficeMoM) | Meeting</title>
                <link rel="canonical" href={`https://officemom.me/meeting/${meetingId}`} />
            </Helmet>

            <section className="relative min-h-screen w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
                    </div>
                </div>

                <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll">
                    <Breadcrumb items={breadcrumbItems} />

                    <div className="flex flex-col items-center justify-center min-h-screen p-4">
                        <div className="text-center max-w-4xl w-full">
                            {/* Screen Share Prompt */}
                            {showScreenSharePrompt && !isScreenShared && (
                                <div className="mb-8 backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
                                    <div className="flex justify-center mb-6">
                                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                            <Share className="w-10 h-10 text-white" />
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                                        Ready to Start Transcription
                                    </h2>

                                    <div className="text-left mb-6 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                            <p className=" text-gray-800 dark:text-white">
                                                <strong>Step 1:</strong> First, join your meeting on {activePlatform || "your meeting platform"}
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-gray-800 dark:text-white">
                                                <strong>Step 2:</strong> Then come back here and click "Start Screen Sharing" below
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-gray-800 dark:text-white">
                                                <strong>Step 3:</strong> Only share the meeting tab
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-gray-800 dark:text-white">
                                                <strong>Important:</strong> When sharing, make sure to check <strong>"Share audio"</strong> or <strong>"Share tab audio"</strong>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <button
                                            onClick={startScreenSharing}
                                            className="px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                                        >
                                            <Share className="w-5 h-5" />
                                            Start Screen Sharing
                                        </button>

                                        <button
                                            onClick={() => navigate('/meeting')}
                                            className="px-8 py-4 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Meeting Active UI */}
                            {isScreenShared && (
                                <>
                                    {/* Enhanced Live Recording Status */}
                                    <div className="mb-8">
                                        <div className="flex items-center justify-center mb-4">
                                            <div className="relative">
                                                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
                                                <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50"></div>
                                                <div className="relative w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                                                    <Mic className="w-5 h-5 text-white" />
                                                </div>
                                            </div>
                                        </div>

                                        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 animate-pulse pb-2">
                                            Meeting is Live
                                        </h1>
                                        <p className="text-gray-600 dark:text-gray-300 text-lg">
                                            AI transcription is actively capturing your meeting
                                        </p>
                                    </div>

                                    {/* Audio Wave Animation */}
                                    <div className="flex items-center justify-center space-x-1 mb-6 h-16">
                                        {[...Array(7)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-2 bg-gradient-to-t from-green-400 to-blue-500 rounded-full animate-pulse"
                                                style={{
                                                    height: `${Math.random() * 40 + 20}px`,
                                                    animationDelay: `${i * 0.1}s`,
                                                }}
                                            ></div>
                                        ))}
                                        <span className="ml-4 text-green-400 font-semibold text-lg animate-pulse flex items-center">
                                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-ping"></div>
                                            {isRecording ? "Listening..." : "Starting..."}
                                        </span>
                                        {[...Array(7)].map((_, i) => (
                                            <div
                                                key={i + 7}
                                                className="w-2 bg-gradient-to-t from-blue-500 to-green-400 rounded-full animate-pulse"
                                                style={{
                                                    height: `${Math.random() * 40 + 20}px`,
                                                    animationDelay: `${(i + 7) * 0.1}s`,
                                                }}
                                            ></div>
                                        ))}
                                    </div>

                                    {/* Timer */}
                                    <div className="mb-6">
                                        <div className="inline-flex items-center bg-black/30 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                                            <Clock className="w-5 h-5 text-green-400 mr-2" />
                                            <span className="text-2xl font-mono font-bold text-white">
                                                {formatTime(meetingTime)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Control Buttons */}
                                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                                        <button
                                            onClick={() => setShowCaptions(!showCaptions)}
                                            className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 ${showCaptions
                                                ? "bg-gradient-to-r from-blue-500 to-purple-600 shadow-blue-500/25"
                                                : "bg-gradient-to-r from-gray-600 to-gray-700 shadow-gray-500/25 hover:from-blue-500 hover:to-purple-600"
                                                }`}
                                        >
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
                                            onClick={toggleMute}
                                            className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 ${isMuted
                                                ? "bg-gradient-to-r from-gray-600 to-gray-700 shadow-gray-500/25 hover:from-gray-500 hover:to-gray-600"
                                                : "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/25 hover:from-green-600 hover:to-emerald-700"
                                                }`}
                                        >
                                            {isMuted ? (
                                                <>
                                                    <Mic className="w-5 h-5 opacity-70" />
                                                    Unmute
                                                </>
                                            ) : (
                                                <>
                                                    <Mic className="w-5 h-5" />
                                                    Mute
                                                </>
                                            )}
                                        </button>


                                        <button
                                            onClick={endMeeting}
                                            disabled={showEndingModal}
                                            className="px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-red-400 disabled:to-pink-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
                                        >
                                            <Square className="w-5 h-5" />
                                            {showEndingModal ? "Ending..." : "End Meeting"}
                                        </button>
                                    </div>

                                    {/* Live Captions Section */}
                                    <div
                                        className={`w-full transition-all duration-500 ease-in-out ${showCaptions
                                            ? "opacity-100 max-h-96"
                                            : "opacity-0 max-h-0 overflow-hidden"
                                            }`}
                                    >
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

                                            <div
                                                ref={captionsRef}
                                                className="h-48 overflow-y-auto bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
                                            >
                                                <div className="dark:text-white/90 leading-relaxed text-lg text-start">
                                                    {transcript.length === 0 && !liveTranscript ? (
                                                        <p className="text-gray-400 italic">
                                                            Waiting for speech to be detected... Speak clearly into your microphone.
                                                        </p>
                                                    ) : (
                                                        <>
                                                            {transcript.map((text, index) => (
                                                                <span key={index} className="mr-1">
                                                                    {text}
                                                                </span>
                                                            ))}
                                                            {liveTranscript && (
                                                                <span className="text-green-300 ml-1 animate-pulse">
                                                                    {liveTranscript}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex justify-between items-center text-sm dark:text-gray-300 text-gray-700">
                                                <span>Words captured: {transcript.join(' ').split(' ').filter(word => word.length > 0).length}</span>
                                                <span>Language: Auto-detected</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Ending Modal */}
                            {showEndingModal && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full mx-4">
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
                        </div>
                    </div>
                    <Footer />
                </div>
            </section>
            {showRechargeModal && (
                <RechargeModal
                    isOpen={showRechargeModal}
                    onClose={() => setShowRechargeModal(false)}
                    requiredMinutes={rechargeInfo?.required || 0}
                    remainingMinutes={rechargeInfo?.remaining || 0}
                    onRecharge={() => {
                        window.location.href = '/recharge'; // Update with your actual pricing page route
                    }}
                />
            )}
        </>
    );
}
