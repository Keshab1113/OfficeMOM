import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiMenu } from "react-icons/fi";
import { RxCross2 } from "react-icons/rx";
import { setSidebarSelection } from "../../redux/sidebarSlice";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/authSlice";
import { persistor } from "../../redux/store";

const SideBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { email } = useSelector((state) => state.auth);

  const [active, setActive] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { heading: "Join Online Meeting", icon: "/Icons/writing.webp" },
    {
      heading: "Generate Notes from Audio/Video File",
      icon: "/Icons/video.webp",
    },
    { heading: "Record Live Meeting", icon: "/Icons/voice.webp" },
  ];

  // Detect mobile screen
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const handleClick = (index) => {
    if (!email) {
      navigate("/login");
      return;
    }
    setActive(index);
    dispatch(
      setSidebarSelection({
        heading: navItems[index].heading,
        subHeading: navItems[index].subHeading,
      })
    );
    navigate("/");
    if (isMobile) setIsSidebarOpen(false); // Close after click
  };

  const handleHomeClick = () => {
    setActive(null);
    dispatch(setSidebarSelection({ heading: "" }));
    if (isMobile) setIsSidebarOpen(false);
    navigate("/");
  };

  const handleLogout = () => {
    dispatch(logout());
    persistor.purge();
  };

  const SidebarContent = (
    <section
      className={`dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)] shadow-lg h-full min-h-screen py-10 sticky top-0 left-0 flex flex-col z-50 transition-all duration-300 border-r border-white/40
      ${isCollapsed ? "w-[5rem]" : "md:w-[20rem] w-screen 2xl:w-[22vw] px-10"}`}
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
          <button
            key={index}
            onClick={() => handleClick(index)}
            className={`text-left text-lg font-semibold flex items-center cursor-pointer gap-3 dark:text-white text-[#06304f] px-4 py-2 rounded-lg transition-all duration-300 whitespace-pre-wrap
              ${
                isCollapsed
                  ? "text-xs px-1 justify-center"
                  : active === index
                  ? "bg-blue-400 font-bold"
                  : "hover:bg-blue-400 justify-start"
              }`}
            title={isCollapsed ? item : ""}
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
          </button>
        ))}
      </div>
      {email && (
        <button
          onClick={handleLogout}
          className=" dark:text-white text-black font-bold cursor-pointer px-4 py-2 rounded absolute bottom-10 border border-solid border-gray-600"
        >
          Logout
        </button>
      )}
    </section>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      {isMobile && !isSidebarOpen && (
        <button
          className="p-3 text-2xl text-blue-400 fixed top-4 left-4 z-50 bg-white rounded-full"
          onClick={() => setIsSidebarOpen(true)}
        >
          <FiMenu />
        </button>
      )}

      {/* Sidebar */}
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
