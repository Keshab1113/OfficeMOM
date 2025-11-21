import { useEffect, useRef, useState } from "react";
import DownloadOptions from "../../components/DownloadOptions/DownloadOptions";
import Timing from "../../components/Timing/Timing";
import { useToast } from "../../components/ToastContext";
import { MdRecordVoiceOver } from "react-icons/md";
import Footer from "../../components/Footer/Footer";
import TablePreview from "../../components/TablePreview/TablePreview";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import AllHistory from "../../components/History/History";
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
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";
import RechargeModal from './../../components/RechargeModal/RechargeModal';
import MeetingFeatures from "../../components/MeetingInstructions/MeetingFeatures";
import MeetingInstruction from "../../components/MeetingInstructions/MeetingInstruction";
import { useNavigate } from "react-router-dom";
import { useMeetingRecovery } from '../../hooks/useMeetingRecovery';
import ResumeMeetingModal from '../../components/LittleComponent/ResumeMeetingModal';
import UnifiedHistory from "../../components/History/UnifiedHistory";
const ICE = [{ urls: "stun:stun.l.google.com:19302" }];
const breadcrumbItems = [
  { label: "Live Meeting" }
];

const LiveMeeting = () => {
  const planTypeRef = useRef("paid");

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewProcessing, setIsPreviewProcessing] = useState(false);
  const [isAudioPreviewProcessing, setIsAudioPreviewProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [recordedBlob, setRecordedBlob] = useState(false);
  const [barCount, setBarCount] = useState(32);
  const { addToast } = useToast();
  const [meetingId, setMeetingId] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [requests, setRequests] = useState([]);
  const timerRef = useRef(null);
  const accumulatedTimeRef = useRef(0);
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
  const mergedPreviewBlobRef = useRef(null); // ✅ keep track of merged preview audio
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeInfo, setRechargeInfo] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { previews } = useSelector((state) => state.audio);
  const lastPreview = previews.at(-1);
  const { token } = useSelector((state) => state.auth);
  const meetingIdRef = useRef(null);

  const userId = useSelector((state) => state.auth.id);


  const { pendingMeeting, isChecking, clearPendingMeeting } = useMeetingRecovery(token);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [shouldAutoResume, setShouldAutoResume] = useState(false);

  // ✅ Show resume modal if pending meeting exists
  useEffect(() => {
    if (pendingMeeting && !isChecking && !meetingId) {
      console.log('📋 Pending meeting found:', pendingMeeting);
      setShowResumeModal(true);
    }
  }, [pendingMeeting, isChecking, meetingId]);

  const handleResumeMeeting = async () => {
    console.log('🔄 Resuming meeting:', pendingMeeting.room_id);

    setShowResumeModal(false);
    setMeetingId(pendingMeeting.room_id);
    meetingIdRef.current = pendingMeeting.room_id;

    // Restore previous state
    accumulatedTimeRef.current = pendingMeeting.duration_seconds || 0;
    setRecordingTime(pendingMeeting.duration_seconds || 0);

    // Tell socket to rejoin this room
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("host:join-room", {
        roomId: pendingMeeting.room_id,
        userId: userId
      });
    }

    clearPendingMeeting();
    setShouldAutoResume(true);

    addToast('success', 'Meeting resumed successfully!');
  };

  const handleStartNewMeeting = async () => {
    console.log('🆕 Starting new meeting (discarding previous)');

    setShowResumeModal(false);

    // Mark old meeting as expired
    if (pendingMeeting) {
      try {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/live-meeting/${pendingMeeting.room_id}/expire`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error('Error expiring old meeting:', error);
      }
    }

    clearPendingMeeting();
    addToast('info', 'Starting fresh meeting...');
  };

  // 🆕 Fetch subscription type (free or paid)
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/subscription`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        planTypeRef.current = res.data?.data?.plan_name?.toLowerCase().includes("free")
          ? "free"
          : "paid";
        console.log("User Plan Type:", planTypeRef.current);
      } catch (err) {
        console.error("Subscription check failed:", err);
      }
    };
    if (token) fetchSubscription();
  }, [token]);


  // 🔥 NEW: Listen for backup events
  useEffect(() => {
    if (!socketRef.current) return;

    const handleBackupSaved = ({ backupUrl, roomId }) => {
      console.log('✅ Backup saved:', backupUrl);
      localStorage.setItem(`backup_${roomId}`, backupUrl);
      // addToast('success', 'Backup saved successfully!');
    };

    const handleMeetingStatus = (status) => {
      console.log('📊 Meeting status:', status);

      if (status.isRecording) {
        setIsRecording(true);
        setRecordingTime(Math.floor(status.duration / 1000));
        addToast('info', 'Recording resumed after reconnection');
      }
    };

    socketRef.current.on('backup-recording-saved', handleBackupSaved);
    socketRef.current.on('meeting:status', handleMeetingStatus);

    return () => {
      socketRef.current?.off('backup-recording-saved', handleBackupSaved);
      socketRef.current?.off('meeting:status', handleMeetingStatus);
    };
  }, [socketRef.current, addToast]);

  // 🕒 Recording timer with auto-end for free users (30 min)
  // 🕒 Recording timer with auto-end for free users (30 min)
  useEffect(() => {
    if (!isRecording) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Save the timestamp when recording started
    const startTimestamp = Date.now() - accumulatedTimeRef.current * 1000;

    timerRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTimestamp) / 1000);
      const totalSeconds = elapsedSeconds;

      setRecordingTime(totalSeconds);
      accumulatedTimeRef.current = totalSeconds; // ✅ Keep synced

      // ⏱ Auto-end for free plan after 1 min (change 60 → 1800 for 30 min)
      // ⏱ Auto-end for free plan after 1 min (change 60 → 1800 for 30 min)
      if (planTypeRef.current === "free" && totalSeconds >= 1800) {
        console.log(`⏹️ Auto-ending after ${totalSeconds}s (free plan)`);

        clearInterval(timerRef.current);
        timerRef.current = null;

        addToast("info", "Free plan limit reached — meeting auto-ended after 30 minutes.");
        stopRecording();
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);




  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    initializeMeeting();

    // Check for existing recording state on load
    checkForExistingRecording();
  }, []);

  const checkForExistingRecording = async () => {
    if (!meetingId) return;

    try {
      // Wait for socket connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!socketRef.current) return;

      socketRef.current.emit("check-recording-state", { roomId: meetingId }, (state) => {
        if (state && state.isRecording) {
          console.log("🔄 Recovering recording state:", state);
          setIsRecording(true);
          setRecordingTime(state.duration || 0);
          accumulatedTimeRef.current = state.duration || 0;
          addToast("info", "Recording resumed after page refresh");

          // Resume streaming
          if (mixerRef.current?.mixedStream) {
            startBackupStream(meetingId);
          }
        }
      });
    } catch (error) {
      console.error("Error checking recording state:", error);
    }
  };

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
      socketRef.current.emit("host:join-room", { roomId: meetingIdRef.current, userId: userId });

    }
  }, [meetingId, userId]);

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
          sock.emit("host:join-room", { roomId: meetingId, userId: userId });
        }
      });

      sock.on("room:count", ({ count }) => {
        // Only update count when it's the actual connected participants, not pending requests
        // The count should only include approved guests, not pending requests
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
        // Main recorder stopped - backup system handles upload
        console.log('✅ Main recorder stopped');
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
    try {
      const someId = lastPreview?.id;
      dispatch(updateNeedToShow({ id: someId, needToShow: false }));

      if (mediaRecorderRef.current?.backupRecorder?.state === "recording") {
        mediaRecorderRef.current.backupRecorder.stop();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      let roomIdToUse = meetingId;

      // ✅ ONLY create new meeting if no meetingId exists
      if (!roomIdToUse) {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/live-meeting/createlive`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        roomIdToUse = response.data.roomId;
        await setMeetingId(roomIdToUse);
        meetingIdRef.current = roomIdToUse;
      }

      setIsRecording(true);

      // Join room (existing code stays same)
      if (socketRef.current) {
        socketRef.current.emit("host:join-room", {
          roomId: roomIdToUse,
          userId: userId
        });

        await new Promise(resolve => setTimeout(resolve, 200));

        socketRef.current.emit("start-backup-recording", {
          roomId: roomIdToUse,
        });
      }

      // Rest of existing code...
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
          if (receiver.track) remoteStream.addTrack(receiver.track);
        });

        if (remoteStream.getAudioTracks().length > 0) {
          startIndividualRecording(socketId, remoteStream);
        }
      });

      startBackupStream(roomIdToUse);

    } catch (err) {
      console.error("❌ Error in startRecording:", err);
      addToast("error", "Failed to start recording.");
    }
  };


  // Add this to your LiveMeeting.jsx component

  // ✅ Check for existing recording state on component mount
  useEffect(() => {
    const checkForExistingRecording = async () => {
      if (!meetingId || !socketRef.current) return;

      try {
        // Wait for socket to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!socketRef.current?.connected) {
          console.log('⚠️ Socket not connected yet');
          return;
        }

        console.log('🔍 Checking for existing recording state...');

        socketRef.current.emit("check-recording-state", { roomId: meetingId }, (state) => {
          if (state) {
            console.log("🔄 Recovering recording state:", state);

            if (state.isRecording) {
              setIsRecording(true);
              setRecordingTime(state.duration || 0);
              accumulatedTimeRef.current = state.duration || 0;
              addToast("info", "Recording resumed after page refresh");

              // Resume streaming if mixer is ready
              if (mixerRef.current?.mixedStream) {
                console.log('📡 Resuming audio stream to backend...');
                startBackupStream(meetingId);
              }
            }
          } else {
            console.log('ℹ️ No active recording state found');
          }
        });
      } catch (error) {
        console.error("❌ Error checking recording state:", error);
      }
    };

    // Only check once after socket is initialized
    if (socketRef.current && meetingId) {
      checkForExistingRecording();
    }
  }, [socketRef.current?.connected, meetingId]); // Run when socket connects or meetingId changes


  // ✅ Handle host disconnection (optional - show warning)
  useEffect(() => {
    if (!socketRef.current) return;

    const handleHostDisconnected = () => {
      console.log('⚠️ Host connection lost - attempting to reconnect...');
      addToast('warning', 'Connection lost. Reconnecting...');
    };

    socketRef.current.on('host:disconnected', handleHostDisconnected);

    return () => {
      socketRef.current?.off('host:disconnected', handleHostDisconnected);
    };
  }, [socketRef.current]);


  // ✅ Modified startBackupStream to handle reconnection
  const startBackupStream = (roomId) => {
    if (!mixerRef.current?.mixedStream) {
      console.warn('⚠️ No mixed stream available for backup');
      return;
    }

    // Stop any existing backup recorder first
    if (mediaRecorderRef.current?.backupRecorder) {
      const oldRecorder = mediaRecorderRef.current.backupRecorder;
      if (oldRecorder.state === "recording") {
        oldRecorder.stop();
        console.log('🛑 Stopped old backup recorder');
      }
      mediaRecorderRef.current.backupRecorder = null;
    }

    try {
      const backupRecorder = new MediaRecorder(mixerRef.current.mixedStream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      backupRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && socketRef.current?.connected) {
          socketRef.current.emit('audio-chunk-backup', e.data);
        }
      };

      backupRecorder.onerror = (err) => {
        console.error('❌ Backup recorder error:', err);
      };

      backupRecorder.start(2000); // Send chunks every 2 seconds
      mediaRecorderRef.current.backupRecorder = backupRecorder;

      console.log(`✅ Backup stream ${mediaRecorderRef.current.backupRecorder ? 'resumed' : 'started'} for room ${roomId}`);
    } catch (error) {
      console.error('❌ Error starting backup stream:', error);
    }
  };

  const stopRecording = async () => {
    clearPendingMeeting();
    try {
      setIsRecording(false);
      setIsProcessing(true);

      console.log(`⏱ Saving accumulated time: ${accumulatedTimeRef.current}s`);

      // Show initial toast
      addToast("info", "Stopping recording and processing audio...", 5000);

      // Stop backup recorder
      if (mediaRecorderRef.current?.backupRecorder?.state === "recording") {
        mediaRecorderRef.current.backupRecorder.stop();
        console.log('🛑 Backup recorder stopped');
      }

      // Stop main recorder
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }

      // Stop individual recorders
      individualRecordersRef.current.forEach((recorder, socketId) => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      });

      // Wait for recorders to flush
      console.log('⏳ Waiting for recorders to flush...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Tell backend to finalize and save to FTP
      if (socketRef.current && meetingId) {
        socketRef.current.emit("stop-backup-recording", {
          roomId: meetingId,
          token,
          recordingTime: accumulatedTimeRef.current
        });
        console.log('📤 Sent stop-backup-recording to backend');
      }

      // Wait for backend to save to FTP
      console.log('⏳ Waiting for backend to save audio to FTP...');
      // addToast("info", "Saving audio file...", 3000);
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Retry logic to fetch audio URL
      let audioUrl = null;
      let historyId = null;
      const maxAttempts = 15; // Increased attempts

      // addToast("info", "Retrieving audio file...", 5000);

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`🔄 Attempt ${attempt}/${maxAttempts} - Fetching audio URL...`);

          const res = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/live-meeting/${meetingId}/latest`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!res.ok) {
            console.log(`⚠️ API returned ${res.status}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }

          const data = await res.json();

          if (data?.latestMeeting?.audio_url) {
            audioUrl = data.latestMeeting.audio_url;
            historyId = data.latestMeeting.history_id;
            console.log('✅ Successfully fetched audio URL:', audioUrl);
            console.log('📋 History ID:', historyId);
            break;
          } else {
            console.log(`⏳ Attempt ${attempt}: Audio not ready yet, waiting...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.error(`❌ Attempt ${attempt} failed:`, error);
          if (attempt === maxAttempts) {
            throw new Error("Failed to fetch audio URL after multiple attempts");
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (!audioUrl) {
        throw new Error("Audio URL not available after waiting");
      }

      const meetingDurationMinutes = Math.ceil(accumulatedTimeRef.current / 60);
      console.log("🔥 Starting background processing with audio URL:", audioUrl);

      // Show processing toast
      addToast("info", "Starting transcription processing...", 3000);

      // Start background processing
      const payload = {
        audioUrl,
        source: "Live Transcript Conversion",
        meetingDuration: meetingDurationMinutes,
      };

      // If history_id exists, include it
      if (historyId) {
        payload.historyId = historyId;
        console.log('🆔 Using existing history_id:', historyId);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/upload/upload-audio-background`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.historyId) {
        const finalHistoryId = response.data.historyId;

        console.log('✅ Background processing started with historyId:', finalHistoryId);

        // Clear backup recorder reference
        if (mediaRecorderRef.current?.backupRecorder) {
          mediaRecorderRef.current.backupRecorder = null;
        }

        // Show ending meeting toast
        addToast("info", "Ending meeting...", 2000);

        // End the meeting
        await endMeeting();

        // Success toast before navigation
        // addToast("success", "Redirecting to results page...", 2000);

        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));

        // Navigate to result page with background processing
        navigate(`/live-meeting/meeting-result/${finalHistoryId}`, {
          state: {
            historyID: finalHistoryId,
            processing: true,
            awaitingHeaders: true,
            meetingId: meetingId,
          },
        });
      } else {
        throw new Error("Failed to start background processing - no historyId received");
      }

    } catch (error) {
      console.error('❌ Error in stopRecording:', error);
      setIsProcessing(false);
      addToast("error", error.message || "Failed to stop recording properly");
    }
  };


  const continuePollingInBackground = async (meetingId, token, duration) => {
    console.log('🔄 Starting background polling for audio URL...');
    const maxBackgroundAttempts = 30; // Poll for up to 5 more minutes

    for (let attempt = 1; attempt <= maxBackgroundAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10 seconds

      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/live-meeting/${meetingId}/latest`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();

        if (data?.latestMeeting?.audio_url) {
          console.log('✅ Background polling found audio URL:', data.latestMeeting.audio_url);

          // Add preview now that audio is ready
          dispatch(
            addAudioPreview({
              audioUrl: data.latestMeeting.audio_url,
              id: Date.now(),
              uploadedAt: new Date().toISOString(),
              title: `meeting_${meetingId}.mp3`,
              needToShow: true,
              duration: duration,
            })
          );
          setRecordedBlob(true);

          addToast("success", "Your recording is now ready!");
          break; // Stop polling
        } else {
          console.log(`🔄 Background attempt ${attempt}: Still processing...`);
        }
      } catch (error) {
        console.error(`❌ Background polling error:`, error);
      }
    }
  };

  const endMeeting = async () => {
    try {
      console.log("🛑 Ending meeting:", meetingId);

      // Stop all individual recordings first
      individualRecordersRef.current.forEach((recorder, socketId) => {
        if (recorder.state === "recording") {
          recorder.stop();
          console.log(`Stopped individual recorder for ${socketId}`);
        }
      });

      // Stop main media recorder
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }

      // Emit host:end-meeting event BEFORE making API call
      // This ensures guests get disconnected immediately
      if (socketRef.current && socketRef.current.connected) {
        console.log("📤 Emitting host:end-meeting to room:", meetingId);
        socketRef.current.emit("host:end-meeting", { roomId: meetingId });
      }

      // Then make API call to mark meeting as ended in database
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/live-meeting/${meetingId}/end`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Close all WebRTC peer connections
      peersRef.current.forEach((pc) => {
        pc.close();
      });
      peersRef.current.clear();

      // Clear audio monitoring intervals
      audioIntervalsRef.current.forEach((interval) => {
        clearInterval(interval);
      });
      audioIntervalsRef.current.clear();

      // Reset participant count
      setParticipants(0);

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

  // 🔥 NEW: Check for backup after page load (recovery)
  useEffect(() => {
    const checkForBackup = async () => {
      if (!meetingId) return;

      const backupUrl = localStorage.getItem(`backup_${meetingId}`);

      if (backupUrl && !recordingBlobRef.current) {
        console.log('🔄 Found backup, attempting restore...');
        // addToast('info', 'Restoring recording from backup...');

        try {
          const response = await fetch(backupUrl);
          const blob = await response.blob();
          recordingBlobRef.current = blob;
          setRecordedBlob(true);

          localStorage.removeItem(`backup_${meetingId}`);
          // addToast('success', 'Recording restored from backup!');
        } catch (error) {
          console.error('❌ Failed to restore backup:', error);
          addToast('error', 'Failed to restore backup');
        }
      }
    };

    checkForBackup();
  }, [meetingId, addToast]);

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
    // Participant count will be updated via room:count event from server
    // Don't manually increment here to avoid double counting
  };
  const reject = (id) => {
    socketRef.current.emit("host:reject", { guestSocketId: id });
    setRequests((r) => r.filter((x) => x.socketId !== id));
    // Don't update participant count for rejected requests
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





  const onRemove = () => {
    setRecordedBlob(false);
    dispatch(updateNeedToShow({ id: lastPreview?.id, needToShow: false }));
  };

  return (
    <>
      {showResumeModal && pendingMeeting && (
        <ResumeMeetingModal
          meeting={pendingMeeting}
          onResume={handleResumeMeeting}
          onStartNew={handleStartNewMeeting}
          onClose={() => setShowResumeModal(false)}
        />
      )}
      <Helmet>
        <meta charSet="utf-8" name="robots" content="noindex, nofollow" />
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
        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll lg:pb-0 pb-10">
          <Breadcrumb items={breadcrumbItems} />
          <div className="min-h-screen container mx-auto px-4">
            <div className="text-center mb-8 mt-10 px-4">
              <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 pb-1 lg:pb-3">
                Face-to-Face Meeting Mode
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Using your device microphone.
              </p>
            </div>
            <div className="h-full w-full flex flex-col gap-6 lg:gap-10 pb-10">
              <div className="w-full">
                <Timing />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full ">
                <div className="lg:col-span-2 w-full bg-gray-100 dark:bg-slate-800/80 border-white/20 backdrop-blur-sm lg:p-10 p-4 rounded-2xl shadow-lg">
                  <div className="flex flex-col justify-center items-start w-full">
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
                            className={`absolute inset-0 rounded-full bg-green-500 opacity-20 ${isRecording ? "animate-ping" : ""
                              }`}
                          ></div>
                          <div className="relative z-10 p-3 rounded-full bg-green-50">
                            <Mic
                              className={`md:w-8 md:h-8 w-6 h-6 ${isRecording
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
                                  className={`w-1 bg-gradient-to-t from-green-600 to-green-400 rounded-full transition-all duration-300 ${isRecording ? "animate-pulse" : "opacity-30"
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
                          className={`relative capitalize text-sm cursor-pointer disabled:cursor-not-allowed px-6 py-3 rounded-full font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 ${isRecording
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
                              <p className="text-sm text-gray-600 text-center mb-3">
                                In large meetings (25+ attendees), one device may not capture all voices clearly. Others can scan this QR code to join as
                                <span className="font-medium text-gray-800">{" "}Voice Contributors</span>,
                                turning their devices into additional microphones for better meeting accuracy.
                              </p>
                              <div className="flex flex-col items-center">
                                <QRCodeCanvas value={getMeetingUrl()} size={128} level="H" />
                                <p className="mt-2 text-sm text-gray-500">Scan to join this meeting</p>
                                <button
                                  onClick={copyMeetingLink}
                                  className="mt-2 text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy meeting link
                                </button>
                                <div className="mt-2 text-xs text-gray-400 text-center">
                                  {participants} participant(s) connected
                                  {requests.length > 0 && (
                                    <div className="text-orange-500">
                                      {requests.length} pending approval
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 text-center mt-3">
                                Devices joined via QR code will function only as microphones. All captured data will be securely stored under the <span className="font-medium text-gray-800">{" "}meeting organizer’s{" "}</span> recording timeline.
                              </p>
                            </div>
                            <button
                              className={`px-4 py-2 mt-4 cursor-pointer rounded flex items-center gap-2 ${isMuted
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
                  {/* {isAudioPreviewProcessing && (
                    <div className="text-xl font-medium text-black dark:text-white flex justify-center items-center gap-2 my-4 py-4 px-4">
                      <Loader2 className="w-10 h-10 animate-spin" />
                      Meeting Preview Processing...
                    </div>
                  )} */}

                  {/* Show preview when ready */}
                  {/* {lastPreview?.needToShow === true && lastPreview?.audioUrl && !isAudioPreviewProcessing && (
                    <StylishAudioPreview
                      onRecordAgain={handleRecordAgain}
                      onRemove={onRemove}
                    />
                  )} */}

                  {/* <button
                    onClick={handleStartMakingNotes}
                    disabled={
                      !lastPreview?.audioUrl ||
                      lastPreview?.needToShow === false ||
                      isProcessing ||
                      previews.length === 0
                    }
                    className={`mt-10 w-full py-4 rounded-lg text-gray-600 dark:text-white font-semibold flex justify-center items-center gap-2 ${!lastPreview?.audioUrl ||
                      lastPreview?.needToShow === false ||
                      isProcessing ||
                      previews.length === 0
                      ? "bg-gray-500/20 cursor-not-allowed"
                      : "bg-blue-400/20 hover:bg-blue-500 hover:text-white cursor-pointer"
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
                  </button> */}
                  {/* <p className="text-xs text-gray-400 mt-3 text-center">
                    🆓 Meeting transcription is completely free now
                  </p> */}

                  {/* <MultipleAudioPlayer
                    // onContinue={continueNextProcess}
                    isPreviewProcessing={isPreviewProcessing}
                  /> */}
                </div>
                <div className="lg:col-span-1">
                  <UnifiedHistory
                    NeedFor="Live Transcript Conversion"
                    height="26.8rem"
                  />
                </div>
              </div>
              <div className="w-full">
                <MeetingInstruction needFor={"Live Meeting Conversion"} />
              </div>
              <MeetingFeatures />
            </div>
          </div>

          <Footer />
        </div>
        <JoinRequestModal
          reqs={requests}
          onApprove={approve}
          onReject={reject}
        />
        <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-float"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
        <div className="absolute bottom-32 right-32 w-5 h-5 bg-green-400 rounded-full opacity-40 animate-float animation-delay-1500"></div>
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
};

export default LiveMeeting;
