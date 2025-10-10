import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  ChevronDown,
  Mic,
  FileText,
  Users,
  Clock,
  CheckCircle,
  Zap,
  Shield,
  Globe,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import Footer from "../../components/Footer/Footer";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb"

const breadcrumbItems = [
    { label: "AboutUs" }
  ];

export default function AboutUs() {
  const [isVisible, setIsVisible] = useState({});
  const [activeFeature, setActiveFeature] = useState(0);
  const nav = useNavigate();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll("[id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Mic,
      title: "AI Transcription",
      desc: "Real-time voice-to-text with 99% accuracy",
    },
    {
      icon: FileText,
      title: "Smart Formatting",
      desc: "Auto-organized summaries and action items",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      desc: "Share and collaborate on meeting notes",
    },
    {
      icon: Clock,
      title: "Time Saving",
      desc: "Reduce meeting overhead by 70%",
    },
  ];

  const stats = [
    { number: "10M+", label: "Minutes Transcribed" },
    { number: "50K+", label: "Happy Users" },
    { number: "99.2%", label: "Accuracy Rate" },
    { number: "70%", label: "Time Saved" },
  ];

  const benefits = [
    "Never miss important discussion points",
    "Automatic action item extraction",
    "Multi-language support for global teams",
    "Integration with popular productivity tools",
    "Secure cloud storage with enterprise encryption",
    "Real-time collaboration and editing",
  ];

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | AboutUs</title>
        <link rel="canonical" href="https://officemom.me/about-us" />
      </Helmet>
      <section className="relative h-full min-h-screen md:w-full w-screen dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]">
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:20px_20px]",
            "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
          )}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)]"></div>
        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll ">
          <div className=" min-h-screen flex flex-col md:gap-20 gap-10">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 text-gray-800 dark:text-gray-100 overflow-hidden">
              {/* Animated Background Elements */}
              <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 dark:bg-indigo-800 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
              </div>
                <Breadcrumb items={breadcrumbItems} />
              {/* Hero Section */}
              <section
                id="hero"
                className={`relative flex justify-center items-center px-6 py-20 md:px-20 transform transition-all duration-1000 h-screen ${
                  isVisible.hero
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
              >
                <div className="max-w-6xl mx-auto text-center">
                  <div className="inline-block mb-6 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold animate-bounce">
                    🚀 AI-Powered Meeting Intelligence
                  </div>

                  <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                    Welcome to {" "}
                    <span className="">
                      OfficeMoM
                      <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transform scale-x-0 animate-[scaleX_1s_ease-in-out_0.5s_forwards]"></div>
                    </span>
                  </h1>

                  <h2 className="text-2xl md:text-3xl font-semibold text-gray-600 dark:text-gray-300 mb-8 animate-fade-in-up delay-300">
                    Transform Meetings into Actionable Insights
                  </h2>

                  <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-12 max-w-3xl mx-auto animate-fade-in-up delay-500">
                    Experience the future of meeting management with AI-powered
                    transcription, intelligent summarization, and seamless
                    collaboration. Turn every conversation into organized,
                    actionable documentation.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-700">
                    <button onClick={() => nav(token?"/meeting":"/login")} className=" cursor-pointer group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
                      <span className="relative z-10 flex items-center">
                        Get Started Free
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>

                    <button onClick={() => nav(token?"/meeting":"/login")} className=" cursor-pointer inline-flex items-center justify-center px-8 py-4 border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all duration-300 transform hover:scale-105">
                      Watch Demo
                    </button>
                  </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                  <ChevronDown className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
              </section>

              {/* Features Carousel */}
              <section
                id="features"
                className={`py-20 px-6 md:px-20 transform transition-all duration-1000 delay-200 ${
                  isVisible.features
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
              >
                <div className="max-w-6xl mx-auto">
                  <h3 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent">
                    Powerful Features
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className={`relative group p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transform transition-all duration-500 hover:scale-105 ${
                          activeFeature === index
                            ? "ring-2 ring-blue-500 shadow-blue-200 dark:shadow-blue-800"
                            : ""
                        }`}
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                          <div
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                              activeFeature === index
                                ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-purple-500 group-hover:text-white"
                            }`}
                          >
                            <feature.icon className="w-8 h-8" />
                          </div>
                          <h4 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">
                            {feature.title}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {feature.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Stats Section */}
              <section
                id="stats"
                className={`py-20 px-6 md:px-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transform transition-all duration-1000 delay-400 ${
                  isVisible.stats
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
              >
                <div className="max-w-6xl mx-auto">
                  <h3 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent">
                    Trusted by Teams Worldwide
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                      <div key={index} className="text-center group">
                        <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 transform group-hover:scale-110 transition-transform duration-300">
                          {stat.number}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 font-medium">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Benefits Section */}
              <section
                id="benefits"
                className={`py-20 px-6 md:px-20 transform transition-all duration-1000 delay-600 ${
                  isVisible.benefits
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
              >
                <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                      <h3 className="text-4xl font-bold mb-8 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent">
                        Why Choose OfficeMoM?
                      </h3>

                      <div className="space-y-4">
                        {benefits.map((benefit, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-4 group hover:bg-white/50 dark:hover:bg-gray-800/50 p-4 rounded-xl transition-all duration-300 hover:shadow-md"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mt-1">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                              {benefit}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white transform hover:scale-105 transition-all duration-300 shadow-2xl">
                        <div className="flex items-center mb-6">
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                            <Zap className="w-6 h-6" />
                          </div>
                          <h4 className="text-2xl font-bold">
                            Enterprise Ready
                          </h4>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center">
                            <Shield className="w-5 h-5 mr-3" />
                            <span>SOC 2 Type II Compliant</span>
                          </div>
                          <div className="flex items-center">
                            <Globe className="w-5 h-5 mr-3" />
                            <span>99.9% Uptime SLA</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-5 h-5 mr-3" />
                            <span>24/7 Premium Support</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* About Our Mission */}
              <section
                id="mission"
                className={`py-20 px-6 md:px-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white transform transition-all duration-1000 delay-800 ${
                  isVisible.mission
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
              >
                <div className="max-w-4xl mx-auto text-center">
                  <h3 className="text-4xl font-bold mb-8">Our Mission</h3>
                  <p className="text-xl leading-relaxed mb-8 text-blue-100">
                    We believe that meetings should drive action, not paperwork.
                    OfficeMoM was born from the frustration of countless hours
                    spent manually transcribing and organizing meeting notes.
                    Our AI-powered platform transforms the way teams capture,
                    process, and act on meeting information.
                  </p>
                  <p className="text-lg leading-relaxed text-blue-100">
                    By automating the tedious parts of meeting documentation, we
                    free up your team to focus on what matters most: making
                    decisions, driving progress, and achieving your goals. Join
                    thousands of teams who have already transformed their
                    meeting culture with OfficeMoM.
                  </p>
                </div>
              </section>

              {/* CTA Section */}
              <section
                id="cta"
                className={`py-20 px-6 md:px-20 bg-gray-50 dark:bg-gray-800 transform transition-all duration-1000 delay-1000 ${
                  isVisible.cta
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
              >
                <div className="max-w-4xl mx-auto text-center">
                  <h3 className="text-4xl font-bold mb-8 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-100 bg-clip-text text-transparent">
                    Ready to Transform Your Meetings?
                  </h3>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
                    Start your free trial today and experience the future of
                    meeting management.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <button onClick={() => nav(token?"/meeting":"/login")} className=" cursor-pointer group relative inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
                      <span className="relative z-10 flex items-center">
                        Start Free Trial
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    <button onClick={() => nav(token?"/meeting":"/login")} className=" cursor-pointer inline-flex items-center justify-center px-10 py-5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold text-lg rounded-xl hover:border-blue-600 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 transform hover:scale-105">
                      Schedule Demo
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
                    No credit card required • Unlimited free trial • Cancel
                    anytime
                  </p>
                </div>
              </section>
            </div>
          </div>
          <Footer />
        </div>
      </section>
    </>
  );
}
