import { Outlet, useLocation } from "react-router-dom";
import Footer from "./components/Footer/Footer";
import SideBar from "./components/SideBar/SideBar";
import Header from "./components/Header/Header";
import ChatBot from "./components/ChatBot/ChatBot";

function Layout() {
  const location = useLocation();

  const hiddenRoutes = [
    "/join-meeting/",
    "/pricing",
    "/contact-us",
    "/features",
    "/about-us",
    "/documentation",
    "/privacy-policy",
    "/login",
    "/signup",
    "/forgot-password",
    "/momGenerate/",
    "/terms-of-service",
  ];
  const hideSidebar = hiddenRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  const hiddenRoutes2 = [
    "/meeting",
    "/audio-notes",
    "/live-meeting",
    "/login",
    "/signup",
    "/forgot-password",
  ];

  const hideHeader = hiddenRoutes2.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <section className="w-full overflow-hidden min-h-screen relative">
      {!hideHeader && <Header />}
      <div className={`flex dark:bg-black bg-white p-0 overflow-hidden h-screen ${!hideHeader && "lg:pt-20 pt-16"}`}>
        {!hideSidebar && (
          <div className=" absolute top-0">
            <SideBar />
          </div>
        )}
        <main className={` w-full  ${!hideSidebar && "lg:ml-[20rem]"}`} id="scrollableMain">
          <Outlet />
          
          <ChatBot/>
        </main>
      </div>
    </section>
  );
}

export default Layout;
