import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();

  // Simple client-side checks
  const validEmail = /\S+@\S+\.\S+/.test(email);
  const strongPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

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
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!strongPassword) return;
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }
    setIsProcessing(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/forgot-password/reset`,
        { email, otp, newPassword: password }
      );
      // Success → back to login
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMoM | Forgot Password</title>
        <link rel="canonical" href="http://mysite.com/example" />
      </Helmet>

      <section className="relative flex min-h-screen w-full items-center justify-center dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]">
        {/* Background grid */}
        <div
          className={[
            "absolute inset-0",
            "[background-size:20px_20px]",
            "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]",
          ].join(" ")}
        />
        {/* Radial mask */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)]"></div>

        {/* Card */}
        <div className=" flex rounded-2xl items-center justify-center relative z-20 md:w-[50%] w-[90%] max-h-[90vh] overflow-hidden">
          <form
            onSubmit={step === 1 ? sendOtp : resetPassword}
            className="dark:bg-white/10 bg-gray-200 dark:backdrop-blur-lg w-full border border-white/20 rounded-2xl shadow-2xl px-8 py-6 transform transition-all duration-500"
          >
            {/* Header */}
            <div className="text-center mb-4">
              <div className="mb-2">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center shadow-lg animate-bounce-slow">
                  {step === 1 ? (
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12H8m8-4H8m8 8H8m12 0a2 2 0 002-2V8a2 2 0 00-2-2h-1.5l-1-1h-7l-1 1H6a2 2 0 00-2 2v8a2 2 0 002 2h14z"
                      />
                    </svg>
                  ) : (
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  )}
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent ">
                {step === 1 ? "Forgot Password" : "Reset Password"}
              </h1>
              <p className="dark:text-gray-300 text-gray-600 mt-1">
                {step === 1
                  ? "Enter your email to receive a one-time OTP"
                  : "Enter the OTP and set a new password"}
              </p>
            </div>

            {/* Step 1: Email */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium dark:text-gray-200 text-gray-600 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 bg-white/10 border dark:border-white/20 border-slate-400 rounded-xl dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 group-hover:bg-white/15"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!validEmail || isProcessing}
                  className="w-full flex gap-2 justify-center items-center cursor-pointer py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:from-purple-600 hover:to-purple-400 focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-purple-400 hover:text-purple-300 font-semibold hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: OTP + New Password */}
            {step === 2 && (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium dark:text-gray-200 text-gray-600 mb-2"
                  >
                    OTP (6 digits)
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter OTP from email"
                    className="w-full px-4 py-3 bg-white/10 border dark:border-white/20 border-slate-400 rounded-xl dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium dark:text-gray-200 text-gray-600 mb-2"
                  >
                    New Password
                  </label>
                  <div className="relative group">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 chars, 1 upper, 1 lower, 1 number, 1 spcial char"
                      className="w-full px-4 py-3 pr-12 bg-white/10 border dark:border-white/20 border-gray-400 rounded-xl dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-400 hover:text-purple-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400 hover:text-purple-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm"
                    className="block text-sm font-medium dark:text-gray-200 text-gray-600 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter new password"
                      className="w-full px-4 py-3 pr-12 bg-white/10 border dark:border-white/20 border-gray-400 rounded-xl dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-5 h-5 text-gray-400 hover:text-purple-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400 hover:text-purple-400" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    isProcessing ||
                    !otp ||
                    otp.length !== 6 ||
                    !strongPassword ||
                    password !== confirm
                  }
                  className="w-full flex gap-2 justify-center items-center cursor-pointer py-3 px-4 bg-gradient-to-r from-purple-400 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:from-purple-500 hover:to-purple-400 focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-purple-400 hover:text-purple-300 font-semibold hover:underline"
                  >
                    Re-send OTP
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

export default ForgotPassword;
