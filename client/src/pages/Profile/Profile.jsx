// Profile.jsx
import ProfilImageUploader from "../../components/ProfileImageUploader/ProfileImageUploader";
import Footer from "../../components/Footer/Footer";
import History from "../../components/History/History";
import { Helmet } from "react-helmet";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";
import SubscriptionCard from "../../components/SubscriptionCard/SubscriptionCard";
import UsageStats from "../../components/UsageStats/UsageStats";

const breadcrumbItems = [{ label: "Profile" }];

const Profile = () => {
  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Smart Minutes of the Meeting (OfficeMoM) | UserProfile</title>
        <link rel="canonical" href="https://officemom.me/profile" />
      </Helmet>
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Enhanced Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
            <div className="absolute top-3/4 left-1/3 w-60 h-60 bg-pink-300 dark:bg-pink-600 rounded-full blur-3xl animate-pulse-slow animation-delay-1500"></div>
          </div>

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(120,119,198,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(120,119,198,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
          </div>
        </div>

        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll">
          <div className="min-h-screen lg:px-4 md:px-4 px-4 py-20 lg:py-28 flex flex-col md:gap-12 gap-8 container mx-auto">
            <Breadcrumb items={breadcrumbItems} />

            {/* Main Content Grid */}
            <div className=" gap-8 space-y-4">
              <ProfilImageUploader />
              <div className=" flex lg:flex-row md:flex-col flex-col gap-4">
              <UsageStats />
              <SubscriptionCard />
              </div>
            </div>
          </div>
          <Footer />
        </div>

        {/* Floating Elements */}
        <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-float"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-float animation-delay-2000"></div>
        <div className="absolute bottom-32 right-32 w-5 h-5 bg-green-400 rounded-full opacity-40 animate-float animation-delay-1500"></div>
        <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-yellow-400 rounded-full opacity-50 animate-float animation-delay-3000"></div>
      </section>
    </>
  );
};

export default Profile;