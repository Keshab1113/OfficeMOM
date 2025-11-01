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
import { useDispatch, useSelector } from "react-redux";
import AllHistory from "../../components/History/History";
import RealTablePreview from "../../components/TablePreview/RealTablePreview";
import Heading from "../../components/LittleComponent/Heading";
import { Mic, Loader2, FileText, Copy } from "lucide-react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import { Helmet } from "react-helmet";
import JoinRequestModal from "../../components/LittleComponent/JoinRequestModal";
import io from "socket.io-client";
import { createHostMixerStream } from "../../hooks/useHostMixer";
import StylishAudioPreview from "../../components/LittleComponent/StylishAudioPreview";
import MultipleAudioPlayer from "../../components/LittleComponent/MultipleAudioPlayer";
import {
  addAudioPreview,
  removeAudioPreview,
  updateNeedToShow,
} from "../../redux/audioSlice";
import Trancript from "../../components/LittleComponent/Trancript";
import { processTranscriptWithDeepSeek } from "../../lib/apiConfig";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";

const ICE = [{ urls: "stun:stun.l.google.com:19302" }];
const breadcrumbItems = [
    { label: "Live Meeting" }
  ];

const LiveMeeting = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewProcessing, setIsPreviewProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [showFullData, setShowFullData] = useState(null);
  const [historyTitle, setHistortTitle] = useState(null);
  const [finalTranscript, setFinalTranscript] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(false);
  const [barCount, setBarCount] = useState(32);
  const { addToast } = useToast();
  const [meetingId, setMeetingId] = useState(null);
  const [updatedMeetingId, setUpdatedMeetingId] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [detectLanguage, setDetectLanguage] = useState("");
  const [audioID, setAudioID] = useState(null);
  const [requests, setRequests] = useState([]);
  const [uploadedUserId, setUploadedUserId] = useState(null);
  const [historyID, setHistoryID] = useState(null);
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
  const previousBlobRef = useRef(null);

  const dispatch = useDispatch();
  const { previews } = useSelector((state) => state.audio);
  const lastPreview = previews.at(-1);

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
    initializeMeeting();
  }, []);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

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

      audioIntervalsRef.current.forEach((interval) => clearInterval(interval));
      audioIntervalsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (socketRef.current && meetingId) {
      socketRef.current.emit("host:join-room", { roomId: meetingId });
    }
  }, [meetingId]);

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
      });

      sock.on("connect", () => {
        if (meetingId) {
          sock.emit("host:join-room", { roomId: meetingId });
        }
      });

      sock.on("room:count", ({ count }) => {
        setParticipants(count);
      });

      sock.on("host:join-request", ({ socketId, deviceName, deviceLabel }) => {
        setRequests((prev) => [...prev, { socketId, deviceName, deviceLabel }]);
      });

      sock.on("guest:disconnected", ({ socketId }) => {
        console.log(`Guest ${socketId} disconnected`);
        // Update participant count when a guest disconnects
        setParticipants(prev => Math.max(0, prev - 1));
        // Remove from peers map
        if (peersRef.current.has(socketId)) {
          const pc = peersRef.current.get(socketId);
          pc.close();
          peersRef.current.delete(socketId);
        }
        // Stop individual recording for this guest
        if (individualRecordersRef.current.has(socketId)) {
          const recorder = individualRecordersRef.current.get(socketId);
          if (recorder.state === "recording") {
            recorder.stop();
          }
          individualRecordersRef.current.delete(socketId);
        }
        // Clear audio interval for this guest
        if (audioIntervalsRef.current.has(socketId)) {
          clearInterval(audioIntervalsRef.current.get(socketId));
          audioIntervalsRef.current.delete(socketId);
        }
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
  console.log("🎵 Track received from guest:", e.track.kind, e.track.id, "enabled:", e.track.enabled, "muted:", e.track.muted);
  
  if (e.streams && e.streams[0]) {
    e.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);

      track.onmute = () =>
        console.log(`❌ Track ${track.id} was muted!`);
      track.onunmute = () => {
        console.log(`✅ Track ${track.id} was unmuted!`);
        
        // Add to mixer when track becomes active
        const audioTracks = remoteStream.getAudioTracks();
        console.log(`📊 Remote stream has ${audioTracks.length} audio tracks`);
        
        if (audioTracks.length > 0 && audioTracks[0].readyState === 'live') {
          console.log(`🎧 Adding guest ${from} to mixer`);
          addRemoteRef.current(remoteStream, from);
          startIndividualRecording(from, remoteStream.clone());
        }
      };
      track.onended = () => console.log(`⚠️ Track ${track.id} ended`);
    });

    const monitorGuestAudio = () => {
      try {
        const audioTracks = remoteStream.getAudioTracks();
        if (audioTracks.length === 0) {
          console.log("❌ No audio tracks in remote stream");
          return;
        }

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(remoteStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        const average =
          dataArray.reduce((a, b) => a + b) / dataArray.length;

        if (average > 5) {
          console.log(
            `🎤 GUEST ${from} IS SPEAKING! Audio level: ${average.toFixed(2)}`
          );
        }

        audioContext.close();
      } catch (error) {
        console.log("Guest audio level check error:", error);
      }
    };

    const guestAudioInterval = setInterval(monitorGuestAudio, 2000);
    audioIntervalsRef.current.set(from, guestAudioInterval);

    // Try adding immediately if track is already live
    const audioTracks = remoteStream.getAudioTracks();
    if (audioTracks.length > 0 && audioTracks[0].readyState === 'live' && !audioTracks[0].muted) {
      console.log(`🎧 Immediately adding guest ${from} to mixer (track already live)`);
      addRemoteRef.current(remoteStream, from);
      startIndividualRecording(from, remoteStream.clone());
    }
    // 🔊 Force AudioContext to resume when new guest arrives
if (mixerRef.current?.audioContext?.state === "suspended") {
  console.log("Resuming audio context for new guest");
  mixerRef.current.audioContext.resume();
}

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
  console.log(`📥 Received SDP from ${from}, type: ${data.sdp.type}`);
  await pc.setRemoteDescription(data.sdp);

  if (data.sdp.type === 'offer') {
    console.log(`📤 Creating answer for ${from}`);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    sock.emit("signal", {
      to: from,
      data: { sdp: pc.localDescription },
    });
    console.log(`✅ Answer sent to ${from}`);
  }
}else if (data.candidate) {
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
      mr.onstop = async () => {
        const newBlob = new Blob(recordedChunksRef.current, {
          type: "audio/webm",
        });
        let finalBlob = newBlob;
        if (previousBlobRef.current) {
          const oldArrayBuffer = await previousBlobRef.current.arrayBuffer();
          const newArrayBuffer = await newBlob.arrayBuffer();
          const combined = new Uint8Array(
            oldArrayBuffer.byteLength + newArrayBuffer.byteLength
          );
          combined.set(new Uint8Array(oldArrayBuffer), 0);
          combined.set(
            new Uint8Array(newArrayBuffer),
            oldArrayBuffer.byteLength
          );

          finalBlob = new Blob([combined], { type: "audio/webm" });
        }
        recordingBlobRef.current = finalBlob;

        const previews = new Map();
        previews.set("mixed", URL.createObjectURL(finalBlob));
        individualChunksRef.current.forEach((b, id) => {
          previews.set(id, URL.createObjectURL(b));
        });

        const file = new File([finalBlob], `recording_${Date.now()}.mp3`, {
          type: "audio/mpeg",
        });

        const formData = new FormData();
        formData.append("audio", file);
        formData.append("source", "Live Transcript Conversion");

        const response = await axios.post(
  `${import.meta.env.VITE_BACKEND_URL}/api/upload/upload-audio-ftp`,
  formData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  }
);

       if (response.data?.audioUrl) {
  dispatch(
    addAudioPreview({
      audioUrl: response.data.audioUrl,
      id: Date.now(),
      uploadedAt: new Date().toISOString(),
      title: file.name,
      needToShow: true,
    })
  );
  addToast("success", "Audio saved successfully!");
} else {
  addToast("error", "FTP upload failed — no audio URL received.");
}

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
    setRecordingTime(0);
    const someId = lastPreview?.id;
    dispatch(updateNeedToShow({ id: someId, needToShow: false }));
    const { data } = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/live-meeting/createlive`,
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
    setHistortTitle(`recording_${Date.now()}.mp3`);
  };

  const endMeeting = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/live-meeting/${meetingId}/end`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      addToast("success", "Meeting ended successfully.");
    } catch (err) {
      console.error("Error ending meeting:", err);
      addToast("error", "Error ending meeting.");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
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
      const file = new File([recordingBlobRef.current], `recording_${Date.now()}.mp3`, {
        type: "audio/mpeg",
      });

      const formData = new FormData();
      formData.append("audio", file);
      formData.append("source", "Live Transcript Conversion");

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

      if (response.data) {
        const { audioUrl, id, uploadedAt, title, audioId, transcription, language, transcriptAudioId, userId } = response.data;
        setAudioID(audioId);
        setUpdatedMeetingId(transcriptAudioId);
        setUploadedUserId(userId);
        setHistoryID(id);
        setFinalTranscript(transcription || "");
        setDetectLanguage(language);
        setShowModal(true);
        setRecordedBlob(false);
        addToast("success", "Audio processed successfully!");
      } else {
        addToast("error", "Upload failed or audioUrl missing");
      }
    } catch (error) {
      addToast("error", "Failed to process file. Please try again.");
      console.error("Error processing notes:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const { email, fullName, token } = useSelector((state) => state.auth);

  const HandleSaveTable = async (data, downloadOptions) => {
    saveTranscriptFiles(data, addToast, downloadOptions, email, fullName);

    // 🕒 Get user's local time and convert to UTC
    const localDate = new Date();
    const utcDate = localDate.toISOString().slice(0, 19).replace("T", " "); // e.g. 2025-10-21 09:12:34

    const historyData = {
      source: "Live Transcript Conversion",
      date: utcDate, // send UTC time to backend
      data: data,
      language: detectLanguage,
      audio_id: audioID,
    };
    
    setShowModal2(false);
    setShowModal(false);
  };

  const addHistory = async (token, historyData, addToast, updatedMeetingId) => {
    try {
      await axios.patch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/live-meeting/audio-files/${updatedMeetingId}`,
        historyData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(removeAudioPreview(updatedMeetingId));
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
  if (!localMicRef.current) return;

  const newMuteState = !isMuted; // toggle first
  localMicRef.current.getAudioTracks().forEach((track) => {
    track.enabled = !newMuteState; // true means unmuted
    console.log(`🎙️ Host mic ${newMuteState ? "muted" : "unmuted"} (track.enabled=${track.enabled})`);
  });
  setIsMuted(newMuteState);
};


  const approve = (id) => {
    socketRef.current.emit("host:approve", { guestSocketId: id });
    setRequests((r) => r.filter((x) => x.socketId !== id));
    // Update participant count when a guest is approved
    setParticipants(prev => prev + 1);
  };
  const reject = (id) => {
    socketRef.current.emit("host:reject", { guestSocketId: id });
    setRequests((r) => r.filter((x) => x.socketId !== id));
    // Don't update participant count for rejected requests
  };

  const handleSaveHeaders = async (headers) => {
    setIsSending(true);
    try {
      const tableData = await processTranscriptWithDeepSeek(
        finalTranscript,
        headers,
        audioID,
        uploadedUserId,
        updatedMeetingId,
        detectLanguage,
        historyID
      );
      console.log("Table data received:", tableData); // Debug log
      if (!Array.isArray(tableData.final_mom)) {
        addToast("error", "Could not process meeting notes");
        return;
      }
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
  const handleDelete = async (audioId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/live-meeting/audio-files/${audioId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      dispatch(removeAudioPreview(audioId));
    } catch (err) {
      addToast("error", `Error deleting audio: ${err}`);
    }
  };

  const handleRecordAgain = (blobUrl) => {
    if (blobUrl) {
      previousBlobRef.current = recordingBlobRef.current;
      const someId = lastPreview?.id;
      handleDelete(someId);
      setRecordedBlob(false);
      startRecording();
    } else {
      addToast("error", "No valid mixed blob available in audioPreviews");
    }
  };

  const continueNextProcess = async (audioFile) => {
    setIsPreviewProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("source", "Live Transcript Conversion");

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

      if (response.data) {
        const { audioUrl, id, uploadedAt, title, audioId, transcription, language, transcriptAudioId, userId } = response.data;
        setAudioID(audioId);
        setUpdatedMeetingId(transcriptAudioId);
        setUploadedUserId(userId);
        setHistoryID(id);
        setFinalTranscript(transcription || "");
        setDetectLanguage(language);
        setShowModal(true);
        setRecordedBlob(false);
        addToast("success", "Audio processed successfully!");
      } else {
        addToast("error", "Upload failed or audioUrl missing");
      }
    } catch (err) {
      console.error("Error uploading or processing audio:", err);
      addToast("error", "Failed to process audio file");
    } finally {
      setIsPreviewProcessing(false);
    }
  };

  const onRemove = () => {
    setRecordedBlob(false);
    dispatch(updateNeedToShow({ id: lastPreview?.id, needToShow: false }));
  };

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" name="robots" content="noindex, nofollow"/>
        <title>Smart Minutes of the Meeting (OfficeMoM) | LiveMeeting</title>
        <link rel="canonical" href="https://officemom.me/live-meeting" />
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
        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll pb-10">
          <div className=" min-h-screen">
            {!showModal && (
                <Breadcrumb items={breadcrumbItems} />
            )}
            <Heading
              heading="Start New Meeting"
              subHeading="Using your device microphone."
            />
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
                    <div className="flex gap-2 justify-start items-center w-full dark:bg-gray-900/30 bg-white py-4 px-4 rounded-md">
                      <MdRecordVoiceOver className=" text-blue-500 text-2xl" />
                      <h1 className="text-gray-600 dark:text-gray-300 text-lg font-bold">
                        Live Mic Recording
                      </h1>
                    </div>
                    <div className="bg-white dark:bg-gray-900/30 rounded-lg shadow-lg md:p-8 p-4 w-full mt-4">
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
                          {isRecording ? "Stop Meeting" : "Start Meeting"}
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
                  {lastPreview?.needToShow === true ? (
                    <StylishAudioPreview
                      onRecordAgain={handleRecordAgain}
                      onRemove={onRemove}
                    />
                  ) : (
                    recordedBlob && (
                      <div className=" text-xl font-medium text-black dark:text-white flex  justify-center items-center gap-2 my-4 py-4 px-4">
                        <Loader2 className="w-10 h-10 animate-spin" />
                        Meeting Preview Processing...
                      </div>
                    )
                  )}
                  <button
                    onClick={handleStartMakingNotes}
                    disabled={
                      lastPreview?.needToShow === false ||
                      isProcessing ||
                      previews.length === 0
                    }
                    className={`mt-10 w-full py-4 rounded-lg text-gray-600 dark:text-white font-semibold flex justify-center items-center gap-2 ${
                      lastPreview?.needToShow === false ||
                      isProcessing ||
                      previews.length === 0
                        ? "bg-gray-500/20 cursor-not-allowed"
                        : "bg-blue-400/20 hover:bg-blue-500 cursor-pointer"
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
                  {/* <p className="text-xs text-gray-400 mt-3 text-center">
                    🆓 Meeting transcription is completely free now
                  </p> */}

                  <MultipleAudioPlayer
                    onContinue={continueNextProcess}
                    isPreviewProcessing={isPreviewProcessing}
                  />
                </section>
                <section className="lg:w-[35%] w-screen lg:pr-6 px-4 md:px-10 lg:px-0 flex flex-col gap-8">
                  {/* <Trancript/> */}
                  <AllHistory NeedFor="Live Transcript Conversion" />
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

        <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-float"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
        <div className="absolute bottom-32 right-32 w-5 h-5 bg-green-400 rounded-full opacity-40 animate-float animation-delay-1500"></div>
      </section>
    </>
  );
};

export default LiveMeeting;
