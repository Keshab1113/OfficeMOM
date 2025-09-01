import { useState, useEffect } from "react";
import Footer from "../../components/Footer/Footer"
import { cn } from "../../lib/utils";
import { Helmet } from "react-helmet";


const Home = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    "AI-Powered Transcription",
    "Smart Formatting", 
    "Action Item Detection",
    "Instant Summaries"
  ];

  return (
      <section className="relative flex h-full min-h-screen md:w-full w-screen items-center justify-center dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)] overflow-hidden">
        
        {/* Animated background grid */}
        <div
          className={cn(
            "absolute inset-0 opacity-30",
            "[background-size:40px_40px]",
            "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]",
            "[background-image:radial-gradient(#e0e0e0_1px,transparent_1px)]",
            "animate-pulse"
          )}
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-600/20 blur-3xl animate-pulse"
            style={{
              top: '10%',
              left: '10%',
              transform: `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.05}px)`,
              animation: 'float 6s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-600/20 blur-3xl animate-pulse"
            style={{
              bottom: '20%',
              right: '15%',
              transform: `translate(${-mousePosition.x * 0.03}px, ${-mousePosition.y * 0.03}px)`,
              animation: 'float 8s ease-in-out infinite reverse'
            }}
          />
        </div>

        {/* Radial gradient overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]"></div>
        
        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll">
          <div className="min-h-screen flex flex-col justify-center items-center px-4 py-20">
            
            {/* Main heading with staggered animation */}
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="relative text-center z-20 dark:bg-gradient-to-b dark:from-neutral-200 dark:to-neutral-500 bg-gradient-to-br from-black via-blue-600 to-blue-500 bg-clip-text text-[34px] font-bold text-transparent md:text-6xl leading-tight">
                Welcome to Office<span className="text-blue-400 animate-pulse">MoM</span>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-lg blur opacity-75 animate-pulse"></div>
              </h1>
            </div>

            {/* Subtitle with delay */}
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <p className="md:mt-6 mt-3 md:max-w-full max-w-[90%] text-center relative z-20 bg-gradient-to-b dark:from-white from-black to-blue-500 bg-clip-text text-base font-bold text-transparent md:text-2xl">
                Automate Meeting Minutes Seamlessly
              </p>
            </div>

            {/* Feature pills */}
            <div className={`md:mt-12 mt-8 flex flex-wrap justify-center gap-3 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {features.map((feature, index) => (
                <div
                  key={feature}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30 text-blue-400 text-sm font-medium hover:scale-105 transition-transform duration-300 cursor-pointer"
                  style={{
                    animationDelay: `${index * 200}ms`,
                    animation: 'fadeInUp 0.8s ease-out forwards'
                  }}
                >
                  {feature}
                </div>
              ))}
            </div>

            {/* Main description with enhanced styling */}
            <div className={`md:mt-16 mt-12 relative max-w-[90%] md:max-w-[80%] text-center transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/5 to-purple-600/5 rounded-2xl blur-xl"></div>
              <p className="relative z-20 bg-gradient-to-b dark:from-white from-black to-blue-500 bg-clip-text text-lg font-medium text-transparent md:text-xl leading-relaxed">
                Automate meeting minutes seamlessly with AI-powered transcription
                and smart formatting. Capture every detail without lifting a pen,
                from key points to action items. Get organized summaries
                instantly, ready to share with your team. Save time, improve
                accuracy, and keep every meeting productive.
              </p>
            </div>

            {/* Floating particles effect */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 3}s`
                  }}
                />
              ))}
            </div>
          </div>
          <Footer />
        </div>
      </section>
    
  );
};

export default Home;