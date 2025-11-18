import { useLocation, useNavigate, useParams } from "react-router-dom";
import TablePreview from "../../components/TablePreview/TablePreview";
import { useState, useEffect } from "react";
import { useToast } from "../../components/ToastContext";
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import Footer from "../../components/Footer/Footer";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";
import { useSelector } from "react-redux";
import axios from "axios";

const breadcrumbItems = [{ label: "Set Headers" }];

export default function MeetingResult() {
    const { historyId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { token } = useSelector((s) => s.auth);

    const [isSending, setIsSending] = useState(false);
    const [processingStatus, setProcessingStatus] = useState(null);
    const [isTranscriptionComplete, setIsTranscriptionComplete] = useState(false);

    // Poll for transcription status
    useEffect(() => {
        if (!historyId) return;

        let pollCount = 0;
        const maxPolls = 300; // 10 minutes max (300 * 2 seconds)

        const pollStatus = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/process/status/${historyId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const { status, progress, error, awaitingHeaders } = response.data;

                setProcessingStatus({ status, progress, error, awaitingHeaders });

                // Stop polling if transcription is complete and awaiting headers
                if (awaitingHeaders || status === 'awaiting_headers') {
                    setIsTranscriptionComplete(true);
                    clearInterval(interval);
                } else if (status === 'failed') {
                    clearInterval(interval);
                    addToast("error", error || "Processing failed. Please try again.");
                } else if (status === 'completed') {
                    // If somehow already completed (shouldn't happen), redirect to view
                    clearInterval(interval);
                    navigate(`/momGenerate/${historyId}`);
                }

                pollCount++;
                if (pollCount >= maxPolls) {
                    clearInterval(interval);
                    addToast("error", "Processing is taking longer than expected. Please check back later.");
                }
            } catch (error) {
                console.error("Error polling status:", error);
                pollCount++;
                if (pollCount >= maxPolls) {
                    clearInterval(interval);
                }
            }
        };

        const interval = setInterval(pollStatus, 2000); // Poll every 2 seconds
        pollStatus(); // Initial call

        return () => clearInterval(interval);
    }, [historyId, token, navigate, addToast]);

    const handleSaveHeaders = async (headers, useDefault = false) => {
        try {
            setIsSending(true);

            console.log('📤 Submitting headers:', { historyId, headers, useDefault });

            // Submit headers to backend
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/process/save-headers`,
                {
                    historyId,
                    headers,
                    useDefault
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setIsSending(false);
            
            // Show success message
            addToast("success", "Headers saved! MoM generation started in background.");
            
            // Redirect back to generate notes page
            setTimeout(() => {
                navigate('/generate-notes');
            }, 1500);

        } catch (error) {
            console.error("Error saving headers:", error);
            setIsSending(false);
            addToast("error", error.response?.data?.message || "Failed to save headers. Please try again.");
        }
    };

    return (
        <section className="relative min-h-screen w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
                </div>
            </div>

            <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll">
                <div className="min-h-screen lg:px-4 md:px-4 px-4 py-20 lg:py-28 flex flex-col md:gap-12 gap-8 container mx-auto lg:max-w-[70vw] xl:max-w-[80vw] w-full">
                    <Breadcrumb items={breadcrumbItems} />
                    <div className="dark:bg-gray-800/70 bg-gray-100 md:p-8 p-4 rounded-2xl border dark:border-gray-700 border-white shadow-xl">
                        <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Customize Your MoM Headers
                        </h1>
                        <p className="text-sm md:text-base font-semibold mb-6 text-center bg-gradient-to-r from-blue-900 to-purple-950 dark:from-blue-100 dark:to-blue-200 bg-clip-text text-transparent">
                            Customize the headings for your Minutes of the Meeting (MoM) columns. If you provide specific headings, your MoM will be generated accordingly. Default headings will be used if none are provided.
                        </p>

                        {/* Transcription Status */}
                        {!isTranscriptionComplete && processingStatus && (
                            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                        <span className="font-medium text-gray-800 dark:text-white">
                                            Transcribing your audio...
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                                        {processingStatus.progress}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                        style={{ width: `${processingStatus.progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                    You can set your headers while transcription is in progress. Once transcription completes, MoM generation will start automatically.
                                </p>
                            </div>
                        )}

                        {/* Transcription Complete */}
                        {isTranscriptionComplete && (
                            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="font-medium text-gray-800 dark:text-white">
                                        Transcription complete! Now customize your headers.
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {processingStatus?.error && (
                            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <span className="font-medium text-gray-800 dark:text-white">
                                        {processingStatus.error}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 w-full">
                            <TablePreview
                                onSaveHeaders={handleSaveHeaders}
                                isSending={isSending}
                            />
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </section>
    );
}