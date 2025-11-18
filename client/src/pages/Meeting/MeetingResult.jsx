import { useLocation, useNavigate, useParams } from "react-router-dom";
import TablePreview from "../../components/TablePreview/TablePreview";
import { useState, useEffect } from "react";
import { useToast } from "../../components/ToastContext";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
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
    const [headersSubmitted, setHeadersSubmitted] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(3);

    // Poll for transcription status
    useEffect(() => {
        if (!historyId) return;

        const pollStatus = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/process/status/${historyId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const { status, progress, error, awaitingHeaders } = response.data;

                setProcessingStatus({ status, progress, error, awaitingHeaders });

                // Stop polling if transcription is complete and awaiting headers
                if (awaitingHeaders) {
                    clearInterval(interval);
                }
            } catch (error) {
                console.error("Error polling status:", error);
            }
        };

        const interval = setInterval(pollStatus, 3000);
        pollStatus(); // Initial call

        return () => clearInterval(interval);
    }, [historyId, token]);

    // Countdown and redirect after headers submitted
    useEffect(() => {
        if (!headersSubmitted) return;

        const countdown = setInterval(() => {
            setRedirectCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    navigate('/generate-notes');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdown);
    }, [headersSubmitted, navigate]);

    const handleSaveHeaders = async (headers, useDefault = false) => {
        navigate('/generate-notes')
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
            setHeadersSubmitted(true);
            addToast("success", "Headers saved! MoM generation started in background.");

        } catch (error) {
            console.error("Error saving headers:", error);
            setIsSending(false);
            addToast("error", error.response?.data?.message || "Failed to save headers. Please try again.");
        }
    };

    // Show loading state while transcription is processing
    // if (processingStatus && processingStatus.status === 'transcribing') {
    //     return (
    //         <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
    //             <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
    //                 <div className="absolute inset-0 opacity-40">
    //                     <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow"></div>
    //                     <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
    //                 </div>
    //             </div>

    //             <div className="relative z-10 text-center space-y-6 p-8">
    //                 <Loader2 className="w-20 h-20 animate-spin text-blue-500 mx-auto" />
    //                 <div className="space-y-2">
    //                     <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
    //                         Transcribing Your Audio...
    //                     </h2>
    //                     <p className="text-lg text-gray-600 dark:text-gray-400">
    //                         Progress: {processingStatus?.progress || 0}%
    //                     </p>
    //                     <p className="text-sm text-gray-500 dark:text-gray-500">
    //                         This may take a few minutes. Please wait...
    //                     </p>
    //                     <div className="w-full max-w-md mx-auto mt-4">
    //                         <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
    //                             <div
    //                                 className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
    //                                 style={{ width: `${processingStatus?.progress || 0}%` }}
    //                             ></div>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </div>
    //         </section>
    //     );
    // }

    // Show error if transcription failed
    // if (processingStatus && processingStatus.status === 'failed') {
    //     return (
    //         <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
    //             <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30"></div>

    //             <div className="relative z-10 text-center space-y-6 p-8">
    //                 <AlertCircle className="w-20 h-20 text-red-500 mx-auto" />
    //                 <div className="space-y-2">
    //                     <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
    //                         Transcription Failed
    //                     </h2>
    //                     <p className="text-lg text-gray-600 dark:text-gray-400">
    //                         {processingStatus?.error || "An error occurred during transcription"}
    //                     </p>
    //                     <button
    //                         onClick={() => navigate('/generate-notes')}
    //                         className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
    //                     >
    //                         Go Back
    //                     </button>
    //                 </div>
    //             </div>
    //         </section>
    //     );
    // }

    // Show success and redirect after headers submitted
    // if (headersSubmitted) {
    //     return (
    //         <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
    //             <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
    //                 <div className="absolute inset-0 opacity-40">
    //                     <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-300 dark:bg-green-600 rounded-full blur-3xl animate-pulse-slow"></div>
    //                     <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
    //                 </div>
    //             </div>

    //             <div className="relative z-10 text-center space-y-6 p-8">
    //                 <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
    //                 <div className="space-y-2">
    //                     <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
    //                         Headers Saved Successfully!
    //                     </h2>
    //                     <p className="text-lg text-gray-600 dark:text-gray-400">
    //                         Your MoM is being generated in the background.
    //                     </p>
    //                     <p className="text-sm text-gray-500 dark:text-gray-500">
    //                         Redirecting to Generate Notes in {redirectCountdown} seconds...
    //                     </p>
    //                     <button
    //                         onClick={() => navigate('/generate-notes')}
    //                         className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
    //                     >
    //                         Go Now
    //                     </button>
    //                 </div>
    //             </div>
    //         </section>
    //     );
    // }

    // Show header selection interface (transcription complete, awaiting headers)
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