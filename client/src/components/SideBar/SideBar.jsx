import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FiMenu } from "react-icons/fi";
import { RxCross2 } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/authSlice";
import { persistor } from "../../redux/store";
import { TbLogout2 } from "react-icons/tb";
import { useToast } from "../ToastContext";
import { IoPerson } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoPersonCircleSharp } from "react-icons/io5";

const SideBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { email, fullName, token } = useSelector(
    (state) => state.auth
  );
  const { profileImage } = useSelector(
    (state) => state.auth
  );
  const { addToast } = useToast();
  // eslint-disable-next-line no-unused-vars
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    {
      heading: "Join Online Meeting",
      icon: "/Icons/writing.webp",
      url: "/meeting",
    },
    {
      heading: "Generate Notes from Audio/Video Files",
      icon: "/Icons/video.webp",
      url: "/audio-notes",
    },
    {
      heading: "Start New Meeting",
      icon: "/Icons/voice.webp",
      url: "/live-meeting",
    },
  ];

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const handleHomeClick = () => {
    if (isMobile) setIsSidebarOpen(false);
    navigate("/");
  };

  const handleLogout = () => {
    dispatch(logout());
    persistor.purge();
    if (isMobile) setIsSidebarOpen(false);
    addToast("success", "Logout Successfully");
    setDropdownOpen((prev) => !prev);
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

  const SidebarContent = (
    <section
      className={`relative backdrop-blur-xl bg-gradient-to-br from-white/90 via-blue-50/80 to-indigo-100/70 
      dark:from-gray-900/95 dark:via-slate-800/90 dark:to-indigo-900/80 
      shadow-2xl shadow-blue-500/20 dark:shadow-indigo-500/30 h-[100dvh] py-8 
      sticky top-0 left-0 flex flex-col z-50 transition-all duration-500 ease-in-out
      border-r border-white/30 dark:border-gray-700/50 overflow-hidden
      ${isCollapsed ? "w-[5rem]" : "md:w-[20rem] w-screen 2xl:w-[22vw] px-6"}`}
    >
      <div
        className={`flex items-center justify-between mb-16 ${
          isCollapsed ? "gap-10 flex-col-reverse" : ""
        }`}
      >
        <button onClick={handleHomeClick} className="flex gap-2">
          <div className="w-10 h-10 cursor-pointer bg-gradient-to-r from-white to-blue-400 rounded-lg flex items-center justify-center">
            <img src="/logo.webp" alt="logo" loading="lazy" />
          </div>
          {!isCollapsed && (
            <h1 className="text-3xl font-bold dark:text-white text-[#06304f] cursor-pointer">
              Office<span className="text-blue-400">MoM</span>
            </h1>
          )}
        </button>
        {isMobile && (
          <button
            className="text-2xl text-blue-400"
            onClick={() => setIsSidebarOpen(false)}
          >
            <RxCross2 />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {navItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.url}
            onClick={handleNavClick}
            title={isCollapsed ? item.heading : ""}
            className={({ isActive }) =>
              `text-left text-lg leading-5 font-semibold flex items-center cursor-pointer gap-4 
                px-4 py-4 rounded-2xl transition-all duration-300 whitespace-pre-wrap relative overflow-hidden group
                ${isCollapsed ? "text-xs px-2 justify-center" : "justify-start"}
                ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transform scale-[1.02]"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:shadow-md hover:text-blue-600 dark:hover:text-blue-400"
                }`
            }
          >
            <div className="flex justify-center items-center rounded-full bg-blue-400 min-w-12 min-h-12">
              <img src={item.icon} alt="" className="w-8 h-8" />
            </div>
            {!isCollapsed &&
              (item.heading === "Join Online Meeting" ? (
                <h1>
                  Join Online Meeting{" "}
                  <span className="text-sm">(Gmeet, Zoom Etc)</span>
                </h1>
              ) : (
                item.heading
              ))}
          </NavLink>
        ))}
      </div>

      {email && fullName && token && (
        <div className="absolute bottom-4 w-[90%]">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/30 dark:border-gray-700/50">
            <div className="flex justify-between w-full items-center">
              <div className="flex gap-3 justify-start items-center max-w-[90%]">
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex justify-center items-center text-2xl text-white shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {profileImage?.profileImage ? (
                    <img
                      src={profileImage?.profileImage}
                      alt="profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <IoPerson />
                  )}
                </motion.div>
                <div className="flex flex-col  max-w-[78%]  overflow-hidden">
                  <motion.h1
                    className="text-gray-800 dark:text-white text-lg font-bold truncate"
                    style={{ maxWidth: "200px" }}
                    whileHover={{ scale: 1.02 }}
                  >
                    {fullName}
                  </motion.h1>
                  <motion.p
                    className="text-gray-600 dark:text-gray-300 text-sm font-medium truncate max-w-[100%] overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                  >
                    {email}
                  </motion.p>
                </div>
              </div>

              <div className="relative" ref={dropdownRef}>
                <motion.div
                  className="p-2 cursor-pointer rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <BsThreeDotsVertical className="text-gray-600 dark:text-gray-300" />
                </motion.div>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="absolute right-0 bottom-12 mt-2 w-40 bg-white/95 dark:bg-gray-800/95 
                        backdrop-blur-sm shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <Link
                      to="profile"
                      onClick={() => {
                        setDropdownOpen((prev) => !prev);
                        if (isMobile) setIsSidebarOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold 
                          text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 
                          hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                    >
                      <IoPersonCircleSharp className="text-lg" /> Profile
                    </Link>
                    <motion.button
                      onClick={handleLogout}
                      className="flex items-center cursor-pointer gap-3 w-full px-4 py-3 text-sm font-semibold 
                          text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 
                          hover:text-red-600 dark:hover:text-red-400 transition-all"
                      whileHover={{ x: 5 }}
                    >
                      <TbLogout2 className="text-lg" /> Logout
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  return (
    <>
      {isMobile && !isSidebarOpen && (
        <button
          className="p-3 text-2xl text-blue-400 fixed top-4 left-4 z-50 bg-white rounded-full"
          onClick={() => setIsSidebarOpen(true)}
        >
          <FiMenu />
        </button>
      )}
      {isMobile
        ? isSidebarOpen && (
            <motion.div
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="fixed top-0 left-0 h-full z-50"
            >
              {SidebarContent}
            </motion.div>
          )
        : SidebarContent}
    </>
  );
};

export default SideBar;
