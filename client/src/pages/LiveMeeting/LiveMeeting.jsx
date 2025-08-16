import { useEffect, useRef, useState } from "react";
import DownloadOptions from "../../components/DownloadOptions/DownloadOptions";
import Timing from "../../components/Timing/Timing";
import { cn } from "../../lib/utils";
import { useToast } from "../../components/ToastContext";
import { saveTranscriptFiles } from "../../components/TextTable/TextTable";
import { MdRecordVoiceOver } from "react-icons/md";
import { Mic } from "lucide-react";
import Footer from "../../components/Footer/Footer";
import TablePreview from "../../components/TablePreview/TablePreview";
import axios from "axios";
import { useSelector } from "react-redux";
import AllHistory from "../../components/History/History";

const LiveMeeting = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordedBlobRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [barCount, setBarCount] = useState(32);
  const { addToast } = useToast();
  const [downloadOptions, setDownloadOptions] = useState({
    word: false,
    excel: false,
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        setRecordedBlob(audioBlob);
        recordedBlobRef.current = audioBlob;
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const handleStartMakingNotes = async () => {
    if (!recordedBlob) {
      alert("Please record some audio first");
      return;
    }
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", recordedBlob, "meeting.wav");

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/transcribe`,
        { method: "POST", body: formData }
      );
      if (!res.ok) throw new Error("Failed to transcribe audio");
      const data = await res.json();
      setShowModal(true);
      setFinalTranscript(data.text);
    } catch (error) {
      addToast("error", "Failed to process file. Please try again.");
      console.error("Error processing notes:", error);
      setIsProcessing(false);
    } finally {
      setRecordedBlob(null);
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
  const { email, fullName, token } = useSelector((state) => state.auth);

  const handleSaveHeaders = async (headers, rows, fileName) => {
    setShowModal(false);
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
        fileName,
        email,
        fullName,
      );
      const dateCreated = new Date().toISOString().split("T")[0];
      const historyData = {
        source: "Live Transcript Conversion",
        date: dateCreated,
        filename: fileName,
      };
      await addHistory(token, historyData, addToast);
    } catch (error) {
      console.error("Error converting transcript:", error);
      addToast("error", "Failed to convert transcript");
    } finally {
      setIsProcessing(false);
    }
  };

  const scrolltotable = async () => {
    await handleStartMakingNotes();
    const tableSection = document.getElementById("table");
    if (tableSection) {
      addToast("info", "You need to design your table first.");
      tableSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const updateBarCount = () => {
      if (window.innerWidth < 768) {
        setBarCount(12);
      } else {
        setBarCount(32);
      }
    };

    updateBarCount();
    window.addEventListener("resize", updateBarCount);
    return () => window.removeEventListener("resize", updateBarCount);
  }, []);

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
            Record Live Meeting
          </h1>
          <p className="text-sm md:text-xl text-gray-500 dark:text-white text-center mb-10">
            Using your device microphone.
          </p>
          <div className="h-full w-full flex lg:flex-row flex-col py-10">
            <section
              id="main"
              className="h-full pb-10 lg:w-[65%] w-screen md:px-10 px-4"
            >
              <Timing />
              <div className="flex flex-col justify-center items-start w-full mt-10">
                <div className="flex gap-2 justify-start items-center w-full dark:bg-gray-900 bg-white py-4 px-4 rounded-md">
                  <MdRecordVoiceOver className=" text-blue-500 text-2xl" />
                  <h1 className="text-gray-600 dark:text-gray-300 text-lg font-bold">
                    Live Mic Recording
                  </h1>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg md:p-8 p-4 w-full mt-2">
                  <div className="flex items-center justify-between">
                    {/* Left side - Microphone Icon with Pulse Effect */}
                    <div className="relative flex items-center">
                      <div
                        className={`absolute inset-0 rounded-full bg-green-500 opacity-20 ${
                          isRecording ? "animate-ping" : ""
                        }`}
                      ></div>
                      <div className="relative z-10 p-3 rounded-full bg-green-50">
                        <Mic
                          className={`md:w-8 md:h-8 w-6 h-6 ${
                            isRecording ? "text-green-600" : "text-green-500"
                          } transition-colors duration-300`}
                        />
                      </div>
                    </div>
                    <div className="flex-1 mx-8 flex justify-center">
                      <div className="flex items-center gap-1 h-10">
                        {Array.from({ length: barCount }).map((_, index) => (
                          <div
                            key={index}
                            className={`w-1 bg-gradient-to-t from-green-600 to-green-400 rounded-full transition-all duration-300 ${
                              isRecording ? "animate-pulse" : "opacity-30"
                            }`}
                            style={{
                              height: `${Math.random() * 30 + 10}px`,
                              animationDelay: `${index * 0.1}s`,
                              animationDuration: `${1 + Math.random()}s`,
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`relative cursor-pointer px-6 py-3 rounded-full font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 ${
                        isRecording
                          ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-500/50 animate-pulse"
                          : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500/50"
                      }`}
                    >
                      {isRecording ? "Stop recording" : "Start recording"}
                    </button>
                  </div>
                  {isRecording && (
                    <div className="mt-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-600 font-medium">
                          Recording in progress...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={scrolltotable}
                disabled={isProcessing || !recordedBlob}
                className={`mt-10 w-full py-4 rounded-lg text-white font-semibold ${
                  isProcessing || !recordedBlob
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-400 hover:bg-blue-500 cursor-pointer"
                }`}
              >
                {isProcessing
                  ? "Processing..."
                  : "Create MoM (Minutes of Meeting)"}
              </button>
              <p className="text-xs text-gray-400 mt-3 text-center">
                🆓 Meeting transcription is completely free now
              </p>
            </section>
            <section className="lg:w-[35%] w-screen lg:pr-6 px-4 md:px-10 lg:px-0">
              <AllHistory />
              <DownloadOptions onChange={setDownloadOptions} />
            </section>
          </div>
          {showModal && (
            <section
              id="table"
              className=" p-4 md:px-10 lg:px-0 lg:pl-10 lg:pr-6 lg:max-w-full max-w-screen"
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

export default LiveMeeting;
