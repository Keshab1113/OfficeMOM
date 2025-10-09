import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ToastContext";
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Shield,
} from "lucide-react";
import { Helmet } from "react-helmet";
import { MdDarkMode, MdLightMode } from "react-icons/md";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleSignupForm = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`, {
        fullName,
        email,
        password,
      });
      addToast("success", "Verification code sent to your email");
      setIsProcessing(false);
      setCurrentStep(2);
      setTimer(30);
      setCanResend(false);
    } catch (error) {
      setIsProcessing(false);
      const errors = error?.response?.data?.errors;
      if (Array.isArray(errors)) {
        errors.forEach((err) => addToast("error", err));
      } else {
        addToast(
          "error",
          error?.response?.data?.message || "Registration failed"
        );
      }
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
    if (e.key === "Enter") e.preventDefault();
  };

  const handleResendOtp = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/resend-otp`,
        { email }
      );
      addToast("success", "Verification code resent to your email");
      setOtp(["", "", "", "", "", ""]);
      setTimer(30);
      setCanResend(false);
    } catch (error) {
      addToast(
        "error",
        error?.response?.data?.message || "Failed to resend code"
      );
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      const otpString = otp.join("");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-otp`,
        {
          email,
          otp: otpString,
        }
      );
      addToast("success", "Email verified successfully! Welcome to OfficeMoM");
      navigate("/login");
    } catch (error) {
      addToast(
        "error",
        error?.response?.data?.message || "Verification failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (currentStep === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && currentStep === 2) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, currentStep]);

  const passwordStrength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | Create Account</title>
        <link rel="canonical" href="https://officemom.me/signup" />
      </Helmet>

      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden py-10 md:py-4">
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

        <button
          onClick={toggleTheme}
          className=" absolute top-4 right-4 p-2 ml-4 rounded-xl cursor-pointer bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                      shadow-lg border border-white/30 dark:border-gray-700/50
                      hover:bg-white dark:hover:bg-gray-700 transition-all duration-300
                      text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <MdLightMode className="text-xl" />
          ) : (
            <MdDarkMode className="text-xl" />
          )}
        </button>

        {/* Main content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Branding and Info */}
            <div className="text-center lg:text-left space-y-8">
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <div className="w-10 h-10 cursor-pointer bg-gradient-to-r from-white to-blue-400 rounded-lg flex items-center justify-center">
                  <img src="/logo.webp" alt="logo" loading="lazy" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  OfficeMoM
                </span>
              </div>

              <div className="space-y-6">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                  Join Thousands of{" "}
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Productive Teams
                  </span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Start your journey with AI-powered meeting management. Create
                  your account and transform how your team collaborates.
                </p>
              </div>

              {/* Features list */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>AI-powered meeting transcription</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Real-time collaboration tools</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Enterprise-grade security</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Free tier with generous limits</span>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="pt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        currentStep >= 1 ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${
                        currentStep >= 1 ? "text-indigo-600" : "text-gray-500"
                      }`}
                    >
                      Account Details
                    </span>
                  </div>
                  <div className="w-8 h-0.5 bg-gray-300"></div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        currentStep >= 2 ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${
                        currentStep >= 2 ? "text-indigo-600" : "text-gray-500"
                      }`}
                    >
                      Verify Email
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Registration Form */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <form
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:shadow-3xl"
                  onSubmit={handleSignupForm}
                >
                  {currentStep === 1 ? (
                    <>
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          Create Your Account
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          Start your productivity journey today
                        </p>
                      </div>

                      <div className="space-y-6">
                        {/* Full Name Field */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Full Name
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                              type="text"
                              placeholder="Enter your full name"
                              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 dark:group-hover:border-gray-500"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email Address
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                              type="email"
                              placeholder="Enter your email"
                              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 dark:group-hover:border-gray-500"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                              type="password"
                              placeholder="Create a strong password"
                              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 dark:group-hover:border-gray-500"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </div>

                          {/* Password Strength Indicator */}
                          {password && (
                            <div className="space-y-2 mt-3">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Password strength
                                </span>
                                <span
                                  className={`font-medium ${
                                    strengthScore >= 4
                                      ? "text-green-600"
                                      : strengthScore >= 3
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {strengthScore >= 4
                                    ? "Strong"
                                    : strengthScore >= 3
                                    ? "Medium"
                                    : "Weak"}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    strengthScore >= 4
                                      ? "bg-green-500"
                                      : strengthScore >= 3
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{
                                    width: `${(strengthScore / 5) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isProcessing}
                          onMouseEnter={() => setIsHovered(true)}
                          onMouseLeave={() => setIsHovered(false)}
                          className="w-full cursor-pointer flex items-center justify-center space-x-2 py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Creating Account...</span>
                            </>
                          ) : (
                            <>
                              <span>Continue</span>
                              <ArrowRight
                                className={`w-5 h-5 transition-transform duration-200 ${
                                  isHovered ? "translate-x-1" : ""
                                }`}
                              />
                            </>
                          )}
                        </button>

                        {/* Login Link */}
                        <div className="text-center">
                          <p className="text-gray-600 dark:text-gray-400">
                            Already have an account?{" "}
                            <button
                              type="button"
                              onClick={() => navigate("/login")}
                              className="text-indigo-600 cursor-pointer dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors duration-200 hover:underline"
                            >
                              Sign in
                            </button>
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* OTP Verification Step */
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mx-auto flex items-center justify-center shadow-lg mb-4">
                          <Mail className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          Verify Your Email
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          We sent a 6-digit code to:
                        </p>
                        <p className="text-indigo-600 dark:text-indigo-400 font-medium break-all">
                          {email}
                        </p>
                      </div>

                      {/* OTP Inputs */}
                      <div className="space-y-4">
                        <div className="flex justify-center space-x-3">
                          {otp.map((digit, index) => (
                            <input
                              key={index}
                              id={`otp-${index}`}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength="1"
                              className="w-12 h-12 text-center text-xl font-bold bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all duration-300 text-gray-900 dark:text-white shadow-sm"
                              value={digit}
                              onChange={(e) =>
                                handleOtpChange(index, e.target.value)
                              }
                              onKeyDown={(e) => handleOtpKeyDown(index, e)}
                              onPaste={(e) => {
                                e.preventDefault();
                                const pastedData =
                                  e.clipboardData.getData("text");
                                if (/^[0-9]{6}$/.test(pastedData)) {
                                  const newOtp = pastedData.split("");
                                  setOtp(newOtp);
                                }
                              }}
                            />
                          ))}
                        </div>

                        {/* Timer and Resend */}
                        <div className="text-center">
                          {timer > 0 ? (
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              Resend code in{" "}
                              <span className="font-mono font-bold text-indigo-600">
                                {String(timer).padStart(2, "0")}s
                              </span>
                            </p>
                          ) : (
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              Didn't receive the code?
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Verify Button */}
                      <button
                        type="button"
                        disabled={isLoading || otp.some((digit) => !digit)}
                        className="w-full cursor-pointer py-4 px-6 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:from-green-600 hover:to-blue-600 transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        onClick={handleVerifyOtp}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Verifying...</span>
                          </div>
                        ) : (
                          "Verify & Complete Registration"
                        )}
                      </button>

                      {/* Resend OTP */}
                      {canResend && (
                        <div className="text-center">
                          <button
                            type="button"
                            className="text-indigo-600 cursor-pointer dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors duration-200 hover:underline"
                            onClick={handleResendOtp}
                          >
                            Resend verification code
                          </button>
                        </div>
                      )}

                      {/* Back to Signup */}
                      <div className="text-center">
                        <button
                          type="button"
                          className="text-gray-500 cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors duration-200 flex items-center justify-center mx-auto space-x-1"
                          onClick={() => {
                            setCurrentStep(1);
                            setOtp(["", "", "", "", "", ""]);
                            setTimer(0);
                            setCanResend(false);
                          }}
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back to registration</span>
                        </button>
                      </div>
                    </div>
                  )}
                </form>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Your data is securely encrypted and protected</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-float"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
      </section>
    </>
  );
};

export default Signup;
