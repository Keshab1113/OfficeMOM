import { Outlet, useLocation } from "react-router-dom";
import Footer from "./components/Footer/Footer";
import SideBar from "./components/SideBar/SideBar";
import Header from "./components/Header/Header";
import ChatBot from "./components/ChatBot/ChatBot";
import { useState, useEffect } from "react";

function Layout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState("5rem");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const hiddenRoutes = [
    // "/join-meeting/",
    // "/pricing",
    // "/contact-us",
    // "/features",
    // "/about-us",
    // "/documentation",
    // "/privacy-policy",
    "/login",
    "/signup",
    "/forgot-password",
    // "/momGenerate/",
    // "/terms-of-service",
  ];
  const hideSidebar = hiddenRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  const hiddenRoutes2 = [
    // "/meeting",
    // "/audio-notes",
    // "/live-meeting",
    "/login",
    "/signup",
    "/forgot-password",
  ];

  const hideHeader = hiddenRoutes2.some((path) =>
    location.pathname.startsWith(path)
  );

  // Synchronized animation
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setSidebarWidth(isCollapsed ? "5rem" : "20rem");
      setIsTransitioning(false);
    }, 0); // Match the sidebar transition duration
    
    return () => clearTimeout(timer);
  }, [isCollapsed]);

  return (
    <section className="w-full overflow-hidden min-h-screen relative">
      {!hideHeader && <Header />}
      <div 
        className={`flex dark:bg-black bg-white p-0 overflow-hidden h-screen ${!hideHeader && "lg:pt-0 pt-16"}`}
      >
        {!hideSidebar && (
          <div className="fixed top-0 left-0 z-40 lg:relative">
            <SideBar 
              isCollapsed={isCollapsed} 
              setIsCollapsed={setIsCollapsed} 
            />
          </div>
        )}
        <main 
          style={{
            // marginLeft: !hideSidebar ? sidebarWidth : "0rem",
            transition: isTransitioning ? "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : "none"
          }}
          className={`w-full ${!hideSidebar ? "lg:block lg:pt-20" : ""}`} 
          id="scrollableMain"
        >
          <Outlet />
          <ChatBot/>
        </main>
      </div>
    </section>
  );
}

export default Layout;