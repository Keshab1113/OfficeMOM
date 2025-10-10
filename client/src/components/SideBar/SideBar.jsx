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
import { Zap, LogOut } from "lucide-react";

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
];

const SideBar = () => {
  const dispatch = useDispatch();
  const { email, fullName, token } = useSelector((state) => state.auth);
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
          {(hideSidebar || isMobile) && (
            <motion.button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 group"
              whileHover={{ scale: 1.02 }}
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
          )}

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
                        <h3 className="font-semibold text-sm leading-tight">
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

              {/* Dropdown Menu */}
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

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        transition={{
                          type: "spring",
                          damping: 25,
                          stiffness: 300,
                        }}
                        className="absolute right-0 bottom-12 mt-2 w-48 bg-white/95 dark:bg-gray-800/95 
                          backdrop-blur-xl shadow-2xl rounded-xl border border-white/30 dark:border-gray-600/50 overflow-hidden"
                      >
                        <Link
                          to="/profile"
                          onClick={() => {
                            setDropdownOpen(false);
                            if (isMobile) setIsSidebarOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium 
                            text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 
                            hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border-b border-white/20 dark:border-gray-700/50"
                        >
                          <IoPersonCircleSharp className="text-lg" />
                          Profile Settings
                        </Link>
                        <motion.button
                          onClick={handleLogout}
                          className="flex items-center cursor-pointer gap-3 w-full px-4 py-3 text-sm font-medium 
                            text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 
                            hover:text-red-600 dark:hover:text-red-400 transition-all"
                          whileHover={{ x: 5 }}
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.section>
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
