import { useState, useEffect, useRef } from "react";
import Timing from "../../components/Timing/Timing";
import { cn } from "../../lib/utils";
import { FcConferenceCall } from "react-icons/fc";
import { useToast } from "../../components/ToastContext";
import { saveTranscriptFiles } from "../../components/TextTable/TextTable";
import DownloadOptions from "../../components/DownloadOptions/DownloadOptions";
import TablePreview from "../../components/TablePreview/TablePreview";
import Footer from "../../components/Footer/Footer";
import axios from "axios";
import { useSelector } from "react-redux";
import AllHistory from "../../components/History/History";
import {
  Video,
  Users,
} from "lucide-react";

const meetingPlatforms = [
  { name: "Google Meet", icon: "/Icons/meet.svg", color: "bg-green-500" },
  { name: "Zoom", icon: "/Icons/zoom.svg", color: "bg-blue-500" },
  { name: "Microsoft Teams", icon: "/Icons/teams.png", color: "bg-purple-500" },
];

const Meeting = () => {
  const [activeTab, setActiveTab] = useState(1);
  const [meetingLink, setMeetingLink] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const [meetingPassword, setMeetingPassword] = useState("");
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [finalTranscript, setFinalTranscript] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState({
    word: false,
    excel: false,
  });

  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const { addToast } = useToast();

  const placeholders = [
    "Enter Google Meet link",
    "Enter Zoom meeting link",
    "Enter Teams meeting link",
  ];

  useEffect(() => {
    const currentText = placeholders[placeholderIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setPlaceholderText(currentText.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          setIsDeleting(true);
          setTimeout(() => {}, 1000);
        }
      } else {
        if (charIndex > 0) {
          setPlaceholderText(currentText.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setPlaceholderIndex((placeholderIndex + 1) % placeholders.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, placeholderIndex]);

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
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = async () => {
      try {
        let stream;
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
          audioContext
            .createMediaStreamSource(systemStream)
            .connect(destination);

          stream = destination.stream;

          addToast("info", "Using microphone for meeting audio");
        } catch (micError) {
          addToast(
            "error",
            "Microphone access denied. Please allow microphone permissions"
          );
          throw micError;
        }

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

        try {
          mediaRecorderRef.current = new MediaRecorder(stream, options);

          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              event.data.arrayBuffer().then((buffer) => ws.send(buffer));
            }
          };

          mediaRecorderRef.current.start(250);

          const tableSection = document.getElementById("listening");
          if (tableSection) {
            tableSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        } catch (recorderError) {
          addToast("error", "Failed to initialize recorder");
          stream.getTracks().forEach((track) => track.stop());
          throw recorderError;
        }
      } catch (error) {
        console.error("Meeting start failed:", error);
        ws.close();
      }
    };

    ws.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data);
        const transcriptText = data.channel?.alternatives?.[0]?.transcript;
        if (transcriptText) {
          setTranscript((prev) => [...prev, transcriptText]);
        }
      } catch (error) {
        console.error("Error parsing transcript:", error);
      }
    };

    ws.onerror = (error) => {
      addToast("error", "Connection error occurred");
      console.error("WebSocket error:", error);
    };

    wsRef.current = ws;
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
    const tableSection = document.getElementById("tableView");
    if (tableSection) {
      tableSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
  const token = useSelector((state) => state.auth.token);

  const handleSaveHeaders = async (headers, rows, fileName) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/openai/convert-transcript`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: finalTranscript,
            headers: headers,
            rows: rows,
          }),
        }
      );
      const tableData = await response.json();
      if (!Array.isArray(tableData)) {
        addToast("error", "Could not process meeting notes");
        return;
      }
      saveTranscriptFiles(
        tableData,
        headers,
        addToast,
        downloadOptions,
        fileName
      );
      const dateCreated = new Date().toISOString().split("T")[0];
      const historyData = {
        source: "Online Meeting Conversion",
        date: dateCreated,
        filename: fileName,
      };
      await addHistory(token, historyData, addToast);
      const tableSection = document.getElementById("mainDiv");
      if (tableSection) {
        tableSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setTranscript([]);
      setShowModal(false);
      setIsMeetingActive(false);
    } catch (error) {
      console.error("Error converting transcript:", error);
      addToast("error", "Failed to convert transcript");
    }
  };

  return (
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
          <h1 className="text-3xl md:text-5xl font-bold text-gray-800 dark:text-white mb-2 mt-28 md:mt-20 text-center">
            Take Notes from Online Meeting
          </h1>
          <p className="text-sm md:text-xl text-gray-500 dark:text-white text-center mb-10">
            Connect Zoom, Google Meet, or Teams link and generate automatic MoM.
          </p>
          <div className="h-full w-full flex lg:flex-row flex-col py-10">
            <section
              id="mainDiv"
              className="h-full pb-10 lg:w-[65%] w-screen md:px-10 px-4"
            >
              <Timing />
              <div className="bg-white/80 mt-6 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 animate-fade-in-up">
                <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 mb-6">
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
                    <div className="mt-6">
                      <h1 className="text-gray-600 dark:text-white md:text-xl text-lg mb-2">
                        Paste meeting URL
                      </h1>
                      <div className="flex gap-4 mb-4">
                        {meetingPlatforms.map((platform, index) => (
                          <div
                            key={platform.name}
                            className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:scale-105 transition-transform cursor-pointer animate-fade-in-up"
                            style={{ animationDelay: `${500 + index * 100}ms` }}
                          >
                            <div className="text-2xl">
                              <img src={platform.icon} alt="" className=" h-10 w-10"/>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {platform.name.split(" ")[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center border border-gray-500 rounded-lg p-2 w-full">
                        <FcConferenceCall className="text-blue-500 text-xl mr-2" />
                        <input
                          type="text"
                          placeholder={placeholderText || " "}
                          className="flex-1 outline-none bg-transparent text-gray-700 dark:text-white py-1"
                          value={meetingLink}
                          onChange={(e) => setMeetingLink(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 2 && (
                    <div className="mt-6">
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
                          onChange={(e) => setMeetingPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <button
                  disabled={!meetingLink.trim()}
                  onClick={startMeeting}
                  className={`mt-10 w-full py-4 rounded-lg text-white font-semibold transition-colors duration-300 ${
                    meetingLink.trim()
                      ? "bg-blue-400 hover:bg-blue-500 cursor-pointer"
                      : "bg-blue-400 cursor-not-allowed"
                  }`}
                >
                  Create MoM (Minutes of Meeting)
                </button>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Meeting cost is totally free now.
                </p>
              </div>
            </section>

            <section className="lg:w-[35%] w-screen lg:pr-6 px-4 md:px-10 lg:px-0">
              <AllHistory />
              <DownloadOptions onChange={setDownloadOptions} />
            </section>
          </div>
          {isMeetingActive && (
            <section id="listening" className=" px-10 flex flex-col my-10">
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
          )}
          {showModal && (
            <section
              id="tableView"
              className=" p-4 flex justify-center items-center"
            >
              <TablePreview
                onSaveHeaders={(headers, rows, fileName) =>
                  handleSaveHeaders(headers, rows, fileName)
                }
              />
            </section>
          )}
        </div>
        <Footer />
      </div>
    </section>
  );
};

export default Meeting;
