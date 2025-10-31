import { useState, useEffect, useRef } from "react";
import { Zap, CheckCircle, Link, Mic, MessageCircle, FileText, Download, Users, Clock, Sparkles, Rocket, Target } from "lucide-react";

const OnlineMeeting = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [loopCount, setLoopCount] = useState(1);
    const stepRefs = useRef([]);
    const containerRef = useRef(null);

    const steps = [
        {
            title: "Paste Meeting Link",
            description: "Copy and paste your meeting URL from any supported platform",
            icon: Link,
            color: "from-blue-500 to-cyan-500",
            duration: 3500,
            emoji: "🔗"
        },
        {
            title: "Start Recording",
            description: "Click start to begin capturing audio and generating live captions",
            icon: Mic,
            color: "from-green-500 to-emerald-500",
            duration: 3200,
            emoji: "🎙️"
        },
        {
            title: "Join Meeting",
            description: "Participate in your meeting normally while we handle transcription",
            icon: Users,
            color: "from-purple-500 to-violet-500",
            duration: 3400,
            emoji: "👥"
        },
        {
            title: "Real-time Transcription",
            description: "Watch as AI converts speech to text with live captions",
            icon: MessageCircle,
            color: "from-orange-500 to-red-500",
            duration: 3800,
            emoji: "📝"
        },
        {
            title: "AI Processing",
            description: "Smart algorithms analyze conversation and extract key insights",
            icon: Zap,
            color: "from-yellow-500 to-amber-500",
            duration: 4200,
            emoji: "🤖"
        },
        {
            title: "Generate MoM",
            description: "Get AI-powered meeting minutes with action items automatically",
            icon: FileText,
            color: "from-indigo-500 to-blue-500",
            duration: 3600,
            emoji: "📋"
        },
        {
            title: "Download & Share",
            description: "Easily download or share the meeting minutes with your team",
            icon: Download,
            color: "from-pink-500 to-rose-500",
            duration: 3200,
            emoji: "🚀"
        }
    ];

    // Auto scroll to active step
    useEffect(() => {
        if (stepRefs.current[currentStep]) {
            const element = stepRefs.current[currentStep];
            const container = containerRef.current;

            if (element && container) {
                const elementRect = element.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const relativeTop = elementRect.top - containerRect.top;
                const scrollTop = container.scrollTop + relativeTop - (window.innerWidth < 768 ? 80 : 100);

                container.scrollTo({
                    top: scrollTop,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentStep]);

    // Auto progression with continuous loop
    useEffect(() => {
        const currentStepDuration = steps[currentStep].duration;
        const progressIncrement = 100 / (currentStepDuration / 80);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    return 0;
                }
                return Math.min(prev + progressIncrement, 100);
            });
        }, 80);

        const stepTimeout = setTimeout(() => {
            if (currentStep === steps.length - 1) {
                setLoopCount(prev => prev + 1);
                setTimeout(() => {
                    if (containerRef.current) {
                        containerRef.current.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    }
                }, 100);
            }
            setCurrentStep(prev => (prev + 1) % steps.length);
            setProgress(0);
        }, currentStepDuration);

        return () => {
            clearInterval(progressInterval);
            clearTimeout(stepTimeout);
        };
    }, [currentStep]);

    const getStepStatus = (index) => {
        if (index === currentStep) return "active";
        if (index < currentStep) return "completed";
        return "upcoming";
    };

    return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/20 relative overflow-hidden w-full ">
            {/* Enhanced Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-10 -right-10 sm:-top-20 sm:-right-20 w-20 h-20 sm:w-40 sm:h-40 bg-blue-500/10 rounded-full animate-float-very-slow"></div>
                <div className="absolute -bottom-10 -left-10 sm:-bottom-20 sm:-left-20 w-20 h-20 sm:w-40 sm:h-40 bg-purple-500/10 rounded-full animate-float-very-slow animation-delay-3000"></div>
                <div className="absolute top-1/2 left-10 sm:left-1/4 w-10 h-10 sm:w-20 sm:h-20 bg-green-500/10 rounded-full animate-float-very-slow animation-delay-6000"></div>
                <div className="absolute bottom-5 right-1/4 sm:bottom-10 sm:right-1/3 w-8 h-8 sm:w-16 sm:h-16 bg-yellow-500/10 rounded-full animate-float-very-slow animation-delay-4500"></div>

                {/* Floating particles */}
                <div className="absolute top-5 left-5 sm:top-10 sm:left-10 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-float-slow animation-delay-1000"></div>
                <div className="absolute top-10 right-10 sm:top-20 sm:right-20 w-1 h-1 sm:w-1 sm:h-1 bg-purple-400 rounded-full animate-float-slow animation-delay-2000"></div>
                <div className="absolute bottom-10 left-10 sm:bottom-20 sm:left-20 w-1 h-1 sm:w-1 sm:h-1 bg-green-400 rounded-full animate-float-slow animation-delay-3000"></div>
                <div className="absolute bottom-5 right-5 sm:bottom-10 sm:right-10 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full animate-float-slow animation-delay-1500"></div>
            </div>

            {/* Enhanced Header */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
                <div className="flex items-center">
                    <div className="relative">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl animate-gradient-very-slow">
                            <Rocket className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-bounce-very-subtle" />
                        </div>
                        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-green-400 rounded-full border-2 border-white animate-ping-very-slow flex items-center justify-center">
                            <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                        </div>
                    </div>
                    <div className="ml-3 sm:ml-4">
                        <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-text-very-slow">
                            Smart Meeting Workflow
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1 flex items-center">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse-slow mr-2"></span>
                            Auto-demonstration
                        </p>
                    </div>
                </div>

                {/* Live Indicator */}
                <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-green-200 dark:border-green-800 self-start sm:self-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse-slow"></div>
                    <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">Live Demo</span>
                </div>
            </div>

            {/* Steps Container with Auto Scroll */}
            <div
                ref={containerRef}
                className="relative z-10 space-y-3 sm:space-y-4 max-h-64 sm:max-h-80 lg:max-h-96 overflow-y-auto pr-1 sm:pr-2 hide-scrollbar mb-4 sm:mb-6"
            >
                {steps.map((step, index) => {
                    const IconComponent = step.icon;
                    const status = getStepStatus(index);
                    const isActive = status === "active";
                    const isCompleted = status === "completed";

                    return (
                        <div
                            key={index}
                            ref={el => stepRefs.current[index] = el}
                            className={`group relative p-3 sm:p-4 mx-2 lg:mx-4 xl:mx-20 rounded-xl sm:rounded-2xl border-2 transition-all duration-500 transform ${
                                isActive
                                    ? "scale-101 sm:scale-102 bg-gradient-to-r from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-blue-300 dark:border-blue-600 shadow-lg sm:shadow-2xl"
                                    : isCompleted
                                    ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 shadow-md sm:shadow-lg scale-100"
                                    : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow scale-99 sm:scale-98"
                            } ${
                                isActive ? "animate-step-glow-slow" : ""
                            }`}
                        >
                            {/* Animated Connection Line - Hide on mobile */}
                            {index < steps.length - 1 && (
                                <div className={`hidden sm:block absolute top-1/2 left-full w-6 lg:w-8 h-0.5 transform -translate-y-1/2 z-0 ${
                                    isCompleted 
                                        ? "bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse-slow" 
                                        : "bg-gray-300 dark:bg-gray-600"
                                }`}>
                                    <div className={`absolute -right-1.5 lg:-right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 lg:w-4 lg:h-4 rounded-full ${
                                        isCompleted 
                                            ? "bg-green-400 animate-bounce-slow" 
                                            : "bg-gray-400"
                                    }`}></div>
                                </div>
                            )}

                            <div className="flex items-center">
                                {/* Enhanced Step Number/Icon */}
                                <div className={`relative flex-shrink-0 w-10 h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg sm:shadow-2xl transition-all duration-500 transform ${
                                    isActive 
                                        ? `bg-gradient-to-r ${step.color} scale-105 sm:scale-105 rotate-1 sm:rotate-2 animate-bounce-very-subtle` 
                                        : isCompleted 
                                        ? "bg-gradient-to-r from-green-400 to-emerald-500 scale-100" 
                                        : "bg-gray-300 dark:bg-gray-600 scale-95"
                                }`}>
                                    {isCompleted ? (
                                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white animate-checkmark-slow" />
                                    ) : (
                                        <IconComponent className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                                            isActive ? "text-white" : "text-gray-600 dark:text-gray-300"
                                        }`} />
                                    )}
                                    
                                    {/* Enhanced Pulsing Ring for Active Step */}
                                    {isActive && (
                                        <>
                                            <div className="absolute -inset-1.5 sm:-inset-2 border-2 border-blue-300/50 rounded-xl sm:rounded-2xl animate-ping-very-slow"></div>
                                            <div className="absolute -inset-1 sm:-inset-1 border border-white/30 rounded-xl sm:rounded-2xl animate-pulse-slow"></div>
                                        </>
                                    )}

                                    {/* Step Emoji */}
                                    <div className={`absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                                        isActive ? "scale-110 sm:scale-125 bg-white shadow-md sm:shadow-lg" : "bg-gray-200 dark:bg-gray-600"
                                    }`}>
                                        {step.emoji}
                                    </div>
                                </div>

                                {/* Enhanced Content */}
                                <div className="ml-3 sm:ml-4 lg:ml-6 flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                                        <h4 className={`text-sm sm:text-base  font-semibold transition-all duration-300 truncate ${
                                            isActive
                                                ? "text-gray-900 dark:text-white"
                                                : isCompleted
                                                ? "text-green-800 dark:text-green-300"
                                                : "text-gray-600 dark:text-gray-400"
                                        }`}>
                                            {step.title}
                                        </h4>
                                        
                                    </div>
                                    <p className={`mt-0 text-xs  transition-all duration-300 line-clamp-2 ${
                                        isActive
                                            ? "text-gray-700 dark:text-gray-300"
                                            : isCompleted
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-gray-500 dark:text-gray-500"
                                    }`}>
                                        {step.description}
                                    </p>
                                    
                                    {/* Step Progress Bar */}
                                    {isActive && (
                                        <div className="mt-2 sm:mt-3 lg:mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2 overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-200 ease-linear relative"
                                                style={{ width: `${progress}%` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-slow"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Enhanced Step Number */}
                                <div className={`ml-2 sm:ml-3 lg:ml-4 w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 shadow-md sm:shadow-lg ${
                                    isActive
                                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-105 sm:scale-110 animate-pulse-very-gentle"
                                        : isCompleted
                                        ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                                        : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                                }`}>
                                    {index + 1}
                                </div>
                            </div>

                            {/* Enhanced Active Step Glow */}
                            {isActive && (
                                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-step-glow-slow"></div>
                            )}

                            {/* Completion Celebration */}
                            {isCompleted && (
                                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 animate-fade-in-slow"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            

            {/* Enhanced Footer with Stats */}
            <div className="relative z-10 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-center">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-200 dark:border-blue-800 animate-float-very-subtle">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-500 mx-auto mb-1 sm:mb-2 animate-pulse-slow" />
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">2min</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Setup Time</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-green-200 dark:border-green-800 animate-float-very-subtle animation-delay-2000">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-500 mx-auto mb-1 sm:mb-2 animate-pulse-slow animation-delay-2000" />
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">99%</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Accuracy</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-purple-200 dark:border-purple-800 animate-float-very-subtle animation-delay-4000">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-500 mx-auto mb-1 sm:mb-2 animate-pulse-slow animation-delay-4000" />
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">Auto</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Formatting</div>
                    </div>
                </div>
            </div>

            {/* Enhanced Floating Animation Elements */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full animate-bounce-slow"></div>
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-bounce-slow animation-delay-2000"></div>
            <div className="absolute top-1/2 right-6 sm:right-10 w-1 h-1 bg-pink-400 rounded-full animate-ping-very-slow animation-delay-3000"></div>
            <div className="absolute bottom-1/3 left-4 sm:left-8 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-pulse-slow animation-delay-4000"></div>
        </div>
    );
};

export default OnlineMeeting;