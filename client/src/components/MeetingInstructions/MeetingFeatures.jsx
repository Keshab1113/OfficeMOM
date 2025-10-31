
import { Mic, Shield, Zap, Clock, } from "lucide-react";
const MeetingFeatures = () => {
    const features = [
        {
            icon: <Mic className="w-6 h-6" />,
            title: "Real-time Transcription",
            description: "Automatic speech-to-text conversion as you speak"
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: "AI-Powered Summaries",
            description: "Smart meeting minutes with action items"
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Secure & Private",
            description: "Your data is encrypted and never stored unnecessarily"
        },
        {
            icon: <Clock className="w-6 h-6" />,
            title: "Time Saving",
            description: "Reduce meeting documentation time by 80%"
        }
    ];
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 container mx-auto lg:px-0">
            {features.map((feature, index) => (
                <div
                    key={index}
                    className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                    style={{ animationDelay: `${500 + index * 100}ms` }}
                >
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white mb-4 mx-auto">
                        {feature.icon}
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-center">
                        {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
                        {feature.description}
                    </p>
                </div>
            ))}
        </div>
    );
}
export default MeetingFeatures;