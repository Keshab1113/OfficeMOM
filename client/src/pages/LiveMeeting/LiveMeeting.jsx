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
import { Mic, Loader2, FileText, Copy } from "lucide-react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import { Helmet } from "react-helmet";
import JoinRequestModal from "../../components/LittleComponent/JoinRequestModal";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { createHostMixerStream } from "../../hooks/useHostMixer";

const ICE = [{ urls: "stun:stun.l.google.com:19302" }];

const LiveMeeting = () => {
  const nav = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [showFullData, setShowFullData] = useState(null);
  const [finalTranscript, setFinalTranscript] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(false);
  const [barCount, setBarCount] = useState(32);
  const { addToast } = useToast();
  const [meetingId, setMeetingId] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [downloadOptions, setDownloadOptions] = useState({
    word: false,
    excel: false,
  });
  const [audioPreviews, setAudioPreviews] = useState(new Map());
  const [requests, setRequests] = useState([]);
  const timerRef = useRef(null);
  const localMicRef = useRef(null);
  const socketRef = useRef(null);
  const peersRef = useRef(new Map());
  const hasInitializedRef = useRef(false);
  const recordedChunksRef = useRef([]);
  const individualRecordersRef = useRef(new Map());
  const individualChunksRef = useRef(new Map());
  const audioIntervalsRef = useRef(new Map());
  const addRemoteRef = useRef(null);
  const mixerRef = useRef(null);
  const recordingBlobRef = useRef(null);

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
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initializeMeeting = async () => {
      try {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        localMicRef.current = mic;

        const monitorHostAudio = () => {
          if (mic) {
            try {
              const audioContext = new AudioContext();
              const analyser = audioContext.createAnalyser();
              const source = audioContext.createMediaStreamSource(mic);
              source.connect(analyser);

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              analyser.getByteFrequencyData(dataArray);

              const average =
                dataArray.reduce((a, b) => a + b) / dataArray.length;

              if (average > 5) {
                console.log("🎤 HOST IS SPEAKING! Audio detected.");
              }

              audioContext.close();
            } catch (error) {
              console.log("Host audio level check error:", error);
            }
          }
        };

        const hostAudioInterval = setInterval(monitorHostAudio, 2000);
        audioIntervalsRef.current.set("host", hostAudioInterval);

        const mixer = await createHostMixerStream(mic);
        mixerRef.current = mixer;
        addRemoteRef.current = mixer.addRemote;

        const sock = io(`${import.meta.env.VITE_BACKEND_URL}`, {
          transports: ["websocket"],
        });
        socketRef.current = sock;

        sock.on("host:replaced", () => {
          addToast(
            "error",
            "Another host has joined this room. You've been disconnected."
          );
          nav("/dashboard");
        });

        sock.on("connect", () => {
          sock.emit("host:join-room", { meetingId });
        });

        sock.on("room:count", ({ count }) => {
          setParticipants(count);
        });

        sock.on("host:join-request", ({ socketId, name, deviceLabel }) => {
          setRequests((prev) => [...prev, { socketId, name, deviceLabel }]);
        });

        sock.on("signal", async ({ from, data }) => {
          let pc = peersRef.current.get(from);
          if (!pc) {
            pc = new RTCPeerConnection({
              iceServers: ICE,
              sdpSemantics: "unified-plan",
            });

            const remoteStream = new MediaStream();

            pc.ontrack = (e) => {
              if (e.streams && e.streams[0]) {
                e.streams[0].getTracks().forEach((track) => {
                  remoteStream.addTrack(track);

                  track.onmute = () =>
                    console.log(`Track ${track.id} was muted!`);
                  track.onunmute = () =>
                    console.log(`Track ${track.id} was unmuted!`);
                  track.onended = () => console.log(`Track ${track.id} ended`);
                });

                const monitorGuestAudio = () => {
                  try {
                    const audioContext = new AudioContext();
                    const analyser = audioContext.createAnalyser();
                    const source =
                      audioContext.createMediaStreamSource(remoteStream);
                    source.connect(analyser);

                    const dataArray = new Uint8Array(
                      analyser.frequencyBinCount
                    );
                    analyser.getByteFrequencyData(dataArray);

                    const average =
                      dataArray.reduce((a, b) => a + b) / dataArray.length;

                    if (average > 5) {
                      console.log(
                        `🎤 GUEST ${from} IS SPEAKING! Audio received.`
                      );
                    }

                    audioContext.close();
                  } catch (error) {
                    console.log("Guest audio level check error:", error);
                  }
                };

                const guestAudioInterval = setInterval(monitorGuestAudio, 2000);
                audioIntervalsRef.current.set(from, guestAudioInterval);

                addRemoteRef.current(remoteStream, from);
                startIndividualRecording(from, remoteStream.clone());
              }
            };

            peersRef.current.set(from, pc);

            pc.onicecandidate = (ev) => {
              if (ev.candidate) {
                sock.emit("signal", {
                  to: from,
                  data: { candidate: ev.candidate },
                });
              }
            };

            pc.onconnectionstatechange = () => {
              console.log(`Connection state for ${from}:`, pc.connectionState);
            };

            pc.oniceconnectionstatechange = () => {
              console.log(
                `ICE connection state for ${from}:`,
                pc.iceConnectionState
              );
            };
          }

          if (data.sdp) {
            await pc.setRemoteDescription(data.sdp);

            const answer = await pc.createAnswer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: false,
            });

            await pc.setLocalDescription(answer);

            sock.emit("signal", {
              to: from,
              data: { sdp: pc.localDescription },
            });
          } else if (data.candidate) {
            try {
              await pc.addIceCandidate(data.candidate);
            } catch (error) {
              console.error("Error adding ICE candidate:", error);
            }
          }
        });

        const mr = new MediaRecorder(mixer.mixedStream, {
          mimeType: "audio/webm",
        });
        mr.ondataavailable = (e) => {
          if (e.data.size) recordedChunksRef.current.push(e.data);
        };
        mr.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, {
            type: "audio/webm",
          });
          recordingBlobRef.current = blob;

          const previews = new Map();
          previews.set("mixed", URL.createObjectURL(blob));
          individualChunksRef.current.forEach((b, id) => {
            previews.set(id, URL.createObjectURL(b));
          });
          setAudioPreviews(previews);
        };
        mediaRecorderRef.current = mr;
      } catch (err) {
        console.log(err);
        addToast(
          "error",
          "Error starting meeting. Please check your mic permissions."
        );
      }
    };

    initializeMeeting();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (mediaRecorderRef.current?.state === "recording")
        mediaRecorderRef.current.stop();
      individualRecordersRef.current.forEach(
        (r) => r.state === "recording" && r.stop()
      );
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();

      audioIntervalsRef.current.forEach((interval, socketId) => {
        clearInterval(interval);
      });
      audioIntervalsRef.current.clear();
    };
  }, [meetingId, nav]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startIndividualRecording = (socketId, stream) => {
    if (individualRecordersRef.current.has(socketId)) {
      const existingRecorder = individualRecordersRef.current.get(socketId);
      if (existingRecorder.state === "recording") {
        existingRecorder.stop();
      }
      individualRecordersRef.current.delete(socketId);
    }

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
        audioBitsPerSecond: 128000,
      });

      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        individualChunksRef.current.set(socketId, blob);
      };

      recorder.onerror = (e) => {
        console.error(`Recording error for ${socketId}:`, e);
      };

      recorder.onstart = () => {
        console.log(`Recording started for ${socketId}`);
      };

      recorder.start(1000);
      individualRecordersRef.current.set(socketId, recorder);
    } catch (error) {
      console.error(`Error starting recorder for ${socketId}:`, error);
    }
  };

  const startRecording = async () => {
    const { data } = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/createlive`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    await setMeetingId(data.roomId);
    setIsRecording(true);
    if (!mediaRecorderRef.current) return;
    recordedChunksRef.current = [];
    individualRecordersRef.current.clear();
    individualChunksRef.current.clear();
    mediaRecorderRef.current.start(1000);
    if (localMicRef.current) {
      startIndividualRecording("host", localMicRef.current);
    }

    peersRef.current.forEach((pc, socketId) => {
      const remoteStream = new MediaStream();
      pc.getReceivers().forEach((receiver) => {
        if (receiver.track) {
          remoteStream.addTrack(receiver.track);
        }
      });

      if (remoteStream.getAudioTracks().length > 0) {
        startIndividualRecording(socketId, remoteStream);
      }
    });
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessing(false);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();

      individualRecordersRef.current.forEach((recorder, socketId) => {
        if (recorder.state === "recording") {
          recorder.stop();
          console.log(`Stopped recorder for ${socketId}`);
        }
      });
    }
    setRecordedBlob(true);
    endMeeting();
  };
  const endMeeting = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/${meetingId}/end`,
        {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      addToast("success","Meeting ended successfully.");
    } catch (err) {
      console.error("Error ending meeting:", err);
      addToast("error","Error ending meeting.");
    }
  };

  const getMeetingUrl = () => {
    return `${window.location.origin}/join-meeting/${meetingId}`;
  };

  const handleStartMakingNotes = async () => {
    if (!recordingBlobRef.current) {
      addToast("error", "Please record some audio first");
      return;
    }
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("mixed", recordingBlobRef.current, "mixed.webm");
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/${meetingId}/recording`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setShowModal(true);
      setFinalTranscript(res.data.text || "");
    } catch (error) {
      addToast("error", "Failed to process file. Please try again.");
      console.error("Error processing notes:", error);
      setIsProcessing(false);
    }
  };

  const { email, fullName, token } = useSelector((state) => state.auth);

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

  const copyMeetingLink = () => {
    navigator.clipboard
      .writeText(getMeetingUrl())
      .then(() => {
        addToast("success", "Meeting link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        addToast("error", "Failed to copy meeting link");
      });
  };

  const toggleMute = () => {
    if (localMicRef.current) {
      const audioTracks = localMicRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const approve = (id) => {
    socketRef.current.emit("host:approve", { guestSocketId: id });
    setRequests((r) => r.filter((x) => x.socketId !== id));
  };
  const reject = (id) => {
    socketRef.current.emit("host:reject", { guestSocketId: id });
    setRequests((r) => r.filter((x) => x.socketId !== id));
  };
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
                          className={`relative capitalize text-sm cursor-pointer disabled:cursor-not-allowed px-6 py-3 rounded-full font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 ${
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
                                <button
                                  onClick={copyMeetingLink}
                                  className="mt-2 text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy meeting link
                                </button>
                                <div className="mt-2 text-xs text-gray-400">
                                  {participants} participant(s) connected
                                </div>
                              </div>
                            </div>
                            <button
                              className={`px-4 py-2 mt-4 cursor-pointer rounded flex items-center gap-2 ${
                                isMuted
                                  ? "bg-gray-600"
                                  : "bg-blue-600 hover:bg-blue-700"
                              } text-white`}
                              onClick={toggleMute}
                            >
                              {isMuted ? (
                                <FaMicrophoneSlash />
                              ) : (
                                <FaMicrophone />
                              )}
                              {isMuted ? "Unmute" : "Mute"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleStartMakingNotes}
                    disabled={isProcessing || isRecording}
                    className={`mt-10 w-full py-4 rounded-lg text-white font-semibold flex justify-center items-center gap-2 ${
                      isProcessing || isRecording
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
                  {recordedBlob && audioPreviews && (
                      <div className="my-6">
                        <h4 className="font-medium text-gray-600 mb-1">
                          Meeting Preview
                        </h4>
                        <audio
                          controls
                          src={audioPreviews.get("mixed")}
                          className="w-full"
                        />
                      </div>
                  )}
                </section>
                <section className="lg:w-[35%] w-screen lg:pr-6 px-4 md:px-10 lg:px-0">
                  <DownloadOptions onChange={setDownloadOptions} />
                  <AllHistory />
                </section>
              </div>
            )}
          </div>
          <JoinRequestModal
            reqs={requests}
            onApprove={approve}
            onReject={reject}
          />
          <Footer />
        </div>
      </section>
    </>
  );
};

export default LiveMeeting;
