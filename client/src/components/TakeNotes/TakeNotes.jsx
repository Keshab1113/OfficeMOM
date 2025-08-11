import { useState, useEffect, useRef } from "react";
import { FiChevronDown } from "react-icons/fi";
import { FcConferenceCall } from "react-icons/fc";
import { countryToLanguage, languages } from "../Language";

const TakeNotes = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userCountry, setUserCountry] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch("http://ip-api.com/json/");
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
    <div className="relative z-20 flex flex-col items-center p-10 bg-[linear-gradient(45deg,white,#b4d6e0)] rounded-xl max-w-2xl md:w-full w-[90vw] shadow-lg">
      <p className="text-3xl font-bold text-gray-800">
        Take Notes from Online Meeting
      </p>
      <p className="text-sm text-gray-500 mt-1 text-center">
        Connect Zoom, Google Meet, or Teams link and generate automatic MoM.
      </p>

      <div className="mt-6 w-full">
        <p className="text-gray-600 text-sm mb-1">
          Choose the language.{" "}
          <span className="text-xs text-gray-400">
            We can detect mixed language and accent, rest assured.
          </span>
        </p>

        <div
          className="mt-3 border border-gray-300 rounded-lg p-3 bg-gray-50 relative"
          ref={dropdownRef}
        >
          <p className="text-gray-500 text-sm">
            Recommended based on your location:{" "}
            <b>{userCountry ? `🇺🇳 ${userCountry}` : "Loading..."}</b>
          </p>

          <div
            className="mt-2 flex items-center justify-between bg-white border border-gray-300 rounded-lg p-2 cursor-pointer relative"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span>{selectedLanguage}</span>
            <FiChevronDown />
          </div>

          {showDropdown && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-50 overflow-y-auto z-50">
              <input
                type="text"
                placeholder="Search language..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border-b border-gray-200 outline-none"
              />
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((lang, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
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
                <div className="px-3 py-2 text-gray-400">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className=" flex flex-col justify-center items-start w-full mt-6">
        <h1 className="text-gray-600 text-sm">
          Paste your Google Meet, Zoom, or Microsoft Teams URL
        </h1>
        <div className="mt-2 w-full flex items-center border border-gray-300 rounded-lg p-2">
          <FcConferenceCall className="text-blue-500 text-xl mr-2" />
          <input
            type="text"
            placeholder="Paste Google Meet, Zoom, or Microsoft Teams URL here"
            className="flex-1 outline-none"
          />
        </div>
      </div>

      <button className="mt-4 w-full py-3 rounded-lg text-white font-semibold bg-blue-400 cursor-pointer">
        Start making notes
      </button>

      <p className="text-xs text-gray-400 mt-2">
        Meeting cost is totally free now.
      </p>
    </div>
  );
};

export default TakeNotes;
