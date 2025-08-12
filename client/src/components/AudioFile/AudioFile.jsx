import { useState, useRef } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { useToast } from "../ToastContext";
import Timing from "../Timing/Timing";

const AudioFile = () => {
  const [activeTab, setActiveTab] = useState("computer");
  const [selectedFile, setSelectedFile] = useState(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gettingData, setGettingData] = useState(false);

  const fileInputRef = useRef(null);
  const { addToast } = useToast();


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
    if (activeTab === "computer" && !selectedFile) {
      return;
    }
    if (activeTab === "drive" && !driveUrl) {
      setError("Please paste a valid Google Drive URL");
      return;
    }
    setIsProcessing(true);
    setGettingData(false);

    const formData = new FormData();
    let apiUrl = "";

    if (activeTab === "computer") {
      formData.append("audio", selectedFile);
      apiUrl = `${import.meta.env.VITE_BACKEND_URL}/api/process-audio`;
    } else {
      formData.append("driveUrl", driveUrl);
      apiUrl = `${import.meta.env.VITE_BACKEND_URL}/api/process-drive`;
    }

    formData.append("language_code", "en_us");

    try {
      const resp = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

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
      addToast("success", "Audio converted Successfully");
      setSelectedFile(null);
      setDriveUrl("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setGettingData(true);
    } catch (err) {
      console.error(err);
      addToast("error", "Failed to process file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative z-20 flex flex-col items-center p-6 bg-[linear-gradient(45deg,white,#b4d6e0)] rounded-xl max-w-2xl w-[95vw] shadow-lg max-h-[90vh]">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">
        Generate Notes from Audio/Video Files
      </h1>
      <p className="text-sm text-gray-500 mt-1 mb-6 text-center">
        Upload recorded audio and get notes generated within seconds.
      </p>
      <Timing/>
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
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("border-blue-400", "bg-blue-50");
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove("border-blue-400", "bg-blue-50");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-blue-400", "bg-blue-50");
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileSelect({ target: { files: e.dataTransfer.files } });
                e.dataTransfer.clearData();
              }
            }}
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
      {activeTab === "drive" ? (
        <button
          onClick={handleStartMakingNotes}
          disabled={!driveUrl}
          className={`mt-3 w-full py-3  rounded-lg text-white font-semibold transition-colors ${
            !driveUrl
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
          } flex items-center justify-center`}
        >
          Start Making Notes
        </button>
      ) : (
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
      )}
      {gettingData && (
        <div className="mt-2 w-full">
          <p className="text-xs text-gray-400 text-center">
            Word and Excel documents have been downloaded automatically
          </p>
        </div>
      )}
      
    </div>
  );
};

export default AudioFile;
