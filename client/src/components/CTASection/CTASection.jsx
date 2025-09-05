import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const CTASection = () => {
  const [hoveredButton, setHoveredButton] = useState(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const nav = useNavigate();
  const { token } = useSelector((state) => state.auth);

  return (
    <div className=" relative overflow-hidden">
      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 dark:bg-gray-900 bg-gray-50 opacity-95"></div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="transform hover:scale-105 transition-transform duration-500">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black dark:text-white mb-8 leading-tight">
              <span className="inline-block animate-bounce animation-delay-200">
                Ready
              </span>{" "}
              <span className="inline-block animate-bounce animation-delay-400">
                to
              </span>{" "}
              <span className="inline-block animate-bounce animation-delay-600 bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                Transform
              </span>
              <br />
              <span className="inline-block animate-bounce animation-delay-800">
                Your
              </span>{" "}
              <span className="inline-block animate-bounce animation-delay-1000 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Workflow?
              </span>
            </h2>
          </div>

          <div className="transform hover:scale-105 transition-transform duration-700">
            <p className="text-xl sm:text-2xl dark:text-purple-100 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Join{" "}
              <span className="font-bold text-yellow-300 animate-pulse">
                10,000+
              </span>{" "}
              professionals who've revolutionized their transcription workflow
              with{" "}
              <span className="font-semibold text-cyan-300">OfficeMoM</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <button
              onMouseEnter={() => setHoveredButton("trial")}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => nav(token?"/meeting":"/login")}
              className="group relative cursor-pointer px-10 py-5 bg-white text-purple-600 rounded-2xl font-bold text-lg overflow-hidden transition-all duration-500 hover:scale-110 shadow-2xl hover:shadow-purple-500/25"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-white group-hover:bg-opacity-90 transition-all duration-500"></div>
              <span className="relative z-10 group-hover:text-purple-700 transition-colors duration-300">
                🚀 Start Free Trial
              </span>
              {hoveredButton === "trial" && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400 to-pink-400 opacity-20 animate-pulse"></div>
              )}
            </button>

            <button
              onMouseEnter={() => setHoveredButton("sales")}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => nav("/contact-us")}
              className="group relative cursor-pointer px-10 py-5 bg-transparent dark:text-white border-2 border-white/40 rounded-2xl font-bold text-lg backdrop-blur-sm transition-all duration-500 hover:scale-110 hover:bg-white/20 hover:border-white/80 shadow-xl"
            >
              <span className="relative z-10 dark:group-hover:text-cyan-200 transition-colors duration-300">
                💬 Contact Sales
              </span>
              {hoveredButton === "sales" && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-400 opacity-20 animate-pulse"></div>
              )}
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 dark:text-purple-200 text-sm opacity-80">
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-green-400">✅</span>
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2 animate-fade-in animation-delay-500">
              <span className="text-yellow-400">⭐</span>
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2 animate-fade-in animation-delay-1000">
              <span className="text-blue-400">🔒</span>
              <span>Enterprise Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-blue-100 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-16">
            <h2 className="text-4xl pb-4 sm:text-5xl lg:text-6xl font-black text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text mb-6 animate-gradient">
              Experience the Magic
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Watch how OfficeMoM transforms chaos into clarity with{" "}
              <span className="font-bold text-purple-600 dark:text-purple-400">
                AI-powered precision
              </span>{" "}
              and{" "}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                lightning-fast processing
              </span>
            </p>
          </div>

          {/* Video Container with Enhanced Styling */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>

            <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-2xl transform group-hover:scale-105 transition-all duration-700">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-inner bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                {!videoLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                      <p className="text-gray-600 dark:text-gray-300 font-medium">
                        Loading amazing demo...
                      </p>
                    </div>
                  </div>
                )}

                <iframe
                  className={`w-full h-full transition-opacity duration-500 ${
                    videoLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&controls=1&showinfo=0&modestbranding=1"
                  title="OfficeMoM Demo - Revolutionary Transcription"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setVideoLoaded(true)}
                ></iframe>
              </div>

              {/* Video Stats */}
              <div className="flex justify-center mt-6 gap-8 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span>2 min demo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  <span>Real-time features</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                  <span>Live workflow</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {[
              {
                icon: "🚀",
                title: "Lightning Fast",
                description: "Process hours of audio in minutes",
                delay: "animation-delay-200",
              },
              {
                icon: "🎯",
                title: "99% Accurate",
                description: "AI-powered precision transcription",
                delay: "animation-delay-400",
              },
              {
                icon: "🔧",
                title: "Easy Integration",
                description: "Seamlessly fits your workflow",
                delay: "animation-delay-600",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`group p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 ${feature.delay}`}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CTASection;
