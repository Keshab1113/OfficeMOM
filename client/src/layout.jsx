import { Outlet, useLocation } from "react-router-dom";
import Footer from "./components/Footer/Footer";
import SideBar from "./components/SideBar/SideBar";
import Header from "./components/Header/Header";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

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
    // "/audio-notes"
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
    <section className="w-full overflow-hidden">
      <div className="mx-auto w-full flex min-h-screen overflow-hidden">
        {!hideSidebar && (
          <div className="">
            <SideBar />
          </div>
        )}
        <div className="flex-1 dark:bg-black bg-white relative p-0 overflow-hidden">
          {!hideHeader && <Header />}
          <Outlet />
          <ScrollToTop />
        </div>
      </div>
    </section>
  );
}

export default Layout;
