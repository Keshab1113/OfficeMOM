import { useState, useEffect, useRef } from "react";
import { FiChevronDown, FiUploadCloud } from "react-icons/fi";
import { countryToLanguage, languages } from "../Language";

const AudioFile = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userCountry, setUserCountry] = useState("");
  const [activeTab, setActiveTab] = useState("computer");
  const [selectedFile, setSelectedFile] = useState(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gettingData, setGettingData] = useState(false);

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_LANGUAGE_URL}`);
        const data = await res.json();
        setUserCountry(data.country_name);
        if (data.country_name && countryToLanguage[data.country_name]) {
          setSelectedLanguage(countryToLanguage[data.country_name]);
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

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = [
        "audio/mp3",
        "audio/wav",
        "audio/mpeg",
        "video/mp4",
        "video/webm",
      ];
      if (!validTypes.includes(file.type)) {
        setError("Invalid file type. Please upload an audio or video file.");
        return;
      }
      if (file.size > 10.74 * 1024 * 1024 * 1024) {
        setError("File size exceeds maximum limit of 10.74GB");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleStartMakingNotes = async () => {
    if (!selectedFile) {
      return;
    }
    setIsProcessing(true);
    setGettingData(false);
    const formData = new FormData();
    formData.append("audio", selectedFile);
    formData.append("language_code", "en_us");
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/process-audio`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!resp.ok) {
        throw new Error(`Server error: ${resp.status}`);
      }
      const data = await resp.json();
      const downloadBase64File = (base64, fileName, mimeType) => {
        const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      };
      downloadBase64File(
        data.wordBase64,
        "transcript.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      downloadBase64File(
        data.excelBase64,
        "transcript.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setGettingData(true);
    } catch (err) {
      console.error(err);
      alert("Failed to process audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative z-20 flex flex-col items-center p-6 bg-[linear-gradient(45deg,white,#b4d6e0)] rounded-xl max-w-2xl w-[95vw] shadow-lg max-h-[90vh]">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">
        Generate Notes from Audio/Video Files
      </h1>
      <p className="text-sm text-gray-500 mt-1 text-center">
        Upload recorded audio and get notes generated within seconds.
      </p>
      <div className="mt-2 w-full">
        <p className="text-gray-600 text-sm mb-1">
          Choose the language.{" "}
          <span className="text-xs text-gray-400">
            We can detect mixed language and accent.
          </span>
        </p>
        <div
          className="mt-1 border border-gray-300 rounded-lg p-3 bg-gray-50 relative"
          ref={dropdownRef}
        >
          <p className="text-gray-500 text-sm">
            Recommended based on your location:{" "}
            <b>{userCountry ? `🇺🇳 ${userCountry}` : "Detecting..."}</b>
          </p>
          <div
            className="mt-2 flex items-center justify-between bg-white border border-gray-300 rounded-lg p-2 cursor-pointer"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span>{selectedLanguage}</span>
            <FiChevronDown
              className={`transition-transform ${
                showDropdown ? "rotate-180" : ""
              }`}
            />
          </div>
          {showDropdown && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
              <input
                type="text"
                placeholder="Search language..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border-b border-gray-200 outline-none sticky top-0 bg-white"
              />
              <div className="max-h-48 overflow-y-auto">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map((lang, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
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
                  <div className="px-3 py-2 text-gray-400">
                    No results found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 w-full">
        <div className="flex border-b border-gray-300">
          <button
            onClick={() => setActiveTab("computer")}
            className={`flex-1 py-2 text-center font-medium cursor-pointer ${
              activeTab === "computer"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            From Your Computer
          </button>
          <button
            onClick={() => setActiveTab("drive")}
            className={`flex-1 py-2 text-center font-medium cursor-pointer ${
              activeTab === "drive"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            From Google Drive
          </button>
        </div>
        {activeTab === "computer" && (
          <label
            htmlFor="file-upload"
            className={`mt-4 h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
              selectedFile
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-blue-400"
            }`}
          >
            {selectedFile ? (
              <>
                <FiUploadCloud className="text-4xl text-blue-500 mb-2" />
                <p className="text-gray-700 font-medium text-center truncate max-w-full">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                  {selectedFile.type}
                </p>
                <button
                  type="button"
                  className="mt-2 text-sm cursor-pointer text-blue-500 hover:text-blue-700 px-3 py-1 rounded hover:bg-blue-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Change File
                </button>
              </>
            ) : (
              <>
                <FiUploadCloud className="text-4xl text-gray-400 mb-2" />
                <p className="text-gray-600 text-center">
                  Drag your file here or click to select
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supported: MP3, WAV, MP4, WebM
                </p>
                <p className="text-xs text-gray-400">Max size: 10.74GB</p>
              </>
            )}
            <input
              id="file-upload"
              type="file"
              accept=".mp3,.wav,.mp4,.webm,audio/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
              ref={fileInputRef}
            />
          </label>
        )}
        {activeTab === "drive" && (
          <div className="mt-2 flex flex-col items-start justify-center border border-gray-300 rounded-lg p-4 h-40 bg-gray-50">
            <h2 className="text-gray-600 text-sm font-medium mb-2">
              Paste your Google Drive URL
            </h2>
            <input
              type="url"
              placeholder="https://drive.google.com/file/d/..."
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              value={driveUrl}
              onChange={(e) => {
                setDriveUrl(e.target.value);
                setError(null);
              }}
            />
            <p className="text-xs text-gray-400 mt-2 self-end">
              Max size: 10.74GB
            </p>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-4 w-full p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      <button
        onClick={handleStartMakingNotes}
        disabled={isProcessing || !selectedFile}
        className={`mt-3 w-full py-3  rounded-lg text-white font-semibold transition-colors ${
          isProcessing || !selectedFile
            ? "bg-blue-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
        } flex items-center justify-center`}
      >
        {isProcessing ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing Audio...
          </>
        ) : (
          "Start Making Notes"
        )}
      </button>
      {gettingData && (
        <div className="mt-2 w-full">
          <p className="text-xs text-gray-400 text-center">
            Word and Excel documents have been downloaded automatically
          </p>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-2 text-center">
        Free service during beta testing
      </p>
    </div>
  );
};

export default AudioFile;
