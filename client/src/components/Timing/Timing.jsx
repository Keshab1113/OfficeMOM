import { useState, useEffect, useRef } from "react";
import { countryToLanguage, languages } from "../Language";
import { FiChevronDown, FiX } from "react-icons/fi";
import axios from "axios";

const Timing = () => {
  const [selectedLanguages, setSelectedLanguages] = useState(["English"]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const [location, setLocation] = useState(null);

  // useEffect(() => {
  //   const fetchLocation = async (lat, lon) => {
  //     try {
  //       const url =
  //         lat && lon
  //           ? `${
  //               import.meta.env.VITE_BACKEND_URL
  //             }/api/location?lat=${lat}&lon=${lon}`
  //           : `/api/location`;

  //       const res = await axios.get(url);
  //       setLocation(res.data.data);

  //       if (res.data.data) {
  //         const recommended = Array.isArray(countryToLanguage[res.data.data.country])
  //           ? countryToLanguage[res.data.data.country]
  //           : [countryToLanguage[res.data.data.country]];

  //         setSelectedLanguages((prev) => [
  //           ...new Set([...prev, ...recommended]),
  //         ]);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch location:", err);
  //     }
  //   };

  //   // Try browser geolocation first
  //   if (navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition(
  //       (position) => {
  //         fetchLocation(position.coords.latitude, position.coords.longitude);
  //       },
  //       (error) => {
  //         console.warn(
  //           "Geolocation failed, falling back to IP:",
  //           error.message
  //         );
  //         fetchLocation(); // fallback to IP
  //       }
  //     );
  //   } else {
  //     // No geolocation support
  //     fetchLocation();
  //   }
  // }, []);

  useEffect(() => {
    const fetchLocation = async (lat, lon) => {
      try {
        const url =
          lat && lon
            ? `${import.meta.env.VITE_BACKEND_URL}/api/location?lat=${lat}&lon=${lon}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/location`;

        const res = await axios.get(url);
        setLocation(res.data.data);

        if (res.data.data) {
          const recommended = Array.isArray(countryToLanguage[res.data.data.country])
            ? countryToLanguage[res.data.data.country]
            : [countryToLanguage[res.data.data.country]];

          setSelectedLanguages((prev) => [
            ...new Set([...prev, ...recommended]),
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch location:", err);
      }
    };

    // iOS-compatible geolocation
    if (navigator.geolocation) {
      // Add timeout and higher accuracy settings for iOS
      const options = {
        enableHighAccuracy: false, // Set to false for faster response on iOS
        timeout: 10000, // 10 seconds timeout (iOS can be slow)
        maximumAge: 300000 // Accept cached position up to 5 minutes old
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn(
            `Geolocation failed (${error.code}: ${error.message}), falling back to IP`
          );
          alert(
            `Geolocation failed (${error.code}: ${error.message}), falling back to IP`
          );
          // Fallback to IP-based location
          fetchLocation();
        },
        options // Pass options for iOS compatibility
      );
    } else {
      // No geolocation support
      fetchLocation();
    }
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

  const toggleLanguage = (lang) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  return (
    <div className="w-full" ref={dropdownRef}>
      <div className="relative mt-1 border border-white dark:border-white/20 shadow-lg rounded-lg p-3 bg-white dark:bg-gray-900/30">
        <p className="text-gray-800 dark:text-gray-400 text-sm mb-1">
          Recommended based on your location:{" "}
          <b>
            {location ? `${location.country}` : "Detecting..."}
          </b>
        </p>
        <div
          className="relative bg-white dark:bg-gray-800 border border-gray-300 dark:border-white/20 rounded-lg p-2 cursor-pointer select-none"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="flex flex-wrap gap-2 pr-6">
            {selectedLanguages.length > 0 ? (
              selectedLanguages.map((lang, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 bg-blue-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 px-2 py-1 rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  {lang}
                </span>
              ))
            ) : (
              <span className="text-gray-400 dark:text-gray-500">
                Select languages...
              </span>
            )}
          </div>

          <FiChevronDown
            className={`absolute right-2 top-1/2 -translate-y-1/2 text-black dark:text-gray-300 transition-transform ${showDropdown ? "rotate-180" : ""
              }`}
          />
        </div>

        {showDropdown && (
          <div className="absolute left-3 right-3 mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-56 overflow-y-auto z-50">
            <input
              type="text"
              placeholder="Search language..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border-b border-gray-200 dark:border-gray-600 outline-none dark:text-white"
              autoFocus
            />
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang, i) => (
                <div
                  key={i}
                  className={`px-3 py-2 dark:text-white cursor-pointer select-none flex justify-between items-center
                    ${selectedLanguages.includes(lang)
                      ? "bg-blue-100 dark:bg-gray-700 font-semibold"
                      : "hover:bg-blue-100 dark:hover:bg-gray-800"
                    }`}
                  onClick={() => toggleLanguage(lang)}
                >
                  {lang}
                  {selectedLanguages.includes(lang) && (
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                  )}
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
