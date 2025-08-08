import { cn } from "../../lib/utils";
import { useSelector } from "react-redux";
import TakeNotes from "../../components/TakeNotes/TakeNotes";
import AudioFile from "../../components/AudioFile/AudioFile";

const Home = () => {
  const { heading } = useSelector((state) => state.sidebar);
  return (
    <section className="relative flex h-full min-h-screen w-full items-center justify-center dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]">
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:20px_20px]",
          "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
        )}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)]"></div>
      {heading === "" && (
        <div className=" flex flex-col justify-center items-center">
          <p className="relative text-center z-20 dark:bg-gradient-to-b dark:from-neutral-200 dark:to-neutral-500 bg-gradient-to-br from-black to-blue-500 bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
            Welcome to Office<span className="text-blue-400">MoM</span>
          </p>
          <p className="mt-3 md:max-w-full max-w-[90%] text-center relative z-20 bg-gradient-to-b dark:from-white from-black to-blue-500 bg-clip-text text-xl font-bold text-transparent md:text-xl">
            Automate Meeting Minutes Seamlessly
          </p>
          <p className="mt-20 relative max-w-[90%] md:max-w-[80%] text-center z-20 bg-gradient-to-b dark:from-white from-black to-blue-500 bg-clip-text text-xl font-bold text-transparent md:text-2xl">
            Automate meeting minutes seamlessly with AI-powered transcription
            and smart formatting. Capture every detail without lifting a pen,
            from key points to action items. Get organized summaries instantly,
            ready to share with your team. Save time, improve accuracy, and keep
            every meeting productive.
          </p>
        </div>
      )}
      {heading === "Join Online Meeting" && <TakeNotes />}
      {heading === "Generate Notes from Audio File" && <AudioFile />}
      {heading === "Record Live Meeting" && (
        <div className=" flex flex-col justify-center items-center">
          <p className="relative z-20 bg-gradient-to-b from-neutral-200 to-neutral-500 bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
            Sorry
          </p>
          <p className="mt-3 relative z-20 bg-gradient-to-b from-white to-blue-500 bg-clip-text text-xl font-bold text-transparent md:text-xl">
            We are working on this features
          </p>
        </div>
      )}
    </section>
  );
};

export default Home;
