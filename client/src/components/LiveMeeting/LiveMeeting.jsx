import { useState, useEffect, useRef } from "react";
import { FiChevronDown } from "react-icons/fi";
import { countryToLanguage, languages } from "../Language";
import { MdRecordVoiceOver } from "react-icons/md";

const LiveMeeting = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userCountry, setUserCountry] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordedBlobRef = useRef(null); // Store the final blob
  const dropdownRef = useRef(null);
  const [recordedBlob, setRecordedBlob] = useState(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_LANGUAGE_URL}`);
        const data = await res.json();
        setUserCountry(data.country);
        if (data.country && countryToLanguage[data.country]) {
          setSelectedLanguage(countryToLanguage[data.country]);
        }
      } catch (error) {
        console.error("Location fetch error:", error);
      }
    };
    fetchLocation();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLanguages = languages.filter((lang) =>
    lang.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to transcribe audio");
      }

      const data = await res.json();
      const finalTranscript = data.text;

      downloadAsWord(finalTranscript);
      downloadAsExcel(finalTranscript);
    } catch (error) {
      console.error("Error processing notes:", error);
    } finally {
      setIsProcessing(false);
      setRecordedBlob(null);
    }
  };

  const downloadAsWord = (content) => {
    const blob = new Blob([content], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meeting_notes.doc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsExcel = (content) => {
    const csvContent =
      "Timestamp,Speaker,Content\n" +
      `"${new Date().toISOString()}","Participant 1","${content}"`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meeting_notes.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative z-20 flex flex-col items-center p-10 bg-[linear-gradient(45deg,white,#b4d6e0)] rounded-xl max-w-2xl md:w-full w-[90vw] shadow-lg">
      <p className="text-3xl font-bold text-gray-800">Record Live Meeting</p>
      <p className="text-sm text-gray-500 mt-1 text-center">
        Using your device microphone
      </p>

      <div className="mt-6 w-full" ref={dropdownRef}>
        <p className="text-gray-600 text-sm mb-1">
          Choose the language.{" "}
          <span className="text-xs text-gray-400">
            We can detect mixed language and accent, rest assured.
          </span>
        </p>

        <div className="mt-3 border border-gray-300 rounded-lg p-3 bg-gray-50 relative">
          <p className="text-gray-500 text-sm">
            Recommended based on your location:{" "}
            <b>{userCountry ? `🇺🇳 ${userCountry}` : "Loading..."}</b>
          </p>

          <div
            className="mt-2 flex items-center justify-between bg-white border border-gray-300 rounded-lg p-2 cursor-pointer relative"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span>{selectedLanguage}</span>
            <FiChevronDown />
          </div>

          {showDropdown && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-50 overflow-y-auto z-50">
              <input
                type="text"
                placeholder="Search language..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border-b border-gray-200 outline-none"
              />
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((lang, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setShowDropdown(false);
                      setSearchTerm("");
                    }}
                  >
                    {lang}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-400">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-center items-start w-full mt-6">
        <div className="flex gap-2 justify-start items-center w-full">
            <MdRecordVoiceOver className=" text-blue-500 text-2xl"/>
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
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-400 hover:bg-blue-500 cursor-pointer"
        }`}
      >
        {isProcessing ? "Processing..." : "Start making notes"}
      </button>

      <p className="text-xs text-gray-400 mt-2">
        Meeting cost is totally free now.
      </p>
    </div>
  );
};

export default LiveMeeting;
