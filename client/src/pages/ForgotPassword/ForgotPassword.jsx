import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Mail,
  Lock,
  ArrowLeft,
  Shield,
  Key,
} from "lucide-react";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { useToast } from "../../components/ToastContext";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { addToast } = useToast();
  const [isProcessingResend, setIsProcessingResend] = useState(false);

  const navigate = useNavigate();

  // Simple client-side checks
  const validEmail = /\S+@\S+\.\S+/.test(email);
  const strongPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(
      password.trim()
    );
  const passwordsMatch = password === confirm;

  const passwordStrength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  const sendOtp = async (e) => {
    e.preventDefault();
    if (!validEmail) return;
    setIsProcessing(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/forgot-password/send-otp`,
        { email }
      );
      setStep(2);
      setTimer(120);
      setCanResend(false);
    } catch (err) {
      console.error(err);
      addToast(
        "error",
        err?.response?.data?.message || "Failed to send verification code"
      );
    } finally {
      setIsProcessing(false);
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
    setIsProcessingResend(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/forgot-password/send-otp`,
        { email }
      );
      setOtp(["", "", "", "", "", ""]);
      setTimer(120);
      setCanResend(false);
      setIsProcessingResend(false);
      addToast("success", "Verification code resent to your email");
    } catch (err) {
      setIsProcessingResend(false);
      addToast(
        "error",
        err?.response?.data?.message || "Failed to resend code"
      );
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!strongPassword) return;
    if (!passwordsMatch) {
      addToast("error", "Passwords do not match");
      return;
    }
    setIsProcessing(true);
    try {
      const otpString = otp.join("");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/forgot-password/reset`,
        { email, otp: otpString, newPassword: password }
      );
      // Success → back to login
      navigate("/login", {
        replace: true,
        state: {
          message:
            "Password reset successfully! Please sign in with your new password.",
        },
      });
      addToast(
        "success",
        "Password reset successfully! Please sign in with your new password."
      );
    } catch (err) {
      console.error(err);
      addToast(
        "error",
        err?.response?.data?.message || "Failed to reset password"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && step === 2) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, step]);

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
        <title>OfficeMom | Reset Password</title>
        <link rel="canonical" href="https://officemom.me/forgot-password" />
      </Helmet>

      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden py-10">
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
          className="absolute top-4 right-4 p-2 ml-4 rounded-xl cursor-pointer bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
              shadow-lg border border-white/30 dark:border-gray-700/50
              hover:bg-white dark:hover:bg-gray-700 transition-all duration-300
              text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <MdLightMode className="text-xl" />
          ) : (
            <MdDarkMode className="text-xl" />
          )}
        </button>

        {/* Main content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4">
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
                  Reset Your{" "}
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Password
                  </span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Secure your account with a new password. We'll help you get
                  back to productive meetings in no time.
                </p>
              </div>

              {/* Security features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span>End-to-end encrypted process</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Instant email verification</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <Lock className="w-5 h-5 text-green-500" />
                  <span>Strong password requirements</span>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="pt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        step >= 1 ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${
                        step >= 1 ? "text-indigo-600" : "text-gray-500"
                      }`}
                    >
                      Verify Email
                    </span>
                  </div>
                  <div className="w-8 h-0.5 bg-gray-300"></div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        step >= 2 ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${
                        step >= 2 ? "text-indigo-600" : "text-gray-500"
                      }`}
                    >
                      New Password
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <form
                  onSubmit={step === 1 ? sendOtp : resetPassword}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:shadow-3xl"
                >
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full mx-auto flex items-center justify-center shadow-lg mb-4">
                      {step === 1 ? (
                        <Mail className="w-8 h-8 text-white" />
                      ) : (
                        <Lock className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {step === 1 ? "Verify Your Email" : "Create New Password"}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {step === 1
                        ? "Enter your email to receive a verification code"
                        : "Enter the code and set your new password"}
                    </p>
                  </div>

                  {/* Step 1: Email */}
                  {step === 1 && (
                    <div className="space-y-6">
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
                            placeholder="Enter your email address"
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 dark:group-hover:border-gray-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!validEmail || isProcessing}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className="w-full cursor-pointer flex items-center justify-center space-x-2 py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Sending Code...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowLeft
                              className={`w-5 h-5 transition-transform duration-200 ${
                                isHovered ? "translate-x-1" : ""
                              }`}
                            />
                          </>
                        )}
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => navigate("/login")}
                          className="text-indigo-600 cursor-pointer dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors duration-200 hover:underline flex items-center justify-center space-x-1 mx-auto"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back to Sign In</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: OTP + New Password */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                            Verification Code
                          </label>
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
                          <div className="text-center mt-3">
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

                        {canResend && (
                          <div className="text-center">
                            <button
                              type="button"
                              disabled={isProcessingResend}
                              className="text-indigo-600 disabled:cursor-not-allowed cursor-pointer dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors duration-200 hover:underline"
                              onClick={handleResendOtp}
                            >
                              {isProcessingResend
                                ? "Sending code..."
                                : "Resend verification code"}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          New Password
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            className="w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 dark:group-hover:border-gray-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
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

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Confirm Password
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                          </div>
                          <input
                            type={showConfirm ? "text" : "password"}
                            placeholder="Confirm your new password"
                            className={`w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-700 border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                              confirm && !passwordsMatch
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-transparent group-hover:border-gray-400 dark:group-hover:border-gray-500"
                            }`}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            {showConfirm ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {confirm && !passwordsMatch && (
                          <p className="text-red-500 text-xs mt-1">
                            Passwords do not match
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={
                          isProcessing ||
                          otp.some((digit) => !digit) ||
                          !strongPassword ||
                          !passwordsMatch
                        }
                        className="w-full cursor-pointer flex items-center justify-center space-x-2 py-4 px-6 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:from-green-600 hover:to-blue-600 transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isProcessing ? (
                          <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Resetting Password...</span>
                          </div>
                        ) : (
                          "Reset Password"
                        )}
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setStep(1);
                            setOtp(["", "", "", "", "", ""]);
                            setTimer(0);
                            setCanResend(false);
                            setStep(1);
                          }}
                          className="text-gray-500 cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors duration-200 flex items-center justify-center mx-auto space-x-1"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back to email verification</span>
                        </button>
                      </div>
                    </div>
                  )}
                </form>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>
                      Your security is our priority. All data is encrypted.
                    </span>
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

export default ForgotPassword;
