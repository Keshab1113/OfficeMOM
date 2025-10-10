import { cn } from "../../lib/utils";
import ProfilImageUploader from "../../components/ProfileImageUploader/ProfileImageUploader";
import Footer from "../../components/Footer/Footer";
import History from "../../components/History/History";
import { Helmet } from "react-helmet";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";

const breadcrumbItems = [{ label: "Profile" }];

const Profile = () => {
  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | UserProfile</title>
        <link rel="canonical" href="https://officemom.me/profile" />
      </Helmet>
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
          </div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
          </div>
        </div>
        
        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll ">
          <div className=" min-h-screen lg:px-20 md:px-10 px-4 py-20 lg:py-28 flex flex-col md:gap-20 gap-10">
            <Breadcrumb items={breadcrumbItems} />
            <ProfilImageUploader />
            <div className=" grid md:grid-cols-2 grid-cols-1 gap-10 ">
              <History title="History - Meeting Under Progress" />
              <History />
            </div>
          </div>
          <Footer />
        </div>
        <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-float"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
        <div className="absolute bottom-32 right-32 w-5 h-5 bg-green-400 rounded-full opacity-40 animate-float animation-delay-1500"></div>
      </section>
    </>
  );
};

export default Profile;
