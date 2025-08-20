import { cn } from "../../lib/utils";
import ProfilImageUploader from "../../components/ProfileImageUploader/ProfileImageUploader";
import Footer from "../../components/Footer/Footer";
import History from "../../components/History/History";

const Profile = () => {
  return (
    <section className="relative h-full min-h-screen md:w-full w-screen dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]">
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:20px_20px]",
          "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
        )}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)]"></div>
      <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll ">
        <div className=" min-h-screen lg:px-20 md:px-10 px-4 py-20 lg:py-28 flex flex-col md:gap-20 gap-10">
          <ProfilImageUploader />
          <History />
        </div>
        <Footer />
      </div>
    </section>
  );
};

export default Profile;
