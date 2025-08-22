import { useEffect, useRef, useState } from "react";
import DownloadOptions from "../../components/DownloadOptions/DownloadOptions";
import Timing from "../../components/Timing/Timing";
import { cn } from "../../lib/utils";
import { useToast } from "../../components/ToastContext";
import { saveTranscriptFiles } from "../../components/TextTable/TextTable";
import { MdRecordVoiceOver } from "react-icons/md";
import Footer from "../../components/Footer/Footer";
import TablePreview from "../../components/TablePreview/TablePreview";
import axios from "axios";
import { useSelector } from "react-redux";
import AllHistory from "../../components/History/History";
import RealTablePreview from "../../components/TablePreview/RealTablePreview";
import Heading from "../../components/LittleComponent/Heading";
import { Mic, Loader2, FileText } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { v4 as uuidv4 } from "uuid";
import { Helmet } from "react-helmet";
import { useParams } from "react-router-dom";

const LiveMeeting = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordedBlobRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [showFullData, setShowFullData] = useState(null);
  const [finalTranscript, setFinalTranscript] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [barCount, setBarCount] = useState(32);
  const { addToast } = useToast();
  const { id: meetingIdFromParams } = useParams();
  const [isHost, setIsHost] = useState(!meetingIdFromParams);
  const [meetingId, setMeetingId] = useState(meetingIdFromParams || uuidv4());
  const [ws, setWs] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [participants, setParticipants] = useState([]);
  const timerRef = useRef(null);
  const [downloadOptions, setDownloadOptions] = useState({
    word: false,
    excel: false,
  });

  useEffect(() => {
    setMeetingId(uuidv4());
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    if (meetingIdFromParams) {
      connectToMeeting(meetingIdFromParams);
    } else {
      setMeetingId(uuidv4());
    }
  }, [meetingIdFromParams]);

  const connectToMeeting = (meetingId) => {
    const websocket = new WebSocket(
      `${import.meta.env.VITE_WS_URL || "ws://localhost:5000"}/transcribe`
    );

    websocket.onopen = () => {
      console.log("Connected to meeting");
      websocket.send(
        JSON.stringify({
          type: "join_meeting",
          meetingId,
        })
      );
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "participants_update") {
        setParticipants(data.participants);
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    websocket.onclose = () => {
      console.log("Disconnected from meeting");
    };

    setWs(websocket);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          if (ws && ws.readyState === WebSocket.OPEN) {
            e.data.arrayBuffer().then((buffer) => {
              ws.send(buffer);
            });
          }

          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setRecordedBlob(audioBlob);
        recordedBlobRef.current = audioBlob;
      };

      mediaRecorder.start(1000);
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

  const getMeetingUrl = () => {
    return `${window.location.origin}/join-meeting/${meetingId}`;
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
      setShowFullData(tableData);
      setShowModal2(true);
      setIsSending(false);
    } catch (error) {
      console.error("Error converting transcript:", error);
      addToast("error", "Failed to convert transcript");
    } finally {
      setIsProcessing(false);
    }
  };

  const HandleSaveTable = async (data) => {
    saveTranscriptFiles(data, addToast, downloadOptions, email, fullName);
    const dateCreated = new Date().toISOString().split("T")[0];
    const historyData = {
      source: "Live Transcript Conversion",
      date: dateCreated,
      data: data,
    };
    await addHistory(token, historyData, addToast);
    setShowModal2(false);
    setShowModal(false);
  };

  useEffect(() => {
    const updateBarCount = () => {
      if (window.innerWidth < 768) {
        setBarCount(12);
      } else if (window.innerWidth < 1425) {
        setBarCount(20);
      } else {
        setBarCount(32);
      }
    };

    updateBarCount();
    window.addEventListener("resize", updateBarCount);
    return () => window.removeEventListener("resize", updateBarCount);
  }, []);

  console.log(
    "meetingLink: ",
    `${window.location.origin}/join-meeting/${meetingId}`
  );

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | LiveMeeting</title>
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
              heading="Start New Meeting"
              subHeading="Using your device microphone."
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
              <div className="h-full w-full flex lg:flex-row flex-col pb-10">
                <section className="h-full pb-10 lg:w-[65%] w-screen md:px-10 px-4">
                  <Timing />
                  <div className="flex flex-col justify-center items-start w-full mt-8">
                    <div className="flex gap-2 justify-start items-center w-full dark:bg-gray-900 bg-white py-4 px-4 rounded-md">
                      <MdRecordVoiceOver className=" text-blue-500 text-2xl" />
                      <h1 className="text-gray-600 dark:text-gray-300 text-lg font-bold">
                        Live Mic Recording
                      </h1>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg md:p-8 p-4 w-full mt-4">
                      <div className="flex items-center justify-between">
                        <div className="relative flex items-center">
                          <div
                            className={`absolute inset-0 rounded-full bg-green-500 opacity-20 ${
                              isRecording ? "animate-ping" : ""
                            }`}
                          ></div>
                          <div className="relative z-10 p-3 rounded-full bg-green-50">
                            <Mic
                              className={`md:w-8 md:h-8 w-6 h-6 ${
                                isRecording
                                  ? "text-green-600"
                                  : "text-green-500"
                              } transition-colors duration-300`}
                            />
                          </div>
                        </div>
                        <div className="flex-1 mx-8 flex justify-center">
                          <div className="flex items-center gap-1 h-10">
                            {Array.from({ length: barCount }).map(
                              (_, index) => (
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
                              )
                            )}
                          </div>
                        </div>
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isProcessing}
                          className={`relative text-sm cursor-pointer disabled:cursor-not-allowed px-6 py-3 rounded-full font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 ${
                            isRecording
                              ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-500/50 animate-pulse"
                              : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500/50"
                          }`}
                        >
                          {isRecording ? "Stop recording" : "Start recording"}
                        </button>
                      </div>

                      {isRecording && (
                        <div className="mt-6">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center justify-center space-x-2 mb-4">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                              <div className="text-gray-600 dark:text-gray-300 font-medium">
                                {formatTime(recordingTime)}
                              </div>
                              <span className="text-gray-600 font-medium">
                                Recording in progress...
                              </span>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-md">
                              <h3 className="text-lg font-semibold mb-2 text-center">
                                Invite others to join this meeting
                              </h3>
                              <div className="flex flex-col items-center">
                                <QRCodeCanvas
                                  value={getMeetingUrl()}
                                  size={128}
                                  level="H"
                                />
                                <p className="mt-2 text-sm text-gray-500">
                                  Scan to join this meeting
                                </p>
                                <div className="mt-2 text-xs text-gray-400">
                                  {participants.length} participant(s) connected
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleStartMakingNotes}
                    disabled={isProcessing || !recordedBlob}
                    className={`mt-10 w-full py-4 rounded-lg text-white font-semibold flex justify-center items-center gap-2 ${
                      isProcessing || !recordedBlob
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-blue-400 hover:bg-blue-500 cursor-pointer"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FileText className="w-6 h-6" />
                        Create MoM (Minutes of Meeting)
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    🆓 Meeting transcription is completely free now
                  </p>
                </section>
                <section className="lg:w-[35%] w-screen lg:pr-6 px-4 md:px-10 lg:px-0">
                  <DownloadOptions onChange={setDownloadOptions} />
                  <AllHistory />
                </section>
              </div>
            )}
          </div>
          <Footer />
        </div>
      </section>
    </>
  );
};

export default LiveMeeting;
