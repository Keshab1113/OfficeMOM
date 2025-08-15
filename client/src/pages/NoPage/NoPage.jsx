import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import somethingLost from '/Images/page_not_found.svg';

const NoPage = () => {
  return (
    <section className="relative flex h-full min-h-screen md:w-full w-screen items-center justify-center dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]">
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:20px_20px]",
          "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
        )}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)]"></div>
      <div className=" relative z-20 h-screen overflow-hidden flex flex-col items-center justify-center p-4">
        <img
          src={somethingLost}
          alt="404 Not Found"
          className="md:w-[40rem] w-[80%] h-auto mb-8"
          loading="lazy"
        />
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
          Oops! Page not found
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 text-center">
          The page you are looking for might have been removed or is temporarily
          unavailable.
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Go Back Home
        </Link>
      </div>
    </section>
  );
};
export default NoPage;
