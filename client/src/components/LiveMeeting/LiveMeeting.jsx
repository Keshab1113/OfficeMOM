import { useState, useRef } from "react";
import { MdRecordVoiceOver } from "react-icons/md";
import { useToast } from "../ToastContext";
import Timing from "../Timing/Timing";
import HeaderModal from "../HeaderModal/HeaderModal";
import { useDispatch } from "react-redux";
import { setTableHeader } from "../../redux/meetingSlice";
import { saveTranscriptFiles } from "../TextTable/TextTable";

const LiveMeeting = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordedBlobRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState(null);

  const [recordedBlob, setRecordedBlob] = useState(null);
  const { addToast } = useToast();
  const dispatch = useDispatch();

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
        console.log("Audio blob ready:", audioBlob);
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
      setFinalTranscript(data.text);
      setShowModal(true);
    } catch (error) {
      addToast("error", "Failed to process file. Please try again.");
      console.error("Error processing notes:", error);
      setIsProcessing(false);
    } finally {
      setRecordedBlob(null);
    }
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
          body: JSON.stringify({ transcript: finalTranscript, headers:headers }),
        }
      );
      const tableData = await response.json();
      if (!Array.isArray(tableData)) {
        addToast("error", "Could not process meeting notes");
        return;
      }
      saveTranscriptFiles(tableData,headers,addToast);
    } catch (error) {
      console.error("Error converting transcript:", error);
      addToast("error", "Failed to convert transcript");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative z-20 flex flex-col items-center p-10 bg-[linear-gradient(45deg,white,#b4d6e0)] rounded-xl max-w-2xl md:w-full w-[90vw] shadow-lg">
      <p className="text-3xl font-bold text-gray-800">Record Live Meeting</p>
      <p className="text-sm text-gray-500 mt-1 mb-6 text-center">
        Using your device microphone
      </p>

      <Timing />

      <div className="flex flex-col justify-center items-start w-full mt-6">
        <div className="flex gap-2 justify-start items-center w-full">
          <MdRecordVoiceOver className=" text-blue-500 text-2xl" />
          <h1 className="text-gray-600 text-sm">Live Mic Recording</h1>
        </div>

        <div className="mt-2 w-full flex items-center gap-2">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="border border-solid cursor-pointer px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Start recording
            </button>
          ) : (
            <>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span>Recording...</span>
              </div>
              <button
                onClick={stopRecording}
                className="border border-solid cursor-pointer px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ml-4"
              >
                Stop recording
              </button>
            </>
          )}
        </div>
      </div>

      <button
        onClick={handleStartMakingNotes}
        disabled={isProcessing || !recordedBlob}
        className={`mt-4 w-full py-3 rounded-lg text-white font-semibold ${
          isProcessing || !recordedBlob
            ? "bg-blue-400 cursor-not-allowed"
            : "bg-blue-400 hover:bg-blue-500 cursor-pointer"
        }`}
      >
        {isProcessing ? "Processing..." : "Start making notes"}
      </button>

      <p className="text-xs text-gray-400 mt-2">
        Meeting cost is totally free now.
      </p>
      {showModal && (
        <HeaderModal
          onSave={handleSaveHeaders}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default LiveMeeting;
