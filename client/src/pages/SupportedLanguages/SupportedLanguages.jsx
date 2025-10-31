import { useState } from "react";
import { Helmet } from "react-helmet";
import { Check, Globe, Mic, Languages, Zap, Users, Star } from "lucide-react";
import Footer from "../../components/Footer/Footer";
import { useNavigate } from "react-router-dom";
import { languageRegions, languages, multilingualStreaming } from "../../components/Language";

const SupportedLanguages = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("all");
    const navigate = useNavigate();

    const regions = {
        all: "All Languages",
        europe: "European",
        asia: "Asian",
        americas: "Americas",
        africa: "African",
        middleEast: "Middle Eastern",
        pacific: "Pacific"
    };

    const filteredLanguages = languages.filter(language => {
        const matchesSearch = language.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = selectedRegion === "all" || languageRegions[selectedRegion]?.includes(language);
        return matchesSearch && matchesRegion;
    });

    const getLanguageFlag = (language) => {
        const flagEmojis = {
            "Global English": "🌍", "Australian English": "🇦🇺", "British English": "🇬🇧", "US English": "🇺🇸",
            "Spanish": "🇪🇸", "French": "🇫🇷", "German": "🇩🇪", "Italian": "🇮🇹", "Portuguese": "🇵🇹",
            "Dutch": "🇳🇱", "Hindi": "🇮🇳", "Japanese": "🇯🇵", "Chinese": "🇨🇳", "Finnish": "🇫🇮",
            "Korean": "🇰🇷", "Polish": "🇵🇱", "Russian": "🇷🇺", "Turkish": "🇹🇷", "Ukrainian": "🇺🇦",
            "Vietnamese": "🇻🇳", "Arabic": "🇸🇦", "Hebrew": "🇮🇱", "Greek": "🇬🇷", "Thai": "🇹🇭",
            "Swedish": "🇸🇪", "Norwegian": "🇳🇴", "Danish": "🇩🇰", "Indonesian": "🇮🇩", "Malay": "🇲🇾"
        };
        return flagEmojis[language] || "🌐";
    };

    return (
        <>
            <Helmet>
                <title>Smart Minutes of the Meeting (OfficeMoM) | Supported Languages</title>
                <meta name="description" content="Discover 102+ supported languages for real-time transcription and multilingual streaming. Global coverage with AI-powered accuracy." />
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
                {/* <Header /> */}
                {/* Main content */}
                <div className="relative z-10 overflow-y-auto max-h-screen">

                    <div className="relative z-10 container mx-auto px-4 py-8">
                        {/* Header Section */}
                        <div className="text-center mb-12">
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                                        <Languages className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-2 border-white animate-ping"></div>
                                </div>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 pb-4">
                                Supported Languages
                            </h1>
                            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                                Global coverage with 102+ languages for seamless real-time transcription and AI-powered meeting minutes
                            </p>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{languages.length}+</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Languages</div>
                                </div>
                                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">99%</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                                </div>
                                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">Real-time</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Processing</div>
                                </div>
                                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">6</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Multilingual Streams</div>
                                </div>
                            </div>
                        </div>

                        {/* Multilingual Streaming Section */}
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 mb-12 text-white shadow-2xl">
                            <div className="flex items-center mb-6">
                                <Zap className="w-8 h-8 mr-3 animate-pulse" />
                                <h2 className="text-2xl md:text-3xl font-bold">Multilingual Streaming</h2>
                            </div>
                            <p className="text-blue-100 text-lg mb-6 max-w-3xl">
                                Simultaneous real-time transcription in 6 major languages for global meetings and conferences
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {multilingualStreaming.map((language, index) => (
                                    <div
                                        key={language}
                                        className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/30 transform hover:scale-105 transition-all duration-300 animate-fade-in-up"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="text-2xl mb-2">{getLanguageFlag(language)}</div>
                                        <div className="font-semibold text-white">{language}</div>
                                        <div className="flex justify-center mt-2">
                                            <Star className="w-4 h-4 text-yellow-300 fill-current" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Search and Filter Section */}
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-6 mb-8 shadow-lg border border-white/20">
                            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                                <div className="flex-1 w-full">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search languages..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full dark:text-white pl-12 pr-4 py-3 bg-white/50 dark:bg-slate-700/50 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                        />
                                        <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(regions).map(([key, label]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedRegion(key)}
                                            className={`px-4 py-2 cursor-pointer rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${selectedRegion === key
                                                ? "bg-blue-500 text-white shadow-lg"
                                                : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600"
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Languages Grid */}
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
                            <div className="flex items-center mb-6">
                                <Mic className="w-6 h-6 mr-2 text-blue-500" />
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                    All Supported Languages ({filteredLanguages.length})
                                </h2>
                            </div>

                            {filteredLanguages.length === 0 ? (
                                <div className="text-center py-12">
                                    <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                        No languages found
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-500">
                                        Try adjusting your search or filter criteria
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredLanguages.map((language, index) => (
                                        <div
                                            key={language}
                                            className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-fade-in-up"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-2xl dark:text-white">{getLanguageFlag(language)}</span>
                                                <Check className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            </div>

                                            <h3 className="font-semibold text-gray-800 dark:text-white mb-1 text-sm">
                                                {language}
                                            </h3>

                                            {multilingualStreaming.some(lang => language.includes(lang)) && (
                                                <div className="flex items-center mt-2">
                                                    <Zap className="w-3 h-3 text-yellow-500 mr-1" />
                                                    <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                                        Multilingual Streaming
                                                    </span>
                                                </div>
                                            )}

                                            {/* Hover effect background */}
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300"></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Features Section */}
                        <div className="grid md:grid-cols-3 gap-6 mt-12">
                            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Globe className="w-6 h-6 text-blue-500" />
                                </div>
                                <h3 className="font-bold text-gray-800 dark:text-white mb-2">Global Coverage</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Support for 102+ languages covering every major region and dialect worldwide
                                </p>
                            </div>

                            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Zap className="w-6 h-6 text-green-500" />
                                </div>
                                <h3 className="font-bold text-gray-800 dark:text-white mb-2">Real-time Processing</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Instant transcription with 99% accuracy powered by advanced AI algorithms
                                </p>
                            </div>

                            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-6 h-6 text-purple-500" />
                                </div>
                                <h3 className="font-bold text-gray-800 dark:text-white mb-2">Team Collaboration</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Perfect for international teams and global business meetings
                                </p>
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="text-center mt-12">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
                                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                                    Ready to Transform Your Meetings?
                                </h2>
                                <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
                                    Start using our AI-powered transcription in 102+ languages today
                                </p>
                                <button onClick={()=>navigate("/")} className="bg-white cursor-pointer text-blue-600 px-8 py-3 rounded-2xl font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg">
                                    Get Started Free
                                </button>
                            </div>
                        </div>
                    </div>
                    <Footer />
                </div>
            </section>
        </>
    );
};

export default SupportedLanguages;