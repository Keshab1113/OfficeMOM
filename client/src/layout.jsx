import { Outlet, useLocation } from "react-router-dom";
import Footer from "./components/Footer/Footer";
import SideBar from "./components/SideBar/SideBar";
import Header from "./components/Header/Header";
import ChatBot from "./components/ChatBot/ChatBot";
import { useState, useEffect } from "react";
import { useAutoHideHeader } from "./hooks/useAutoHideHeader"; // Create this hook file

function Layout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState("5rem");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Use auto-hide header for specific routes
  const floatingHeaderRoutes = [
    "/meeting",
    "/audio-notes", 
    "/live-meeting",
  ];
  
  const shouldUseFloatingHeader = floatingHeaderRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  const isHeaderVisible = useAutoHideHeader();

  const hiddenRoutes = [
    "/join-meeting/",
    "/login",
    "/signup",
    "/forgot-password",
  ];
  const hideSidebar = hiddenRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  const hiddenRoutes2 = [
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
      {!hideHeader && (
        <Header 
          isVisible={!shouldUseFloatingHeader || isHeaderVisible} 
        />
      )}
      <div 
        className={`flex dark:bg-black bg-white p-0 overflow-hidden h-screen ${
          !hideHeader && !shouldUseFloatingHeader ? "lg:pt-0 pt-16" : ""
        }`}
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
            transition: isTransitioning ? "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : "none"
          }}
          className={`w-full ${(!hideSidebar && !shouldUseFloatingHeader) ? "lg:block lg:pt-20" : "pt-16 lg:pt-0"} ${
            shouldUseFloatingHeader ? "pt-0" : ""
          }`} 
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