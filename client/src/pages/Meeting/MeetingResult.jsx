// src/pages/MeetingResult.jsx
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TablePreview from "../../components/TablePreview/TablePreview";
import RealTablePreview from "../../components/TablePreview/RealTablePreview";
import { useState, useEffect } from "react";
import { useToast } from "../../components/ToastContext";
import { saveTranscriptFiles } from "../../components/TextTable/TextTable";
import { DateTime } from "luxon";
import { FileText, Home } from "lucide-react";
import Footer from "../../components/Footer/Footer";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";
import { useSelector } from "react-redux";
import { processTranscriptWithDeepSeek } from "../../lib/apiConfig";

const breadcrumbItems = [{ label: "Meeting Result" }];

export default function MeetingResult() {
    const { meetingId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { email, fullName } = useSelector((s) => s.auth);

    // Expecting these from MeetingRoom navigation state
    const finalTranscript = state?.finalTranscript || state?.transcription || "";
    const detectLanguage = state?.detectLanguage || "";
    const audioID = state?.audioID || null;
    const updatedMeetingId = state?.updatedMeetingId || null;
    const uploadedUserId = state?.uploadedUserId || null;
    const historyID = state?.historyID || null;

    const [isSending, setIsSending] = useState(false);
    const [showFullData, setShowFullData] = useState(null);
    const [showRealTable, setShowRealTable] = useState(false);

    // Create a unique key for this meeting's data
    const storageKey = `meeting_${meetingId || audioID || 'current'}`;

    // Load saved state on component mount
    useEffect(() => {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.showFullData && parsed.showRealTable) {
                    setShowFullData(parsed.showFullData);
                    setShowRealTable(true);
                }
            } catch (error) {
                console.error("Error loading saved meeting data:", error);
            }
        }
    }, [storageKey]);

    const handleSaveHeaders = async (headers, audioIdFromUpload, transcriptAudioIdFromUpload, userIdFromUpload) => {
        setIsSending(true);
        try {
            const tableData = await processTranscriptWithDeepSeek(
                finalTranscript,
                headers,
                audioIdFromUpload,
                userIdFromUpload,
                transcriptAudioIdFromUpload,
                detectLanguage,
                historyID
            );
            if (!Array.isArray(tableData.final_mom)) {
                addToast("error", "Could not process meeting notes");
                setIsSending(false);
                return;
            }
            
            // Save to localStorage
            const dataToSave = {
                showFullData: tableData.final_mom,
                showRealTable: true,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
            
            setShowFullData(tableData.final_mom);
            setShowRealTable(true);
            setIsSending(false);
        } catch (error) {
            console.error("Error processing:", error);
            addToast("error", "Failed to process transcript");
            setIsSending(false);
        }
    };

    const HandleSaveTable = async (data, downloadOptions) => {
        saveTranscriptFiles(data, addToast, downloadOptions, email, fullName);
        const formattedUTCDate = DateTime.utc().toFormat("yyyy-LL-dd HH:mm:ss");
        const historyData = {
            source: "Online Meeting Conversion",
            date: formattedUTCDate,
            data: data,
            language: detectLanguage,
            audio_id: audioID,
        };
        addToast("success", "Saved/Downloaded meeting notes");
        
        // Optional: Clear localStorage after successful save
        // localStorage.removeItem(storageKey);
    };

    return (
        <section className="relative min-h-screen w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
                {/* Animated background elements */}
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
                    <div className="absolute top-3/4 left-1/3 w-60 h-60 bg-pink-300 dark:bg-pink-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1500"></div>
                </div>

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-10 dark:opacity-5">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(120,119,198,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(120,119,198,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
                </div>
            </div>

            <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll">
                <div className="min-h-screen lg:px-4 md:px-4 px-4 py-20 lg:py-28 flex flex-col md:gap-12 gap-8 container mx-auto lg:max-w-[70vw] xl:max-w-[80vw] w-full">
                    <Breadcrumb items={breadcrumbItems} />
                    <div className="dark:bg-gray-800/70 bg-gray-100 md:p-8 p-4 rounded-2xl border dark:border-gray-700 border-white shadow-xl">
                        <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Meeting Summary
                        </h1>
                        {!showRealTable ?
                            <p className="text-sm md:text-base font-semibold mb-6 text-center bg-gradient-to-r from-blue-900 to-purple-950 dark:from-blue-100 dark:to-blue-200 bg-clip-text text-transparent">
                                You can now customize the headings for your Minutes of the Meeting (MOM) columns on this page. If you provide specific headings, your MOM will be generated accordingly. If no headings are provided, the default headings (as shown) will be used automatically.
                            </p>
                            :
                            <p className="text-sm md:text-base font-semibold mb-6 text-center bg-gradient-to-r from-blue-900 to-purple-950 dark:from-blue-100 dark:to-blue-200 bg-clip-text text-transparent">
                                You can now customize the Minutes of the Meeting (MOM) on this page and also can download.
                            </p>
                        }
                        {!showRealTable ? (

                            <div className="mt-6 w-full">
                                <TablePreview onSaveHeaders={(headers) => handleSaveHeaders(headers, audioID, updatedMeetingId, uploadedUserId)} isSending={isSending} />
                            </div>
                        ) : (
                            <RealTablePreview showFullData={showFullData} detectLanguage={detectLanguage} onSaveTable={(data, downloadOptions) => HandleSaveTable(data, downloadOptions)} />
                        )}
                    </div>
                </div>
                <Footer />
            </div>
            <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-float"></div>
            <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
            <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
            <div className="absolute bottom-32 right-32 w-5 h-5 bg-green-400 rounded-full opacity-40 animate-float animation-delay-1500"></div>
            <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-yellow-400 rounded-full opacity-50 animate-float animation-delay-3000"></div>
        </section>
    );
}