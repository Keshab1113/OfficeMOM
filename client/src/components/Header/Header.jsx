import React, { useState, useEffect, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

const Header = ({ isVisible = true }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { token } = useSelector((state) => state.auth);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Ref for the mobile menu
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 1024);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both menu and menu button
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close menu when pressing Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isMenuOpen]);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Pricing", href: "/pricing", current: true },
    { name: "About", href: "/about-us" },
    { name: "Contact", href: "/contact-us" },
  ];

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

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleAuth = () => {
    if (token) {
      navigate("/meeting");
    } else {
      navigate("/login");
    }
  };

  const hiddenRoutes = [
    "/join-meeting/",
    "/login",
    "/signup",
    "/forgot-password",
  ];
  // const hiddenRoutes2 = [
  //   "/documentation",
  //   "/privacy-policy",
  //   "/terms-of-service",
  // ];
  const hideSidebar = hiddenRoutes.some((path) =>
    location.pathname.startsWith(path)
  );
  const needLogo = hiddenRoutes.some((path) =>
    location.pathname.startsWith(path)
  );
  // const fullWidthHeader = hiddenRoutes2.some((path) =>
  //   location.pathname.startsWith(path)
  // );
  const floatingHeaderRoutes = [
    "/meeting",
    "/generate-notes", 
    "/live-meeting",
  ];
  
  const shouldUseFloatingHeader = floatingHeaderRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed top-0 z-40 w-full transition-all duration-300  backdrop-blur-lg shadow-lg border-b border-gray-200 dark:border-gray-700 ${
          !isVisible ? "pointer-events-none" : ""
        } ${shouldUseFloatingHeader ? "lg:bg-white/40 lg:dark:bg-gray-900/40 bg-white dark:bg-gray-900" : "bg-white dark:bg-gray-900"}`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div
            className={`flex items-center h-16 lg:h-20 ${
              needLogo
                ? "md:justify-between justify-between"
                : "lg:justify-center justify-between"
            }`}
          >
            {/* Logo */}
            {(needLogo || isMobile) && (
              <div
                className={`flex-shrink-0 flex items-center  ${
                  hideSidebar ? "ml-0 md:ml-0" : "ml-12 lg:ml-0"
                }`}
              >
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center space-x-2 group"
                >
                  <div className="w-10 h-10 cursor-pointer bg-gradient-to-r from-white to-blue-400 rounded-lg flex items-center justify-center">
                    <img src="/logo.webp" alt="logo" loading="lazy" />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                    OfficeMoM
                  </span>
                </button>
              </div>
            )}
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => (
                <div key={item.name} className="relative">
                  <button
                    onClick={() => navigate(item.href)}
                    className={`px-4 py-2 cursor-pointer rounded-xl font-medium transition-all duration-200 ${
                      location.pathname === item.href
                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                        : "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {item.name}
                  </button>
                </div>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div
              className={`hidden lg:flex items-center space-x-4 ${
                needLogo ? "" : " md:absolute right-4"
              }`}
            >
              {!token && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleAuth}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer px-6 py-2 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center space-x-2">
                      <span>Get Started</span>
                    </div>
                  </button>
                </div>
              )}
              <button
                onClick={handleThemeToggle}
                className="p-2 cursor-pointer rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center ">
              <button
                onClick={handleThemeToggle}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* <button
                ref={menuButtonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 ml-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button> */}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed top-16 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            style={{
              width: "100%",
              paddingRight: "var(--scrollbar-width, 0px)",
            }}
          >
            <div className="px-4 py-6 space-y-4">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`block w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    location.pathname === item.href
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                      : "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add scrollbar width calculation */}
      <style jsx>{`
        :root {
          --scrollbar-width: ${typeof window !== "undefined"
            ? window.innerWidth - document.documentElement.clientWidth + "px"
            : "0px"};
        }
      `}</style>
    </>
  );
};

export default Header;