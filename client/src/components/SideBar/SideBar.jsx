import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { RiMenu2Line } from "react-icons/ri";
import { RxCross2 } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/authSlice";
import { persistor } from "../../redux/store";
import { TbLogout2 } from "react-icons/tb";
import { useToast } from "../ToastContext";
import { IoPerson } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoPersonCircleSharp } from "react-icons/io5";
import {
  MdDarkMode,
  MdLightMode,
  MdVideoCall,
  MdAudiotrack,
  MdMeetingRoom,
} from "react-icons/md";
import { Zap, LogOut, CreditCard, Bot } from "lucide-react";

const navItems = [
  {
    heading: "Join Online Meeting",
    icon: MdVideoCall,
    url: "/meeting",
    description: "Gmeet, Zoom, Teams etc",
  },
  {
    heading: "Generate Notes from Files",
    icon: MdAudiotrack,
    url: "/audio-notes",
    description: "Audio & Video files",
  },
  {
    heading: "Start New Meeting",
    icon: MdMeetingRoom,
    url: "/live-meeting",
    description: "Live transcription",
  },
  {
    heading: "Bot Master",
    icon: Bot,
    url: "/bot-master",
    description: "Join the bot master",
  },
];

const SideBar = () => {
  const dispatch = useDispatch();
  const {
    email,
    fullName,
    token,
    totalCreatedMoMs,
    totalRemainingTime,
    totalTimes,
  } = useSelector((state) => state.auth);
  const { profileImage } = useSelector((state) => state.auth);
  const { addToast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const hiddenRoutes = ["/meeting", "/audio-notes", "/live-meeting"];

  const hideSidebar = hiddenRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    persistor.purge();
    if (isMobile) setIsSidebarOpen(false);
    addToast("success", "Logout Successfully");
    setDropdownOpen(false);
  };

  const handleNavClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const SidebarContent = (
    <motion.section
      initial={isMobile ? { x: -300 } : false}
      animate={isMobile ? { x: 0 } : false}
      transition={
        isMobile ? { type: "spring", damping: 25, stiffness: 200 } : {}
      }
      className={`backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 
    shadow-2xl shadow-blue-500/20 dark:shadow-indigo-500/30 h-[100dvh] py-8 
    sticky top-0 left-0 flex flex-col justify-between items-start z-40 transition-all duration-500 ease-in-out
    border-r border-white/30 dark:border-gray-700/50 overflow-hidden 
    ${isCollapsed ? "w-20" : "md:w-80 w-screen px-6"}`}
    >
      {/* Header Section */}
      <div className="w-full space-y-8">
        {/* Logo and Theme Toggle */}
        <div className="flex items-center justify-between w-full">
          <motion.button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-10 h-10 cursor-pointer bg-gradient-to-r from-white to-blue-400 rounded-lg flex items-center justify-center">
              <img src="/logo.webp" alt="logo" loading="lazy" />
            </div>
            {!isCollapsed && (
              <div className="text-left">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent  transition-all duration-300">
                  OfficeMoM
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  AI Meeting Assistant
                </p>
              </div>
            )}
          </motion.button>

          {/* Theme Toggle and Close Button */}
          <div className="flex items-center gap-2">
            {(hideSidebar || isMobile) && (
              <motion.button
                onClick={toggleTheme}
                className="p-2 rounded-xl border-0 border-none cursor-pointer bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm
                shadow-lg 
                hover:bg-white dark:hover:bg-gray-600 transition-all duration-300
                text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={
                  isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {isDarkMode ? (
                  <MdLightMode className="text-xl" />
                ) : (
                  <MdDarkMode className="text-xl" />
                )}
              </motion.button>
            )}
            {isMobile && (
              <motion.button
                className="p-2 rounded-xl bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm
                  shadow-lg border border-white/30 dark:border-gray-600/50
                  text-gray-700 dark:text-gray-300 hover:text-red-500 transition-colors"
                onClick={() => setIsSidebarOpen(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RxCross2 className="text-xl" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-3 md:mt-20">
          {navItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={index}
                to={item.url}
                onClick={handleNavClick}
                title={isCollapsed ? item.heading : ""}
                className={({ isActive }) =>
                  `group border-0 border-none flex items-center cursor-pointer gap-4 p-4 rounded-2xl transition-all duration-300 relative overflow-hidden
                  ${isCollapsed ? "justify-center" : "justify-start"}
                  ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transform scale-[1.02]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:shadow-md hover:border hover:border-white/50 dark:hover:border-gray-600/50"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <motion.div
                      className={`flex items-center justify-center rounded-xl min-w-12 min-h-12 shadow-lg
                        ${
                          isActive
                            ? "bg-white/20"
                            : "bg-gradient-to-br from-indigo-500 to-purple-500 group-hover:scale-110"
                        }`}
                      whileHover={{ scale: 1.1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      <IconComponent
                        className={`w-6 h-6 ${
                          isActive ? "text-white" : "text-white"
                        }`}
                      />
                    </motion.div>

                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base leading-tight">
                          {item.heading}
                        </h3>
                        <p
                          className={`text-xs mt-1 ${
                            isActive
                              ? "text-gray-300 dark:text-gray-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* User Profile Section */}
      {email && fullName && token && (
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/30 dark:border-gray-600/50">
            <div className="flex justify-between items-center">
              {/* User Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg relative overflow-hidden"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {profileImage?.profileImage ? (
                    <img
                      src={profileImage?.profileImage}
                      alt="profile"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <IoPerson className="w-6 h-6 text-white" />
                  )}
                </motion.div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <motion.h3
                      className="text-gray-800 dark:text-white font-semibold text-sm truncate"
                      whileHover={{ scale: 1.02 }}
                    >
                      {fullName}
                    </motion.h3>
                    <motion.p
                      className="text-gray-600 dark:text-gray-300 text-xs truncate"
                      whileHover={{ scale: 1.02 }}
                    >
                      {email}
                    </motion.p>
                  </div>
                )}
              </div>

              {/* Dropdown Menu Button */}
              {!isCollapsed && (
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    className="p-2 rounded-xl cursor-pointer bg-white/80 dark:bg-gray-600/80 backdrop-blur-sm
                      hover:bg-white dark:hover:bg-gray-500 transition-colors border border-white/30 dark:border-gray-500/50"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <BsThreeDotsVertical className="text-gray-600 dark:text-gray-300 text-sm" />
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.section>
  );

  // Dropdown Content - Moved outside the sidebar
  const DropdownContent = (
    <AnimatePresence>
      {dropdownOpen && !isCollapsed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[60] lg:bottom-25 bottom-30 lg:left-[300px] md:left-[300px] left-auto right-5 md:right-auto"
        >
          <div
            className="w-56 bg-gradient-to-br from-white via-purple-50/50 to-blue-50 
              dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 backdrop-blur-xl shadow-2xl 
              rounded-2xl border-2 border-purple-200/60 dark:border-purple-500/40 overflow-hidden"
          >
            <div
              className="relative border-b border-purple-200/50 dark:border-purple-500/30 px-4 py-5 text-sm 
                bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 
                dark:from-emerald-600/30 dark:via-teal-600/30 dark:to-cyan-600/30 space-y-3"
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 
                    rounded-full blur-3xl -translate-y-8 translate-x-8"
              ></div>

              <div className="flex justify-between items-center relative z-10">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  Total Time:
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">
                  {totalTimes || 300}
                </span>
              </div>

              <div className="flex justify-between items-center relative z-10">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  Total Remaining:
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-bold text-base">
                  {totalRemainingTime || 300}
                </span>
              </div>

              <div
                className="flex justify-between items-center relative z-10 pt-2 border-t border-purple-200/40 
                    dark:border-purple-400/30"
              >
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  Total Created MoM:
                </span>
                <span className="text-purple-600 dark:text-purple-400 font-bold text-base">
                  {totalCreatedMoMs || 0}
                </span>
              </div>
            </div>
            {/* Menu Items with Colorful Hover Effects */}
            <Link
              to="/subscription"
              onClick={() => {
                setDropdownOpen(false);
                if (isMobile) setIsSidebarOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-sm font-semibold 
                text-gray-700 dark:text-gray-300 
                hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 
                dark:hover:from-yellow-900/40 dark:hover:to-orange-900/40
                hover:text-orange-700 dark:hover:text-orange-300 
                transition-all duration-300 border-b border-purple-100/50 dark:border-purple-800/40
                group relative overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 to-orange-400/0 
                group-hover:from-yellow-400/10 group-hover:to-orange-400/10 transition-all duration-300"
              ></div>
              <CreditCard className="text-xl relative z-10 group-hover:scale-110 transition-transform" />
              <span className="relative z-10">Plan Details</span>
            </Link>

            <Link
              to="/profile"
              onClick={() => {
                setDropdownOpen(false);
                if (isMobile) setIsSidebarOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-sm font-semibold 
                text-gray-700 dark:text-gray-300 
                hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100 
                dark:hover:from-indigo-900/40 dark:hover:to-purple-900/40
                hover:text-indigo-700 dark:hover:text-indigo-300 
                transition-all duration-300 border-b border-purple-100/50 dark:border-purple-800/40
                group relative overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-indigo-400/0 to-purple-400/0 
                group-hover:from-indigo-400/10 group-hover:to-purple-400/10 transition-all duration-300"
              ></div>
              <IoPersonCircleSharp className="text-xl relative z-10 group-hover:scale-110 transition-transform" />
              <span className="relative z-10">Profile Settings</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center cursor-pointer gap-3 w-full px-4 py-3.5 text-sm font-semibold 
                text-gray-700 dark:text-gray-300 
                hover:bg-gradient-to-r hover:from-red-100 hover:to-pink-100 
                dark:hover:from-red-900/40 dark:hover:to-pink-900/40
                hover:text-red-700 dark:hover:text-red-300 
                transition-all duration-300
                group relative overflow-hidden rounded-b-2xl"
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-red-400/0 to-pink-400/0 
                group-hover:from-red-400/10 group-hover:to-pink-400/10 transition-all duration-300"
              ></div>
              <LogOut className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
              <span className="relative z-10">Sign Out</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {isMobile && !isSidebarOpen && (
        <motion.button
          className={`p-2.5 fixed left-3  bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 dark:border-gray-600/50 text-indigo-600 dark:text-indigo-400 ${
            hideSidebar ? "top-3" : "top-3"
          } ${isMobile ? "z-50" : "z-40"}`}
          onClick={() => setIsSidebarOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RiMenu2Line className="text-lg" />
        </motion.button>
      )}

      {/* Render Dropdown Content */}
      {DropdownContent}

      {isMobile ? (
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="fixed top-0 left-0 h-full z-50"
            >
              {SidebarContent}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        SidebarContent
      )}
    </>
  );
};

export default SideBar;
