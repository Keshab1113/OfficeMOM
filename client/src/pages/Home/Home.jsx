import Footer from "../../components/Footer/Footer";
import { cn } from "../../lib/utils";
import { Helmet } from "react-helmet";

const Home = () => {
  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | Home</title>
        <link rel="canonical" href="http://mysite.com/example" />
      </Helmet>
      <section className="relative flex h-full min-h-screen md:w-full w-screen items-center justify-center dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]">
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:20px_20px]",
            "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
          )}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)]"></div>
        <div className=" relative z-20 max-h-screen overflow-hidden overflow-y-scroll">
          <div className=" min-h-screen flex flex-col justify-center items-center px-4">
            <p className="relative text-center z-20 dark:bg-gradient-to-b dark:from-neutral-200 dark:to-neutral-500 bg-gradient-to-br from-black to-blue-500 bg-clip-text text-[34px] font-bold text-transparent md:text-5xl">
              Welcome to Office<span className="text-blue-400">MoM</span>
            </p>
            <p className="md:mt-3 mt-1 md:max-w-full max-w-[90%] text-center relative z-20 bg-gradient-to-b dark:from-white from-black to-blue-500 bg-clip-text text-base font-bold text-transparent md:text-xl">
              Automate Meeting Minutes Seamlessly
            </p>
            <p className="md:mt-20 mt-10 relative max-w-[90%] md:max-w-[80%] text-center z-20 bg-gradient-to-b dark:from-white from-black to-blue-500 bg-clip-text text-lg font-bold text-transparent md:text-2xl">
              Automate meeting minutes seamlessly with AI-powered transcription
              and smart formatting. Capture every detail without lifting a pen,
              from key points to action items. Get organized summaries
              instantly, ready to share with your team. Save time, improve
              accuracy, and keep every meeting productive.
            </p>
          </div>
          <Footer />
        </div>
      </section>
    </>
  );
};

export default Home;
