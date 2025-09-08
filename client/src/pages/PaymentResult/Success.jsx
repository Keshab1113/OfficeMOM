import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const Success = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState([]);
  const nav = useNavigate();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    setIsVisible(true);

    // Generate floating particles
    const particleArray = [];
    for (let i = 0; i < 20; i++) {
      particleArray.push({
        id: i,
        left: Math.random() * 100,
        animationDelay: Math.random() * 3,
        size: Math.random() * 8 + 4,
      });
    }
    setParticles(particleArray);
  }, []);

  return (
    <div className="relative md:max-h-screen min-h-screen md:min-h-full 
      bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 
      dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
      overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Floating particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-emerald-300 dark:bg-emerald-600 
              rounded-full opacity-60 animate-bounce"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.animationDelay}s`,
              animationDuration: "3s",
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
          />
        ))}

        {/* Gradient orbs */}
        <div className="absolute top-20 left-20 w-64 h-64 
          bg-gradient-to-r from-emerald-300 to-teal-300 dark:from-emerald-700 dark:to-teal-700 
          rounded-full opacity-20 animate-pulse"
        ></div>
        <div
          className="absolute bottom-20 right-20 w-96 h-96 
            bg-gradient-to-r from-cyan-300 to-emerald-300 dark:from-cyan-700 dark:to-emerald-700 
            rounded-full opacity-15 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
        <div
          className={`text-center transform transition-all duration-1000 ${
            isVisible
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-10 opacity-0 scale-95"
          }`}
        >
          {/* Success icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 
                bg-gradient-to-r from-emerald-400 to-teal-500 
                dark:from-emerald-600 dark:to-teal-700 
                rounded-full flex items-center justify-center shadow-2xl animate-pulse"
              >
                <svg
                  className="w-12 h-12 sm:w-16 sm:h-16 text-white animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              {/* Ripple */}
              <div className="absolute inset-0 rounded-full 
                bg-emerald-400 dark:bg-emerald-600 
                opacity-25 animate-ping"
              ></div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold 
            bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 
            dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 
            bg-clip-text text-transparent mb-6 leading-tight"
          >
            Payment Successful!
          </h1>

          {/* Subheading */}
          <div className="mb-8">
            <p className="text-xl sm:text-2xl lg:text-3xl 
              text-emerald-700 dark:text-emerald-400 font-semibold mb-2 animate-fade-in"
            >
              🎉 Welcome aboard! 🚀
            </p>
            <p className="text-base sm:text-lg 
              text-emerald-600 dark:text-emerald-300 
              max-w-md mx-auto opacity-90"
            >
              Your journey begins now. Get ready for an amazing experience!
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => nav(token ? "/meeting" : "/login")}
              className="group cursor-pointer relative px-8 py-4 
                bg-gradient-to-r from-emerald-500 to-teal-600 
                dark:from-emerald-600 dark:to-teal-700
                text-white font-semibold rounded-full shadow-xl hover:shadow-2xl 
                transform hover:scale-105 transition-all duration-300 ease-out"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 
                bg-gradient-to-r from-emerald-600 to-teal-700 
                dark:from-emerald-700 dark:to-teal-800 
                rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              ></div>
            </button>

            <button
              onClick={() => nav(token ? "/documentation" : "/login")}
              className="px-8 cursor-pointer py-4 border-2 border-emerald-500 
                dark:border-emerald-400 
                text-emerald-600 dark:text-emerald-300 
                font-semibold rounded-full hover:bg-emerald-50 dark:hover:bg-gray-800 
                transform hover:scale-105 transition-all duration-300 ease-out"
            >
              View Details
            </button>
          </div>

          {/* Progress indicator */}
          <div className="mt-12 max-w-xs mx-auto">
            <div className="flex items-center justify-between text-sm 
              text-emerald-600 dark:text-emerald-300 mb-2"
            >
              <span>Setup Progress</span>
              <span>Complete!</span>
            </div>
            <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600 
                  dark:from-emerald-400 dark:to-teal-500 
                  rounded-full animate-pulse"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating emoji elements */}
      <div className="absolute top-10 right-10 text-6xl animate-spin-slow opacity-20 dark:opacity-30">
        ⭐
      </div>
      <div
        className="absolute bottom-10 left-10 text-4xl animate-bounce opacity-30 dark:opacity-40"
        style={{ animationDelay: "0.5s" }}
      >
        🎈
      </div>
      <div
        className="absolute top-1/3 left-10 text-3xl animate-pulse opacity-25 dark:opacity-40"
        style={{ animationDelay: "1s" }}
      >
        ✨
      </div>
      <div
        className="absolute bottom-1/3 right-10 text-5xl animate-bounce opacity-20 dark:opacity-35"
        style={{ animationDelay: "1.5s" }}
      >
        🎊
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out 0.5s both;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Success;
