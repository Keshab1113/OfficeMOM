import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useToast } from "../../components/ToastContext";
import axios from "axios";
import { Helmet } from "react-helmet";
import { FiUploadCloud } from "react-icons/fi";
import { MonitorSmartphone, HardDriveUpload, FileText, AudioLines } from "lucide-react";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";
import Timing from "../../components/Timing/Timing";
import UnifiedHistory from "../../components/History/UnifiedHistory";
import MeetingInstruction from "../../components/MeetingInstructions/MeetingInstruction";
import MeetingFeatures from "../../components/MeetingInstructions/MeetingFeatures";
import Footer from "../../components/Footer/Footer";
import RechargeModal from "../../components/RechargeModal/RechargeModal";
import FreePlanLimitModal from "../../components/LittleComponent/FreePlanLimitModal";

const breadcrumbItems = [{ label: "Generate Notes" }];

const GenerateNotesHome = () => {
    const { token } = useSelector((state) => state.auth);
    const { addToast } = useToast();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [activeTab, setActiveTab] = useState("computer");
    const [selectedFile, setSelectedFile] = useState(null);
    const [driveUrl, setDriveUrl] = useState("");
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    const [rechargeInfo, setRechargeInfo] = useState(null);
    const [showFreePlanModal, setShowFreePlanModal] = useState(false);
    const [freePlanMessage, setFreePlanMessage] = useState("");

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validExtensions = [".mp3", ".wav", ".mp4", ".webm", ".mpeg", ".m4a"];
        const validMimeTypes = [
            "audio/mpeg", "audio/mp3", "audio/wav", "audio/mp4",
            "video/mp4", "video/webm", "video/mpeg",
        ];

        const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
        const isValidType = validMimeTypes.includes(file.type);
        const isValidExtension = validExtensions.includes(fileExtension);

        if (!isValidType && !isValidExtension) {
            setError("Invalid file type. Please upload an MP3, WAV, M4A, MP4, WebM, or MPEG file.");
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
        setError(null);
    };

    const handleStartMakingNotes = async () => {
        try {
            if (activeTab === "computer" && !selectedFile) return;
            if (activeTab === "drive" && !driveUrl) {
                setError("Please paste a valid Google Drive URL");
                return;
            }

            setIsProcessing(true);

            const apiUrl = `${import.meta.env.VITE_BACKEND_URL}/api/upload/upload-audio-background`;
            let response;

            if (activeTab === "computer") {
                const formData = new FormData();
                formData.append("audio", selectedFile);
                formData.append("source", "Generate Notes Conversion");
                response = await axios.post(apiUrl, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    },
                });
            } else {
                response = await axios.post(
                    apiUrl,
                    { driveUrl, source: "Generate Notes Conversion" },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            const data = response.data;
            setIsProcessing(false);

            const successMessage = data.minutesUsed
                ? `Upload successful! ${data.minutesUsed} minutes deducted.`
                : "Upload successful!";

            addToast("success", successMessage);

            // Navigate to header setup page
            navigate(`/generate-notes/meeting-result/${data.historyId}`, {
                state: {
                    historyID: data.historyId,
                    processing: true,
                    awaitingHeaders: true
                }
            });

            // Reset form
            setSelectedFile(null);
            setDriveUrl("");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

        } catch (err) {
            console.error(err);
            setIsProcessing(false);

            const status = err.response?.status;
            const errorData = err.response?.data;

            if (status === 402) {
                setShowRechargeModal(true);
                setRechargeInfo({
                    required: errorData.requiredMinutes,
                    remaining: errorData.remainingMinutes,
                    deficit: errorData.requiredMinutes - errorData.remainingMinutes,
                });
            } else if (status === 403 && errorData?.isFreeUserLimitExceeded) {
                setFreePlanMessage(errorData.message || "Free plan limit exceeded. Please upgrade.");
                setShowFreePlanModal(true);
            } else {
                addToast("error", err.response?.data?.message || "Upload failed. Please try again.");
            }
        }
    };

    return (
        <>
            <Helmet>
                <meta charSet="utf-8" name="robots" content="noindex, nofollow" />
                <title>Smart Minutes of the Meeting (OfficeMoM) | GenerateNotes</title>
                <link rel="canonical" href="https://officemom.me/generate-notes" />
            </Helmet>
            <section className="relative min-h-screen w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
                    <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
                    </div>
                </div>

                <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll lg:pb-0 pb-10">
                    <Breadcrumb items={breadcrumbItems} />
                    <div className="min-h-screen container mx-auto px-4">
                        <div className="text-center mb-8 mt-10 px-4">
                            <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 pb-1 lg:pb-3">
                                Generate Actions from Audio / video files
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300 mt-2">
                                Upload your recording and get structured notes instantly.
                            </p>
                        </div>

                        <div className="h-full w-full flex flex-col gap-6 lg:gap-10 pb-10">
                            <div className="w-full"><Timing /></div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                                <div className="lg:col-span-2">
                                    <div className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 animate-fade-in-up relative ${isProcessing ? "pointer-events-none opacity-60" : ""}`}>
                                        {isProcessing && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-black/40 rounded-2xl z-50">
                                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300 font-semibold">
                                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Processing in background...</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 mb-4">
                                            <button onClick={() => setActiveTab("computer")} disabled={isProcessing} className={`flex-1 cursor-pointer md:py-3 md:px-4 px-2 py-2 text-xs md:text-base rounded-lg md:font-semibold transition-all ${activeTab === "computer" ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-md" : "text-gray-600 dark:text-gray-300"}`}>
                                                <MonitorSmartphone className="w-5 h-5 inline mr-2" />
                                                From Computer
                                            </button>
                                            <button onClick={() => setActiveTab("drive")} disabled={isProcessing} className={`flex-1 cursor-pointer md:py-3 md:px-4 px-2 py-2 text-xs md:text-base rounded-lg md:font-semibold transition-all ${activeTab === "drive" ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-md" : "text-gray-600 dark:text-gray-300"}`}>
                                                <HardDriveUpload className="w-5 h-5 inline mr-2" />
                                                From Google Drive
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            <h1 className="text-gray-600 dark:text-white text-lg sm:text-xl flex items-center">
                                                <AudioLines className="mr-2 text-blue-600" />
                                                Upload Audio/Video File
                                            </h1>

                                            {activeTab === "computer" && (
                                                <label htmlFor="file-upload" className={`mt-4 md:h-40 h-fit flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${selectedFile ? "border-blue-400 bg-blue-50 dark:bg-transparent" : "border-gray-300 hover:border-blue-400"}`}>
                                                    {selectedFile ? (
                                                        <>
                                                            <FiUploadCloud className="text-4xl text-blue-500 mb-2" />
                                                            <p className="text-gray-700 font-medium text-center truncate max-w-full mb-1">{selectedFile.name}</p>
                                                            <p className="text-xs text-gray-500">File Size • {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                            <button type="button" disabled={isProcessing} className="mt-1 text-sm cursor-pointer text-blue-500 hover:text-blue-700" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                                                                Change File
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiUploadCloud className="text-4xl text-gray-400 mb-2" />
                                                            <p className="text-gray-600 text-center">Drag your file here or click to select</p>
                                                            <p className="text-xs text-gray-400 mt-1">Supported: MP3, WAV, MP4, WebM, MPEG, M4A</p>
                                                        </>
                                                    )}
                                                    <input id="file-upload" type="file" accept=".mp3,.wav,.m4a,.mp4,.webm,.mpeg" className="hidden" onChange={handleFileSelect} ref={fileInputRef} />
                                                </label>
                                            )}

                                            {activeTab === "drive" && (
                                                <div className="mt-2 flex flex-col items-start justify-center border border-gray-300 rounded-lg p-4 h-40 bg-gray-50 dark:bg-transparent">
                                                    <h2 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Paste your Google Drive URL</h2>
                                                    <input type="url" placeholder="https://drive.google.com/file/d/..." className="w-full p-2 border dark:text-gray-300 border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-300" value={driveUrl} onChange={(e) => { setDriveUrl(e.target.value); setError(null); }} />
                                                </div>
                                            )}
                                        </div>

                                        {error && <div className="mt-4 w-full p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">{error}</div>}

                                        <button
                                            onClick={handleStartMakingNotes}
                                            disabled={isProcessing || (activeTab === "computer" ? !selectedFile : !driveUrl)}
                                            className={`mt-6 w-full py-4 rounded-lg text-white font-semibold transition-colors ${isProcessing || (activeTab === "computer" ? !selectedFile : !driveUrl) ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"} flex items-center justify-center`}
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="w-6 h-6 mr-2" />
                                                    Upload & Set Headers
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="lg:col-span-1">
                                    <UnifiedHistory
                                        NeedFor="Generate Notes Conversion" 
                                        height="26.8rem"
                                    />
                                </div>
                            </div>

                            <MeetingInstruction needFor="Generate Notes Conversion" />
                            <MeetingFeatures />
                        </div>
                    </div>
                    <Footer />
                </div>
            </section>

            {showRechargeModal && (
                <RechargeModal
                    isOpen={showRechargeModal}
                    onClose={() => setShowRechargeModal(false)}
                    requiredMinutes={rechargeInfo?.required || 0}
                    remainingMinutes={rechargeInfo?.remaining || 0}
                    onRecharge={() => (window.location.href = "/recharge")}
                />
            )}
            {showFreePlanModal && (
                <FreePlanLimitModal
                    isOpen={showFreePlanModal}
                    message={freePlanMessage}
                    onClose={() => setShowFreePlanModal(false)}
                />
            )}
        </>
    );
}

export default GenerateNotesHome;