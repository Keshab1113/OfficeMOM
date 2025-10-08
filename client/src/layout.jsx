import { Outlet, useLocation } from "react-router-dom";
import Footer from "./components/Footer/Footer";
import SideBar from "./components/SideBar/SideBar";
import Header from "./components/Header/Header";

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
    "/forgot-password"
  ];
  const hideSidebar = hiddenRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  const hiddenRoutes2 = ["/meeting", "/audio-notes", "/live-meeting", "/login", "/signup", "/forgot-password"];

  const hideHeader = hiddenRoutes2.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <section className="w-full overflow-x-hidden">
      {!hideHeader && <Header />}
      <div className="mx-auto w-full flex min-h-screen overflow-x-hidden">
        {!hideSidebar && (
          <div className="">
            <SideBar />
          </div>
        )}
        <div className="flex-1 dark:bg-black bg-white relative p-0">
          <Outlet />
        </div>
      </div>
    </section>
  );
}

export default Layout;
