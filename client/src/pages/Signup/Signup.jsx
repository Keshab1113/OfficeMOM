import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useToast } from "../../components/ToastContext";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";

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
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSignupForm = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`, {
        fullName,
        email,
        password,
      });
      addToast("success", "OTP sent to email");
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
        addToast("error", error?.response?.data?.message || "Signup failed");
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
      addToast("success", "OTP resent to your email");
      setOtp(["", "", "", "", "", ""]);
      setTimer(30);
      setCanResend(false);
    } catch (error) {
      addToast(
        "error",
        error?.response?.data?.message || "Failed to resend OTP"
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
      addToast("success", "Email verified successfully");
      navigate("/login");
    } catch (error) {
      addToast(
        "error",
        error?.response?.data?.message || "OTP verification failed"
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

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | SignUp</title>
        <link rel="canonical" href="http://mysite.com/example" />
      </Helmet>
      <section className="relative flex h-full min-h-screen w-full items-center justify-center dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]">
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:20px_20px]",
            "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
          )}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)]"></div>
        <div className="flex items-center justify-center relative z-20 w-full">
          <form
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border border-gray-200 dark:border-gray-700 p-8 rounded-2xl shadow-2xl w-[90%] md:w-[50%] max-w-[90vw] transform transition-all duration-500 hover:scale-105"
            onSubmit={handleSignupForm}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center shadow-lg mb-4 animate-bounce-slow">
              {currentStep === 1 ? (
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-8 h-8 text-blue-100"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>
            {currentStep === 1 ? (
              <>
                <h1 className="text-3xl text-center md:text-4xl font-bold bg-gradient-to-br from-black to-blue-500 dark:from-white dark:to-blue-400 bg-clip-text text-transparent mb-1">
                  Welcome to Office<span className="text-blue-500">MoM</span>
                </h1>
                <p className="text-gray-700 text-center dark:text-gray-300 text-lg font-medium mb-2">
                  Create your account to get started
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl text-center font-bold bg-gradient-to-br from-black to-blue-500 dark:from-white dark:to-blue-400 bg-clip-text text-transparent mb-1">
                  Verify Your Email
                </h1>
                <p className="text-gray-700 text-center dark:text-gray-300 text-lg font-medium mb-1">
                  We've sent a 6-digit verification code to your email
                </p>
                <p className="text-blue-500 text-center dark:text-blue-400 text-sm font-medium break-all mb-2">
                  {email}
                </p>
              </>
            )}
            {currentStep === 1 ? (
              <>
                <div className="space-y-4 w-full">
                  <div className="animate-slide-up">
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                    >
                      Full Name
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        id="fullName"
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-300 dark:group-hover:border-blue-600"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg
                          className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="animate-slide-up animation-delay-100">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative group">
                      <input
                        type="email"
                        id="email"
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-300 dark:group-hover:border-blue-600"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg
                          className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="animate-slide-up animation-delay-200">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative group">
                      <input
                        type="password"
                        id="password"
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-300 dark:group-hover:border-blue-600"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg
                          className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex gap-1 justify-center items-center cursor-pointer py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-0 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-white dark:focus:ring-offset-gray-900 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-800 dark:text-white text-center">
                  Already have an account?{" "}
                  <span
                    onClick={() => navigate("/login")}
                    className="text-blue-500 cursor-pointer"
                  >
                    Login
                  </span>
                </p>
              </>
            ) : (
              <div className="space-y-6">
                <div className="animate-slide-up">
                  <div className="flex justify-center md:space-x-3 space-x-2 mb-6">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength="1"
                        className="md:w-14 md:h-14 w-11 h-11 text-center text-2xl font-bold bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-300 text-gray-900 dark:text-white shadow-sm hover:border-blue-400 dark:hover:border-blue-500"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData("text");
                          if (/^[0-9]{6}$/.test(pastedData)) {
                            const newOtp = pastedData.split("");
                            setOtp(newOtp);
                          }
                        }}
                      />
                    ))}
                  </div>

                  <div className="text-center mb-4">
                    {timer > 0 ? (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Resend code in{" "}
                        <span className="font-mono font-bold text-blue-500">
                          {String(Math.floor(timer / 60)).padStart(2, "0")}:
                          {String(timer % 60).padStart(2, "0")}
                        </span>
                      </p>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Didn't receive the code?
                      </p>
                    )}
                  </div>
                </div>

                <div className="animate-slide-up animation-delay-100">
                  <button
                    type="button"
                    disabled={isLoading || otp.some((digit) => !digit)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:from-green-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    onClick={handleVerifyOtp}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </div>
                    ) : (
                      "Verify Code"
                    )}
                  </button>
                </div>

                {canResend && timer === 0 && (
                  <div className="text-center animate-slide-up animation-delay-200">
                    <button
                      type="button"
                      className="text-blue-500 cursor-pointer hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors duration-300 hover:underline"
                      onClick={handleResendOtp}
                    >
                      Resend Verification Code
                    </button>
                  </div>
                )}

                <div className="text-center animate-slide-up animation-delay-300">
                  <button
                    type="button"
                    className="text-gray-500 cursor-pointer hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors duration-300 flex items-center justify-center mx-auto"
                    onClick={() => {
                      setCurrentStep(1);
                      setOtp(["", "", "", "", "", ""]);
                      setTimer(0);
                      setCanResend(false);
                    }}
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Back to signup
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>
    </>
  );
};

export default Signup;
