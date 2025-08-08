import { useEffect, useState } from "react";
import { GoSun } from "react-icons/go";
import { LuSunMoon } from "react-icons/lu";

export default function DarkLight() {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      className="p-3 rounded-full dark:bg-gray-200 bg-gray-700 text-2xl dark:text-black text-white fixed md:top-10 md:right-10 top-4 right-4 z-40 cursor-pointer"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <GoSun/> : <LuSunMoon/>}
    </button>
  );
}
