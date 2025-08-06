import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMenu } from 'react-icons/fi';

const SideBar = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const token = localStorage.getItem("token");

  // Detect screen width
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const handleClick = (index) => {
    if (!token) return navigate("/login");
    setActive(index);
    navigate("/");
  };

  const navItems = [
    "Take Notes from Online Meeting",
    "Generate Notes from Video/Audio File",
    "Live Mic Recording"
  ];

  const SidebarContent = (
    <section
      className={`bg-black shadow-lg h-full min-h-screen p-4 sticky top-0 left-0 flex flex-col z-10 transition-all duration-300 border-r border-solid border-white/40 ${
        isCollapsed ? "w-[5rem]" : "w-[18rem] 2xl:w-[20vw]"
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        {!isCollapsed && <h1 className="text-2xl font-bold text-blue-600">SmartMOM</h1>}
        <button
          className="lg:hidden text-2xl text-blue-600"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <FiMenu />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className={`text-left text-white px-4 py-2 rounded-lg transition-all duration-300 hover:bg-blue-100 whitespace-pre-wrap ${
              active === index ? "bg-blue-200 font-semibold" : ""
            } ${isCollapsed ? "text-xs px-2" : ""}`}
            title={isCollapsed ? item : ""}
          >
            {!isCollapsed ? item : index + 1}
          </button>
        ))}
      </div>
    </section>
  );

  return isMobile ? (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      {SidebarContent}
    </motion.div>
  ) : (
    SidebarContent
  );
};

export default SideBar;
