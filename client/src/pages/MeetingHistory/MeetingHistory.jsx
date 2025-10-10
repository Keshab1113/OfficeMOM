import React, { useEffect, useState } from "react";
import Footer from "../../components/Footer/Footer";
import { cn } from "../../lib/utils";
import RealTablePreview from "../../components/TablePreview/RealTablePreview";
import { Helmet } from "react-helmet";
import axios from "axios";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { saveTranscriptFiles } from "../../components/TextTable/TextTable";
import { useToast } from "../../components/ToastContext";
import DownloadOptions from "../../components/DownloadOptions/DownloadOptions";
import NoPage from "../NoPage/NoPage";

const MeetingHistory = () => {
  const [showFullData, setShowFullData] = useState(null);
  const [error, setError] = useState(null);
  const [detectLanguage, setDetectLanguage] = useState("");
  const { email, fullName, token } = useSelector((state) => state.auth);
  const { id } = useParams();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/history`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const foundItem = res.data.find((item) => item.id === parseInt(id));

        if (foundItem.data) {
          if (typeof foundItem.data === "string") {
            foundItem.data = JSON.parse(foundItem.data);
          }
          const transformedData = Array.isArray(foundItem.data)
            ? foundItem.data
            : [foundItem.data];
          setShowFullData(transformedData);
          setDetectLanguage(foundItem?.language);
        } else {
          setError("History item not found");
        }
      } catch (err) {
        console.error("Get history error:", err);
        setError("Failed to fetch data");
      }
    };
    fetchHistory();
  }, [token, id]);

  const HandleSaveTable = (data, downloadOptions) => {
    saveTranscriptFiles(data, addToast, downloadOptions, email, fullName);
    addToast("success", "File Downloaded");
  };

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | MeetingHistory</title>
        <link rel="canonical" href="https://officemom.me/momGenerate/" />
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
          <div className=" min-h-screen flex justify-center items-center md:py-4 py-10 ">
            {error ? (
              <NoPage />
            ) : (
              <RealTablePreview
                showFullData={showFullData || []}
                onSaveTable={(data, downloadOptions) => {
                  HandleSaveTable(data, downloadOptions);
                }}
                detectLanguage={detectLanguage}
              />
            )}
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

export default MeetingHistory;
