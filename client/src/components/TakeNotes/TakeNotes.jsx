import { useState, useRef } from "react";
import { FcConferenceCall } from "react-icons/fc";
import { useToast } from "../ToastContext";
import Timing from "../Timing/Timing";
import { saveTranscriptFiles } from "../TextTable/TextTable";
import HeaderModal from "../HeaderModal/HeaderModal";
import { useDispatch } from "react-redux";
import { setTableHeader } from "../../redux/meetingSlice";

const TakeNotes = () => {
  const [meetingLink, setMeetingLink] = useState("");
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState(null);

  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const { addToast } = useToast();
  const dispatch = useDispatch();

  const startMeeting = async () => {
    if (!meetingLink) {
      addToast("error", "Please paste a meeting link");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      addToast("error", "Your browser doesn't support audio recording");
      return;
    }

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
          setIsMeetingActive(true);
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
    setShowModal(true);
    setIsMeetingActive(false);
    setMeetingLink("");
    setTranscript([]);
  };

  const handleSaveHeaders = async (headers) => {
    dispatch(setTableHeader(headers));
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
          }),
        }
      );
      const tableData = await response.json();
      if (!Array.isArray(tableData)) {
        addToast("error", "Could not process meeting notes");
        return;
      }
      saveTranscriptFiles(tableData, headers, addToast);
    } catch (error) {
      console.error("Error converting transcript:", error);
      addToast("error", "Failed to convert transcript");
    }
  };

  return (
    <div className="relative z-20 flex flex-col items-center p-10 bg-[linear-gradient(45deg,white,#b4d6e0)] rounded-xl max-w-2xl md:w-full w-[90vw] shadow-lg animate-fadeIn">
      <p className="text-3xl font-bold text-gray-800 mb-1 text-center">
        Take Notes from Online Meeting
      </p>

      {!isMeetingActive ? (
        <>
          <p className="text-sm text-gray-500 text-center mb-6">
            Connect Zoom, Google Meet, or Teams link and generate automatic MoM.
          </p>

          <Timing />

          <div className="flex flex-col items-start w-full my-6">
            <h1 className="text-gray-600 text-sm mb-1">Paste meeting URL</h1>
            <div className="flex items-center border border-gray-300 rounded-lg p-2 w-full">
              <FcConferenceCall className="text-blue-500 text-xl mr-2" />
              <input
                type="text"
                placeholder="Paste link"
                className="flex-1 outline-none"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
          </div>

          <button
            disabled={!meetingLink.trim()}
            onClick={startMeeting}
            className={`mt-4 w-full py-3 rounded-lg text-white font-semibold transition-colors duration-300 ${
              meetingLink.trim()
                ? "bg-blue-400 hover:bg-blue-500 cursor-pointer"
                : "bg-blue-400 cursor-not-allowed"
            }`}
          >
            Start making notes
          </button>
        </>
      ) : (
        <>
          <p className="mt-4 text-green-600 animate-pulse">
            Meeting is live. Listening...
          </p>
          <button
            onClick={endMeeting}
            className="mt-4 w-full py-3 rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600 transition-colors duration-300"
          >
            Meeting End
          </button>
          <div className="mt-4 w-full h-40 overflow-y-auto bg-white p-3 border rounded-lg">
            {transcript.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </>
      )}
      {showModal && (
        <HeaderModal
          onSave={handleSaveHeaders}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default TakeNotes;
