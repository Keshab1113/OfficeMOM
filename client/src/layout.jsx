import { Outlet, useLocation } from "react-router-dom";
import Footer from "./components/Footer/Footer";
import SideBar from "./components/SideBar/SideBar";

function Layout() {
  const location = useLocation();
  const hideSidebar = location.pathname.startsWith('/join-meeting/');

  return (
    <section className="w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1700px] flex min-h-screen overflow-x-hidden">
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
