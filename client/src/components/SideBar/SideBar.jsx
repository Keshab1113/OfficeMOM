import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiMenu } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { setSidebarSelection } from "../../redux/sidebarSlice";
import { RxCross2 } from "react-icons/rx";

const SideBar = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // const token = localStorage.getItem("token");
  const dispatch = useDispatch();

  // Detect screen width
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const handleClick = (index) => {
    // if (!token) return navigate("/login");
    setActive(index);
    dispatch(
      setSidebarSelection({
        heading: navItems[index].heading,
        subHeading: navItems[index].subHeading,
      })
    );
    navigate("/");
  };

  const navItems = [
    {
      heading: "Online Meeting Bot",
      icon: "/Icons/writing.webp",
    },
    {
      heading: "Generate Notes from Audio File",
      icon: "/Icons/video.webp",
    },
    {
      heading: "Live Mic Recording",
      icon: "/Icons/voice.webp",
    },
  ];

  const handleHomeClick = () => {
    setActive(null);
    dispatch(
      setSidebarSelection({
        heading: "",
      })
    );
    if(!isCollapsed && isMobile) setIsCollapsed(!isCollapsed)
    navigate("/");
  };

  const SidebarContent = (
    <section
      className={`bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] shadow-lg h-full min-h-screen  py-10 sticky top-0 left-0 flex flex-col z-10 transition-all duration-300 border-r border-solid border-white/40 ${
        isCollapsed ? "w-[5rem]" : "md:w-[20rem] w-screen 2xl:w-[22vw] px-10"
      }`}
    >
      <div
        className={`flex items-center justify-between mb-16  
      ${isCollapsed ? "gap-10 flex-col-reverse" : ""}`}
      >
        <button onClick={handleHomeClick} className=" flex gap-2">
          <div className="w-10 h-10 cursor-pointer bg-gradient-to-r from-white to-blue-400 rounded-lg flex items-center justify-center">
            <img src="/logo.webp" alt="logo" loading="lazy" />
          </div>
          {!isCollapsed && (
            <h1 className="text-3xl font-bold text-white cursor-pointer">
              Office<span className="text-blue-400">MoM</span>
            </h1>
          )}
        </button>
        <button
          className="lg:hidden text-2xl text-blue-400"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed?
          <FiMenu />:<RxCross2/>}
        </button>
      </div>

      <div className="flex flex-col gap-8">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() =>{
              handleClick(index)
              if(!isCollapsed && isMobile) setIsCollapsed(!isCollapsed)
            }}
            className={`text-left text-lg font-semibold hover:cursor-pointer flex items-center gap-3 text-white px-4 py-2 rounded-lg transition-all duration-300  whitespace-pre-wrap
               ${
                 isCollapsed
                   ? "text-xs px-1 justify-center"
                   : active === index
                   ? "bg-blue-400 font-bold "
                   : "hover:bg-blue-400 justify-start"
               }`}
            title={isCollapsed ? item : ""}
          >
            <div className="flex justify-center items-center rounded-full bg-blue-400 min-w-12 min-h-12">
              <img src={item.icon} alt="" className=" w-8 h-8" />
            </div>
            {!isCollapsed && item.heading}
          </button>
        ))}
      </div>
    </section>
  );

  return isMobile ? (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      {SidebarContent}
    </motion.div>
  ) : (
    SidebarContent
  );
};

export default SideBar;
