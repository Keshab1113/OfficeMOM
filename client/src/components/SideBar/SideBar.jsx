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
import { Zap, LogOut, CreditCard, Bot, ChevronsRight, ChevronDown, Wallet, BookUser, Contact } from "lucide-react";
import axios from "axios";

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
    url: "/generate-notes",
    description: "Audio & Video files",
  },
  {
    heading: "Start New Meeting",
    icon: MdMeetingRoom,
    url: "/live-meeting",
    description: "In Person Meeting",
  },
  {
    heading: "Meeting Master",
    icon: Bot,
    url: "/bot-master",
    description: "Join as a meeting bot",
  },
];

// Additional menu items for mobile dropdown
const mobileMenuItems = [
  {
    heading: "Pricing",
    icon: Wallet,
    url: "/pricing",
  },
  {
    heading: "About",
    icon: BookUser,
    url: "/about-us",
  },
  {
    heading: "Contact",
    icon: Contact,
    url: "/contact-us",
  },
];

const SideBar = ({ isCollapsed, setIsCollapsed }) => {
  const dispatch = useDispatch();
  const {
    email,
    fullName,
    token,
  } = useSelector((state) => state.auth);
  const { profileImage } = useSelector((state) => state.auth);
  const { addToast } = useToast();
  // const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // New state for mobile menu
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null); // New ref for mobile menu
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [subscription, setSubscription] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isExpandButtonClick, setIsExpandButtonClick] = useState(false);

  const hiddenRoutes = ["/meeting", "/generate-notes", "/live-meeting"];

  const hideSidebar = hiddenRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    if (!token) return;

    let intervalId;

    const fetchSubscription = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/subscription`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSubscription(res.data.data);
      } catch (err) {
        console.error("Failed to load subscription details.", err);
      }
    };

    fetchSubscription();

    // 🔁 Fetch every 10 seconds (adjust as needed)
    intervalId = setInterval(fetchSubscription, 10000);

    // 🧹 cleanup
    return () => clearInterval(intervalId);
  }, [token]);


  const handleLogout = async () => {
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    dispatch(logout());
    persistor.purge();
    if (isMobile) setIsSidebarOpen(false);
    addToast("success", "Logout Successfully");
    setDropdownOpen(false);
  };

  const handleNavClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
      setMobileMenuOpen(false); // Close mobile menu on nav click
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target))
        setMobileMenuOpen(false);
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

  const handleMouseEnter = () => {
    setIsHovering(true);
    setIsCollapsed(false);
  };
  const handleExpandButton = () => {
    if (isCollapsed) {
      setIsExpandButtonClick(true);
      handleMouseEnter();
    } else {
      setIsExpandButtonClick(false);
      handleMouseLeave();
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (!dropdownOpen) {
      setIsCollapsed(true);
    }
  };
  useEffect(() => {
    if (!dropdownOpen && !isHovering) {
      setIsCollapsed(true);
    }
  }, [dropdownOpen, isHovering]);

  useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024); // Mobile & tablet: < 1024px, Desktop: >= 1024px
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);


  const SidebarContent = (
    <motion.section
      initial={isMobile ? { x: -300 } : false}
      animate={{
        x: isMobile ? 0 : undefined,
        width: isCollapsed && !isMobile ? "5rem" : isMobile ? "100vw" : "20rem",
        paddingLeft: isCollapsed && !isMobile ? "0.5rem" : "1.5rem",
        paddingRight: isCollapsed && !isMobile ? "0.5rem" : "1.5rem",
      }}
      transition={{
        type: "tween",
        ease: "easeOut",
        duration: 0.3
      }}
      onMouseEnter={(!isExpandButtonClick && !isMobile) ? handleMouseEnter : undefined}
      onMouseLeave={(!isExpandButtonClick && !isMobile) ? handleMouseLeave : undefined}
      style={{
        '--sidebar-width': isCollapsed && !isMobile ? '5rem' : isMobile ? '100vw' : '20rem'
      }}
      className={`backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 
  shadow-2xl shadow-blue-500/20 dark:shadow-indigo-500/30 h-[100dvh] py-8 
  sticky top-0 left-0 flex flex-col justify-between items-start z-40
  border-r border-white/30 dark:border-gray-700/50 overflow-hidden 
  transition-all ease-in-out duration-500
  ${isMobile ? "w-screen max-w-full" : " relative"}`}
    >

      <div className="w-full space-y-8">
        <div className={`flex items-center ${(isCollapsed && !isMobile) ? " justify-center" : "justify-between"} w-full`}>
          <motion.button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 group cursor-pointer "
          >
            <div className="w-10 h-10 cursor-pointer bg-gradient-to-r from-white to-blue-400 rounded-lg flex items-center justify-center">
              <img src="/logo.webp" alt="logo" loading="lazy" />
            </div>
            {(!isCollapsed || isMobile) && (
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

        {/* Mobile Only Dropdown Menu */}


        <div className="md:space-y-3 space-y-2 2xl:mt-20 mt-10">
          {navItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={index}
                to={item.url}
                onClick={handleNavClick}
                title={(isCollapsed && !isMobile) ? item.heading : ""}
                className={({ isActive }) =>
                  `group border-0 border-none flex items-center cursor-pointer gap-4 px-4 md:py-4 py-2 rounded-2xl transition-all duration-300 relative overflow-hidden
                  ${(isCollapsed && !isMobile) ? "justify-center" : "justify-start"}
                  ${isActive
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transform "
                    : (`text-gray-700 dark:text-gray-300 ${(!isCollapsed || isMobile) && " hover:bg-white/60 dark:hover:bg-gray-700/60 hover:shadow-md hover:border hover:border-white/50 dark:hover:border-gray-600/50"}`)
                  }`}
              >
                {({ isActive }) => (
                  <>
                    <motion.div
                      className={`flex items-center justify-center rounded-xl min-w-12 min-h-12 shadow-lg
                        ${isActive
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
                        className={`w-6 h-6 ${isActive ? "text-white" : "text-white"
                          }`}
                      />
                    </motion.div>

                    {(!isCollapsed || isMobile) && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.1 }}
                        className="flex-1 min-w-0"
                      >
                        <h3 className="font-semibold text-[15px] leading-tight whitespace-nowrap">
                          {item.heading}
                        </h3>
                        <p className={`text-xs mt-1 whitespace-nowrap ${isActive ? "text-gray-300 dark:text-gray-400" : "text-gray-600 dark:text-gray-400"}`}>
                          {item.description}
                        </p>
                      </motion.div>
                    )}

                  </>
                )}
              </NavLink>
            );
          })}
          {isMobile && (
            <div className="relative " ref={mobileMenuRef}>
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-full flex items-center justify-between p-2 px-4 rounded-2xl 
                text-gray-700 dark:text-gray-300 
                transition-all duration-300  "
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="font-semibold text-[15px]">More Options</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-300 ${mobileMenuOpen ? "rotate-180" : ""}`}
                />
              </motion.button>

              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-0 space-y-1 pl-4 ">
                      {mobileMenuItems.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                          <Link
                            key={index}
                            to={item.url}
                            onClick={handleNavClick}
                            className=" w-full text-left px-3 py-1 rounded-xl 
                          text-gray-700 dark:text-gray-300 
                          
                          transition-all duration-300 
                           flex items-center gap-1"
                          >
                            <IconComponent
                              className={`w-4 h-4 text-white}`}
                            />
                            <span className="font-medium text-[14px]">{item.heading}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
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
          <div className="relative bg-gradient-to-br from-indigo-500/90 via-purple-500/90 to-pink-500/90 dark:from-indigo-600/90 dark:via-purple-600/90 dark:to-pink-600/90 backdrop-blur-xl rounded-2xl p-[2px] shadow-2xl hover:shadow-indigo-500/50 dark:hover:shadow-purple-500/50 transition-all duration-300 group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300 -z-10"></div>

            <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl ${(isCollapsed && !isMobile) ? "p-1" : "p-4"}`}>
              <div className="flex justify-between items-center">
                {/* User Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <motion.div
                    className={`w-14 h-14 rounded-2xl ${(!isCollapsed || isMobile) && "bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 dark:from-cyan-500 dark:via-blue-600 dark:to-indigo-700"}  flex items-center justify-center shadow-lg relative overflow-hidden`}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {/* Animated ring */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-white/50 animate-pulse"></div>

                    {profileImage?.profileImage ? (
                      <img
                        src={profileImage?.profileImage}
                        alt="profile"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <IoPerson className="w-7 h-7 text-white drop-shadow-lg" />
                    )}
                  </motion.div>

                  {(!isCollapsed || isMobile) && (
                    <div className="flex-1 min-w-0">
                      <motion.h3
                        className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 font-bold text-base truncate"
                      >
                        {fullName}
                      </motion.h3>
                      <motion.p
                        className="text-gray-600 dark:text-gray-400 text-xs font-medium flex items-center gap-1 w-full min-w-0 overflow-hidden"
                      >
                        <span className="truncate block w-full">{email}</span>
                      </motion.p>
                    </div>
                  )}
                </div>

                {/* Dropdown Menu Button */}
                {(!isCollapsed || isMobile) && (
                  <div className="relative" ref={dropdownRef}>
                    <motion.button
                      className="p-2.5 ml-1 rounded-xl cursor-pointer bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 
                        dark:from-indigo-600 dark:to-purple-700 dark:hover:from-indigo-700 dark:hover:to-purple-800 
                        transition-all shadow-md hover:shadow-lg border border-indigo-300/50 dark:border-indigo-500/50"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      <BsThreeDotsVertical className="text-white text-sm drop-shadow" />
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.section>
  );

  // Toggle Button - Now outside the sidebar
  const ToggleButton = !isMobile && (
    <motion.button
      onClick={handleExpandButton}
      className="absolute -right-5 2xl:top-[7rem] top-[5.5rem] transform -translate-y-1/2 z-50
        w-10 h-10 bg-white/90 dark:bg-indigo-600/30 backdrop-blur-sm
        rounded-full shadow-2xl border border-indigo-600
        flex items-center justify-center cursor-pointer
        hover:bg-white dark:hover:bg-indigo-700/30 transition-all duration-300
        hover:shadow-indigo-500/25 dark:hover:shadow-indigo-400/25
        "
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <ChevronsRight
        className={`h-5 w-5 text-gray-700 dark:text-gray-300 transition-transform duration-300 ${!isCollapsed && "rotate-180"
          }`}
      />
    </motion.button>
  );

  // Dropdown Content - Moved outside the sidebar
  const DropdownContent = (
    <AnimatePresence>
      {dropdownOpen && (!isCollapsed || isMobile) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[60] lg:bottom-25 bottom-32 lg:left-[300px] md:left-[300px] left-auto right-5 md:right-auto min-w-[250px]"
        >
          <div
            className="w-full bg-gradient-to-br from-white via-purple-50/50 to-blue-50 
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
                  {`${subscription?.total_minutes || 0} min`}
                </span>
              </div>

              <div className="flex justify-between items-center relative z-10">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  Time Remaining:
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-bold text-base">
                  {`${subscription?.total_remaining_time} min`}
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
          className={`p-2.5 fixed left-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 dark:border-gray-600/50 text-indigo-600 dark:text-indigo-400 ${hideSidebar ? "top-3" : "top-3"}
            z-50`}
          onClick={() => setIsSidebarOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RiMenu2Line className="text-lg" />
        </motion.button>
      )}

      {/* Render Dropdown Content */}
      {DropdownContent}

      {/* Desktop Sidebar with Toggle Button */}
      {!isMobile && (
        <div className="relative">
          {SidebarContent}
          {ToggleButton}
        </div>
      )}

      {/* Mobile Sidebar */}
      {isMobile ? (
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Backdrop overlay for mobile */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setIsSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{
                  type: "tween", // Changed from default to tween for smoother animation
                  ease: "easeOut",
                  duration: 0.3 // Slightly faster
                }}
                className="fixed top-0 left-0 h-full z-50 w-[85vw] max-w-[20rem]"
                style={{ willChange: "transform" }}

              >
                {SidebarContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      ) : null}
    </>
  );
};

export default SideBar;