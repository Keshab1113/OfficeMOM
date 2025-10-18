import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  setProfileImage,
  setUser,
  startLogoutTimer,
} from "../../redux/authSlice";
import { useToast } from "../../components/ToastContext";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Helmet } from "react-helmet";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        {
          email,
          password,
        }
      );

      dispatch(
        setUser({
          fullName: res.data.user.fullName,
          email: res.data.user.email,
          token: res.data.token,
          totalCreatedMoMs: res.data.user.totalCreatedMoMs,
          totalRemainingTime: res.data.user.totalRemainingTime,
          totalTimes: res.data.user.totalTimes,
        })
      );
      dispatch(
        setProfileImage({
          profileImage: res.data.user.profilePic,
        })
      );
      dispatch(startLogoutTimer(24 * 60 * 60 * 1000));
      setIsProcessing(false);
      addToast("success", "Login Successfully");
      navigate("/");
    } catch (error) {
      setIsProcessing(false);
      addToast("error", error?.response?.data?.message || "Login failed!");
      console.log(error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

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
        <title>Smart Minutes of the Meeting (OfficeMoM) | Login</title>
        <link rel="canonical" href="https://officemom.me/login" />
      </Helmet>

      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden py-10">
        {/* Background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow2"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow2 animation-delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full blur-3xl animate-pulse-slow2 animation-delay-2000"></div>
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
                  Welcome Back to{" "}
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Productivity
                  </span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  Streamline your meetings with AI-powered transcription, smart
                  summaries, and seamless collaboration tools.
                </p>
              </div>

              {/* Features list */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>AI-powered meeting transcription</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time collaboration</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Enterprise-grade security</span>
                </div>
              </div>
            </div>

            {/* Right side - Login Form */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <form
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:shadow-3xl"
                  onSubmit={handleLogin}
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Sign In to Your Account
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Enter your credentials to continue
                    </p>
                  </div>

                  <div className="space-y-4">
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
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-400 dark:group-hover:border-gray-500"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Forgot Password */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className=" cursor-pointer text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
                      >
                        Forgot your password?
                      </button>
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
                          <span>Signing In...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight
                            className={`w-5 h-5 transition-transform duration-200 ${
                              isHovered ? "translate-x-1" : ""
                            }`}
                          />
                        </>
                      )}
                    </button>

                    {/* Sign Up Link */}
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          onClick={() => navigate("/signup")}
                          className="cursor-pointer text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors duration-200 hover:underline"
                        >
                          Create account
                        </button>
                      </p>
                    </div>
                  </div>
                </form>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() =>
                      (window.location.href = `${
                        import.meta.env.VITE_BACKEND_URL
                      }/api/auth/google`)
                    }
                    className="w-full cursor-pointer flex items-center justify-center space-x-3 py-3 px-6 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                  >
                    <img
                      src="https://developers.google.com/identity/images/g-logo.png"
                      alt="Google logo"
                      className="w-5 h-5"
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Continue with Google
                    </span>
                  </button>
                </div>
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={async () => {
                      try {
                        // Check backend availability, not Facebook directly
                        const response = await fetch(
                          `${
                            import.meta.env.VITE_BACKEND_URL
                          }/api/auth/facebook/health`,
                          { method: "HEAD" }
                        );

                        if (response.ok) {
                          window.location.href = `${
                            import.meta.env.VITE_BACKEND_URL
                          }/api/auth/facebook`;
                        } else {
                          addToast(
                            "error",
                            "Facebook login is currently unavailable"
                          );
                        }
                      } catch (error) {
                        console.log("Facebook login check failed: ", error);
                        addToast("error", "Failed to initiate Facebook login");
                      }
                    }}
                    className="w-full cursor-pointer flex items-center justify-center space-x-3 py-3 px-6 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Continue with Facebook
                    </span>
                  </button>
                </div>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-1">
                    <Lock className="w-3 h-3" />
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

export default Login;
