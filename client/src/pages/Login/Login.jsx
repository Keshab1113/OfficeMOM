import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useDispatch } from "react-redux";
import {
  setProfileImage,
  setUser,
  startLogoutTimer,
} from "../../redux/authSlice";
import { useToast } from "../../components/ToastContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Helmet } from "react-helmet";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addToast } = useToast();

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
      addToast("error", error?.response?.data?.message);
      console.log(error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | Login</title>
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
        <div className="flex items-center justify-center relative z-20 md:w-[50%] w-[90%]">
          <form
            className="dark:bg-white/10 bg-gray-200 dark:backdrop-blur-lg w-full border border-white/20 rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-105 hover:bg-white/15"
            onSubmit={handleLogin}
          >
            <div className="text-center mb-8 animate-fade-in">
              <div className="mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center shadow-lg animate-bounce-slow">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent animate-gradient-x">
                Welcome Back
              </h1>
              <p className="dark:text-gray-300 text-gray-600 mt-2 animate-slide-up">
                Sign in to continue your journey
              </p>
            </div>
            <div className="space-y-6">
              <div className="animate-slide-up animation-delay-200">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium dark:text-gray-200 text-gray-600 mb-2"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    placeholder="Enter Your Email"
                    className="w-full px-4 py-3 bg-white/10 border dark:border-white/20 border-slate-400 rounded-xl dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 group-hover:bg-white/15"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors duration-300"
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
              <div className="animate-slide-up animation-delay-300">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium dark:text-gray-200 text-gray-600 mb-2"
                >
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Your Password"
                    className="w-full px-4 py-3 pr-12 bg-white/10 border dark:border-white/20 border-gray-400 rounded-xl dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 group-hover:bg-white/15"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400 hover:text-purple-400 transition-colors duration-300" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400 hover:text-purple-400 transition-colors duration-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end animate-slide-up animation-delay-400 mt-[-20px]">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-purple-500 cursor-pointer hover:text-purple-600 font-medium text-sm transition-colors duration-300 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button className="w-full flex gap-1 justify-center items-center cursor-pointer py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:from-blue-400 hover:to-purple-600  focus:outline-none focus:ring-0 focus:ring-purple-400 focus:ring-offset-0 focus:ring-offset-gray-900 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="text-center animate-slide-up animation-delay-500">
                <p className="dark:text-gray-300">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-purple-500 cursor-pointer hover:text-purple-400 font-semibold transition-colors duration-300 hover:underline"
                    onClick={() => navigate("/signup")}
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
};

export default Login;
