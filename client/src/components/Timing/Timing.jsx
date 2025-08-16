import { useState, useEffect, useRef } from "react";
import { countryToLanguage, languages } from "../Language";
import { FiChevronDown } from "react-icons/fi";

const Timing = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userCountry, setUserCountry] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_LANGUAGE_URL}`);
        const data = await res.json();
        setUserCountry(data.country);
        if (data.country && countryToLanguage[data.country]) {
          setSelectedLanguage(countryToLanguage[data.country]);
        }
      } catch (error) {
        console.error("Location fetch error:", error);
      }
    };
    fetchLocation();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLanguages = languages.filter((lang) =>
    lang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full" ref={dropdownRef}>
      <p className="dark:text-white text-black md:text-xl text-lg mb-2">
        Choose the language.{" "}
        <span className="md:text-sm dark:text-gray-200 text-gray-800">
          We can detect mixed language and accent.
        </span>
      </p>
      <div className="relative mt-1 border border-white dark:border-white/20 shadow-lg rounded-lg p-3 bg-white dark:bg-gray-900">
        <p className="text-gray-800 dark:text-gray-400 text-sm mb-1">
          Recommended based on your location:{" "}
          <b>{userCountry ? `🇺🇳 ${userCountry}` : "Detecting..."}</b>
        </p>
        <div
          className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg p-2 cursor-pointer select-none"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <span className=" text-black dark:text-gray-300">{selectedLanguage}</span>
          <FiChevronDown />
        </div>
        {showDropdown && (
          <div className="absolute dark:text-white left-3 right-3 mt-1 bg-white dark:bg-gray-900 border border-gray-300 rounded-lg shadow-lg max-h-56 overflow-y-auto z-50">
            <input
              type="text"
              placeholder="Search language..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border-b border-gray-200 outline-none dark:text-white"
              autoFocus
            />
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang, i) => (
                <div
                  key={i}
                  className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-gray-800 cursor-pointer select-none"
                  onClick={() => {
                    setSelectedLanguage(lang);
                    setShowDropdown(false);
                    setSearchTerm("");
                  }}
                >
                  {lang}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-400 select-none">
                No results
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default Timing;
