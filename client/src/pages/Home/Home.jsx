import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "../../lib/utils";

const Home = () => {
  return (
    <section className="relative flex h-full min-h-screen w-full items-center justify-center bg-black">
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:20px_20px]",
          "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
          "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]",
        )}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
      <div className=" flex flex-col justify-center items-center">
        <p className="relative z-20 bg-gradient-to-b from-neutral-200 to-neutral-500 bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
          Welcome to SmartMOM
        </p>
        <p className="mt-2 relative z-20 bg-gradient-to-b from-neutral-200 to-neutral-500 bg-clip-text text-xl font-bold text-transparent md:text-2xl">
          Automate Meeting Minutes Seamlessly
        </p>
      </div>

    </section>
  );
};

export default Home;