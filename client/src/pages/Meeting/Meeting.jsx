import { useState, useRef } from "react";
import Timing from "../../components/Timing/Timing";
import { cn } from "../../lib/utils";
import { FcConferenceCall } from "react-icons/fc";
import { useToast } from "../../components/ToastContext";
import { saveTranscriptFiles } from "../../components/TextTable/TextTable";
import DownloadOptions from "../../components/DownloadOptions/DownloadOptions";
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

const Meeting = () => {
  const [activeTab, setActiveTab] = useState(1);
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [meetingPassword, setMeetingPassword] = useState("");
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [finalTranscript, setFinalTranscript] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [showFullData, setShowFullData] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [activePlatform, setActivePlatform] = useState(null);
  const [downloadOptions, setDownloadOptions] = useState({
    word: false,
    excel: false,
  });

  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const { addToast } = useToast();

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
    socket.on("caption", ({ text, isFinal }) => {
      if (text) {
        setTranscript((prev) => [
          ...prev,
          isFinal ? text : `${text} (interim)`,
        ]);
      }
    });

    // Start audio capture
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const systemStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
      });

      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      audioContext.createMediaStreamSource(micStream).connect(destination);
      audioContext.createMediaStreamSource(systemStream).connect(destination);

      const stream = destination.stream;
      mediaStreamRef.current = stream;

      const options = {};
      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/mp3",
        "audio/wav",
        "audio/mpeg",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      if (supportedTypes) {
        options.mimeType = supportedTypes;
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.connected) {
          event.data.arrayBuffer().then((buffer) => {
            socket.emit("audio-chunk", buffer); // send as "audio-chunk"
          });
        }
      };

      mediaRecorderRef.current.start(250);

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
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (mediaStreamRef.current)
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    if (wsRef.current) wsRef.current.close();
    const transcriptText = transcript.join(" ");
    setFinalTranscript(transcriptText);
    setMeetingLink("");
    setShowModal(true);
    setIsMeetingActive(false);
  };
  const { email, fullName, token } = useSelector((state) => state.auth);

  const handleSaveHeaders = async (headers) => {
    setIsSending(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/openai/convert-transcript`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: finalTranscript,
            headers: headers,
          }),
        }
      );
      const tableData = await response.json();
      if (!Array.isArray(tableData)) {
        addToast("error", "Could not process meeting notes");
        return;
      }
      setTranscript([]);
      setShowFullData(tableData);
      setIsSending(false);
      setShowModal2(true);
    } catch (error) {
      console.error("Error converting transcript:", error);
      addToast("error", "Failed to convert transcript");
    }
  };

  const HandleSaveTable = async (data) => {
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
    };
    await addHistory(token, historyData, addToast);
    setShowModal2(false);
    setShowModal(false);
  };

  const addHistory = async (token, historyData, addToast) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/history`,
        historyData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Add history error:", err);
      addToast("error", "Failed to add history");
    }
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

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | Meeting</title>
        <link rel="canonical" href="http://mysite.com/example" />
      </Helmet>
      <section className="relative h-full min-h-screen md:w-full w-screen dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]">
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:20px_20px]",
            "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
          )}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)]"></div>
        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll ">
          <div className=" min-h-screen">
            <Heading
              heading="Take Notes from Online Meeting"
              subHeading="Connect Zoom, Google Meet, or Teams link and generate automatic MoM."
            />
            {showModal ? (
              <section className=" p-4 md:p-0 md:px-10 lg:px-0 lg:pl-10 lg:pr-6 lg:max-w-full max-w-screen">
                {showModal2 ? (
                  <RealTablePreview
                    showFullData={showFullData}
                    onSaveTable={(data) => HandleSaveTable(data)}
                  />
                ) : (
                  <TablePreview
                    onSaveHeaders={(headers) => handleSaveHeaders(headers)}
                    isSending={isSending}
                  />
                )}
              </section>
            ) : (
              <>
                {isMeetingActive ? (
                  <section
                    id="listening"
                    className=" px-10 flex flex-col my-10"
                  >
                    <p className=" mb-6 text-green-600 animate-pulse text-center md:text-4xl text-xl font-medium">
                      Meeting is live. Listening...
                    </p>
                    <div className="mt-4 w-full h-40 overflow-y-auto bg-white text-black dark:text-white dark:bg-gray-900 p-3 border rounded-lg border-gray-300 dark:border-black">
                      {transcript.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                    <button
                      onClick={endMeeting}
                      disabled={showModal}
                      className="mt-6 cursor-pointer disabled:cursor-not-allowed w-fit py-3 px-10 mx-auto rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:hover:bg-red-400 transition-colors duration-300"
                    >
                      Meeting End
                    </button>
                  </section>
                ) : (
                  <div className="h-full w-full flex lg:flex-row flex-col pb-10">
                    <section className="h-fit pb-10 lg:w-[65%] w-screen md:px-10 px-4">
                      <Timing />
                      <div className="bg-white/80 mt-6 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 animate-fade-in-up">
                        <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 mb-0">
                          <button
                            onClick={() => setActiveTab(1)}
                            className={`flex-1 cursor-pointer py-3 px-4 rounded-lg font-semibold transition-all ${
                              activeTab === 1
                                ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105"
                                : "text-gray-600 dark:text-gray-300 hover:text-indigo-600"
                            }`}
                          >
                            <Video className="w-5 h-5 inline mr-2" />
                            Meeting Link
                          </button>
                          <button
                            onClick={() => setActiveTab(2)}
                            className={`flex-1 cursor-pointer py-3 px-4 rounded-lg font-semibold transition-all ${
                              activeTab === 2
                                ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105"
                                : "text-gray-600 dark:text-gray-300 hover:text-indigo-600"
                            }`}
                          >
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
                        ${
                          activePlatform === platform.name
                            ? "ring-2 ring-offset-2 ring-blue-500"
                            : ""
                        }`}
                                    style={{
                                      animationDelay: `${500 + index * 100}ms`,
                                    }}
                                  >
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
                            <div className="mt-2">
                              <h1 className="text-gray-600 dark:text-white md:text-xl text-lg mb-3">
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
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          disabled={!meetingLink.trim()}
                          onClick={startMeeting}
                          className={`mt-6 w-full py-4 flex justify-center items-center gap-2 rounded-lg text-white font-semibold transition-colors duration-300 ${
                            meetingLink.trim()
                              ? "bg-blue-400 hover:bg-blue-500 cursor-pointer"
                              : "bg-gray-500 cursor-not-allowed"
                          }`}
                        >
                          <FileText className="w-6 h-6" />
                          Create MoM (Minutes of Meeting)
                        </button>
                        <p className="text-xs text-gray-400 mt-3 text-center">
                          🆓 Meeting transcription is completely free now
                        </p>
                      </div>
                    </section>
                    <section className="lg:w-[35%] w-screen lg:pr-6 px-4 md:px-10 lg:px-0">
                      <DownloadOptions onChange={setDownloadOptions} />
                      <AllHistory NeedFor={"Online Meeting Conversion"} />
                    </section>
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
