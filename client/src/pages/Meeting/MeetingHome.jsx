import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Timing from "../../components/Timing/Timing";
import { FcConferenceCall } from "react-icons/fc";
import { Video, Users, BrushCleaning, Play } from "lucide-react";
import AllHistory from "../../components/History/History";
import MeetingInstruction from "../../components/MeetingInstructions/MeetingInstruction";
import MeetingFeatures from "../../components/MeetingInstructions/MeetingFeatures";
import Footer from "../../components/Footer/Footer";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";

const meetingPlatforms = [
    { 
        name: "Google Meet", 
        icon: "/Icons/meet.svg", 
        match: "meet.google.com",
        color: "bg-green-500",
        description: "Secure video meetings for teams"
    },
    { 
        name: "Zoom", 
        icon: "/Icons/zoom.svg", 
        match: "zoom.us",
        color: "bg-blue-500",
        description: "Video conferencing and webinars"
    },
    { 
        name: "Microsoft Teams", 
        icon: "/Icons/teams.png", 
        match: "teams.microsoft.com",
        color: "bg-purple-500",
        description: "Collaboration and communication platform"
    },
    { 
        name: "Other Meeting", 
        icon: "/Icons/other.webp", 
        match: "",
        color: "bg-gray-500",
        description: "Any other meeting platform"
    },
];

const breadcrumbItems = [{ label: "Online Meeting" }];

export default function MeetingHome() {
    const [activeTab, setActiveTab] = useState(1);
    const [meetingLink, setMeetingLink] = useState("");
    const [activePlatform, setActivePlatform] = useState(null);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const value = e.target.value.trim();
        setMeetingLink(value);
        if (value === "") {
            setActivePlatform(null);
            return;
        }
        const matched = meetingPlatforms.find((p) => p.match && value.includes(p.match));
        if (matched) setActivePlatform(matched.name);
        else setActivePlatform("Other Meeting");
    };

    const startMeeting = async () => {
        if (!meetingLink) {
            alert("Please paste a meeting link");
            return;
        }
        
        if (!navigator.mediaDevices?.getUserMedia) {
            alert("Your browser doesn't support audio recording");
            return;
        }

        const id = uuidv4();
        navigate(`/meeting/${id}`, { 
            state: { 
                meetingLink,
                activePlatform
            }
        });
    };

    return (
        <section className="relative min-h-screen w-full overflow-hidden">
        {/* Enhanced Background */}
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

            <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll lg:pb-0 pb-10">
                <Breadcrumb items={breadcrumbItems} />
                <div className="min-h-screen container mx-auto px-4">
                    <div className="text-center mb-8 mt-10 px-4">
                        <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 pb-1 lg:pb-3">
                            Smart Meeting Assistant
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            Transform your meetings with AI-powered transcription, automatic minutes, and actionable insights
                        </p>
                    </div>

                    <div className="h-full w-full flex flex-col gap-6 lg:gap-10 pb-10">
                        <div className="w-full">
                            <Timing />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full">
                            <div className="lg:col-span-2 w-full">
                                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-white/20">
                                    <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 mb-4 sm:mb-6">
                                        <button
                                            onClick={() => setActiveTab(1)}
                                            className={`flex-1 cursor-pointer py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all flex items-center justify-center text-sm sm:text-base ${activeTab === 1
                                                ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-md transform"
                                                : "text-gray-600 dark:text-gray-300 hover:text-indigo-600"
                                                }`}
                                        >
                                            <Video className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                                            <span className="hidden md:inline">Meeting Link</span>
                                            <span className="md:hidden">Link</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab(2)}
                                            className={`flex-1 cursor-pointer py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all flex items-center justify-center text-sm sm:text-base ${activeTab === 2
                                                ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-md transform"
                                                : "text-gray-600 dark:text-gray-300 hover:text-indigo-600"
                                                }`}
                                        >
                                            <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                                            <span className="hidden md:inline">ID & Password</span>
                                            <span className="md:hidden">ID & Pass</span>
                                        </button>
                                    </div>

                                    <div className="space-y-4 sm:space-y-6">
                                        {activeTab === 1 && (
                                            <div className="space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                    <h1 className="text-gray-600 dark:text-white text-lg sm:text-xl flex items-center">
                                                        <FcConferenceCall className="mr-2" />
                                                        Paste meeting URL
                                                    </h1>
                                                    <span className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-2 py-1 rounded-full self-start sm:self-center sm:ml-2">
                                                        Recommended
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                                    {meetingPlatforms.map((platform) => (
                                                        <div
                                                            key={platform.name}
                                                            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all cursor-pointer bg-gray-200 dark:bg-slate-700 hover:scale-105 ${activePlatform === platform.name ? "ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-800" : ""}`}
                                                            onClick={() => {
                                                                setActivePlatform(platform.name);
                                                                if (platform.match) setMeetingLink(`https://${platform.match}/...`);
                                                            }}
                                                        >
                                                            <img src={platform.icon} alt={platform.name} className="h-6 w-6 sm:h-8 sm:w-8" />
                                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                                                                {platform.name}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex items-center border border-gray-500 rounded-lg p-3 w-full bg-white/50 dark:bg-slate-700/50">
                                                    <FcConferenceCall className="text-blue-500 text-lg sm:text-xl mr-2" />
                                                    <input
                                                        type="text"
                                                        placeholder="Paste your meeting link here..."
                                                        className="flex-1 outline-none bg-transparent text-gray-700 dark:text-white py-1 placeholder-gray-500 dark:placeholder-gray-400"
                                                        value={meetingLink}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>

                                                {activePlatform && (
                                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                        <p className="text-sm text-blue-800 dark:text-blue-300">
                                                            <span className="font-semibold">{activePlatform}</span> detected. Make sure you've joined the meeting before starting transcription.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 2 && (
                                            <div className="min-h-48 sm:min-h-60 flex flex-col justify-center items-center py-4">
                                                <div className="relative text-center">
                                                    <div className="absolute -inset-3 sm:-inset-4">
                                                        <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-full opacity-70 animate-ping"></div>
                                                        <div className="absolute top-0 right-0 w-4 h-4 sm:w-6 sm:h-6 bg-blue-500 rounded-full opacity-60 animate-ping animation-delay-1000"></div>
                                                        <div className="absolute bottom-0 left-0 w-5 h-5 sm:w-7 sm:h-7 bg-green-500 rounded-full opacity-80 animate-ping animation-delay-1500"></div>
                                                    </div>

                                                    <div className="relative z-10 text-center">
                                                        <div className="flex justify-center mb-3 sm:mb-4">
                                                            <div className="relative">
                                                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-spin">
                                                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white dark:bg-gray-800 rounded-full"></div>
                                                                </div>
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <svg
                                                                        className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400 animate-pulse"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">
                                                            Coming Soon!
                                                        </h1>
                                                        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 max-w-md px-2">
                                                            We're currently working on direct meeting integration. For now, please use the meeting link option above.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 1 && (
                                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                                                <button
                                                    onClick={startMeeting}
                                                    disabled={!meetingLink}
                                                    className="flex-1 py-3 sm:py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform  shadow-lg shadow-green-500/25 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
                                                >
                                                    <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    Start Transcription
                                                </button>

                                                <button
                                                    onClick={() => { setMeetingLink(""); setActivePlatform(null); }}
                                                    className="px-4 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-300 transform  flex items-center justify-center gap-2 text-sm sm:text-base"
                                                >
                                                    <BrushCleaning className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    Clear
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-1 w-full">
                                <div className="h-80 sm:h-96 lg:h-[27rem] w-full">
                                    <AllHistory NeedFor={"Online Meeting Conversion"} height="100%" />
                                </div>
                            </div>
                        </div>

                        <div className="w-full">
                            <MeetingInstruction needFor={"Online Meeting Conversion"} />
                        </div>

                        <MeetingFeatures />
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