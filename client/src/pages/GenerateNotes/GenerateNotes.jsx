import { useRef, useState } from "react";
import DownloadOptions from "../../components/DownloadOptions/DownloadOptions";
import Footer from "../../components/Footer/Footer";
import Timing from "../../components/Timing/Timing";
import { cn } from "../../lib/utils";
import { useToast } from "../../components/ToastContext";
import { useSelector } from "react-redux";
import { FiUploadCloud } from "react-icons/fi";
import AllHistory from "../../components/History/History";
import { saveTranscriptFiles } from "../../components/TextTable/TextTable";
import TablePreview from "../../components/TablePreview/TablePreview";
import { MonitorSmartphone, HardDriveUpload, FileText } from "lucide-react";
import Heading from "../../components/LittleComponent/Heading";
import RealTablePreview from "../../components/TablePreview/RealTablePreview";
import { Helmet } from "react-helmet";
import axios from "axios";
import { processTranscriptWithDeepSeek } from "../../lib/apiConfig";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";

const breadcrumbItems = [{ label: "Generate Notes" }];

const GenerateNotes = () => {
  const [activeTab, setActiveTab] = useState("computer");
  const [selectedFile, setSelectedFile] = useState(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [detectLanguage, setDetectLanguage] = useState("");
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState(null);
  const [showFullData, setShowFullData] = useState(null);
  const [isSending, setIsSending] = useState(false);

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

    const formData = new FormData();
    let apiUrl = "";

    if (activeTab === "computer") {
      formData.append("audio", selectedFile);
      apiUrl = `${import.meta.env.VITE_BACKEND_URL}/api/process-audio`;
    } else {
      formData.append("driveUrl", driveUrl);
      apiUrl = `${import.meta.env.VITE_BACKEND_URL}/api/process-drive`;
    }

    try {
      const resp = await axios.post(apiUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (resp.statusText !== "OK") {
        throw new Error(`Server error: ${resp.status}`);
      }

      const data = await resp?.data;
      setDetectLanguage(data.language);
      setFinalTranscript(data.text);
      setShowModal(true);
      setSelectedFile(null);
      setDriveUrl("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Failed to process file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const { email, fullName, token } = useSelector((state) => state.auth);
  const handleSaveHeaders = async (headers) => {
    setIsSending(true);
    try {
      const tableData = await processTranscriptWithDeepSeek(
        finalTranscript,
        headers
      );

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
      setShowModal2(false);
      setShowModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const HandleSaveTable = async (data, downloadOptions) => {
    saveTranscriptFiles(data, addToast, downloadOptions, email, fullName);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const dateCreated = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const historyData = {
      source: "Generate Notes Conversion",
      date: dateCreated,
      data: data,
      language: detectLanguage,
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

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | GenerateNotes</title>
        <link rel="canonical" href="https://officemom.me/audio-notes" />
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
        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll ">
          <div className=" min-h-screen">
            {!showModal && <Breadcrumb items={breadcrumbItems} />}
            {!showModal && (
              <Heading
                heading="Generate Notes from Audio/Video Files"
                subHeading="Upload recorded audio/video and get notes generated within seconds."
              />
            )}
            {showModal ? (
              <section className=" min-h-screen h-full lg:max-w-full max-w-screen flex justify-center items-center">
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
              <div className="h-full w-full flex lg:flex-row flex-col pb-10 ">
                <section className="h-full pb-10 lg:w-[65%] w-screen md:px-10 px-4">
                  <Timing />
                  <div className="bg-white/80 mt-6 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 animate-fade-in-up">
                    <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 mb-4">
                      <button
                        onClick={() => setActiveTab("computer")}
                        disabled={isProcessing}
                        className={`flex-1 cursor-pointer py-3 px-4 rounded-lg font-semibold transition-all ${
                          activeTab === "computer"
                            ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105"
                            : "text-gray-600 dark:text-gray-300 hover:text-indigo-600"
                        }`}
                      >
                        <MonitorSmartphone className="w-5 h-5 inline mr-2" />
                        From Your Computer
                      </button>
                      <button
                        onClick={() => setActiveTab("drive")}
                        disabled={isProcessing}
                        className={`flex-1 cursor-pointer py-3 px-4 rounded-lg font-semibold transition-all ${
                          activeTab === "drive"
                            ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-105"
                            : "text-gray-600 dark:text-gray-300 hover:text-indigo-600"
                        }`}
                      >
                        <HardDriveUpload className="w-5 h-5 inline mr-2" />
                        From Google Drive
                      </button>
                    </div>
                    <div className="space-y-6">
                      {activeTab === "computer" && (
                        <label
                          htmlFor="file-upload"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add(
                              "border-blue-400",
                              "bg-blue-50"
                            );
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove(
                              "border-blue-400",
                              "bg-blue-50"
                            );
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove(
                              "border-blue-400",
                              "bg-blue-50"
                            );
                            if (
                              e.dataTransfer.files &&
                              e.dataTransfer.files.length > 0
                            ) {
                              handleFileSelect({
                                target: { files: e.dataTransfer.files },
                              });
                              e.dataTransfer.clearData();
                            }
                          }}
                          className={`mt-4 md:h-40 h-fit flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
                            selectedFile
                              ? "border-blue-400 bg-blue-50 dark:bg-transparent"
                              : "border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          {selectedFile ? (
                            <>
                              <FiUploadCloud className="text-4xl text-blue-500 mb-2" />
                              <p className="text-gray-700 font-medium text-center truncate max-w-full mb-1">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                File Uploaded Successfully •{" "}
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)}{" "}
                                MB • {selectedFile.type}
                              </p>
                              <button
                                type="button"
                                disabled={isProcessing}
                                className="mt-1 text-sm cursor-pointer text-blue-500 hover:text-blue-700 px-0 py-0 rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFile(null);
                                  if (fileInputRef.current)
                                    fileInputRef.current.value = "";
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
                              <p className="text-xs text-gray-400">
                                Max size: 10.74GB
                              </p>
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
                        <div className="mt-2 flex flex-col items-start justify-center border border-gray-300 rounded-lg p-4 h-40 bg-gray-50 dark:bg-transparent">
                          <h2 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                            Paste your Google Drive URL
                          </h2>
                          <input
                            type="url"
                            placeholder="https://drive.google.com/file/d/..."
                            className="w-full p-2 border dark:text-gray-300 border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
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
                        disabled={isProcessing || !driveUrl}
                        className={`mt-6 w-full py-4 rounded-lg text-white font-semibold transition-colors ${
                          isProcessing || !driveUrl
                            ? "bg-gray-500 cursor-not-allowed"
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
                            Processing...
                          </>
                        ) : (
                          <>
                            <FileText className="w-6 h-6 mr-2" />
                            Create MoM (Minutes of Meeting)
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleStartMakingNotes}
                        disabled={isProcessing || !selectedFile}
                        className={`mt-6 w-full py-4  rounded-lg text-gray-600 dark:text-white font-semibold transition-colors ${
                          isProcessing || !selectedFile
                            ? "bg-gray-500/20 cursor-not-allowed "
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
                          <>
                            <FileText className="w-6 h-6 mr-2" />
                            Create MoM (Minutes of Meeting)
                          </>
                        )}
                      </button>
                    )}
                    <p className="text-xs text-gray-400 mt-3 text-center">
                      🆓 Meeting transcription is completely free now
                    </p>
                  </div>
                </section>
                <section className="lg:w-[35%] w-screen lg:pr-6 px-4 md:px-10 lg:px-0">
                  <AllHistory NeedFor={"Generate Notes Conversion"} />
                </section>
              </div>
            )}
          </div>
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

export default GenerateNotes;
