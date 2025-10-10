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
    saveTranscriptFiles(
      data,
      addToast,
      downloadOptions,
      email,
      fullName
    );
    addToast("success", "File Downloaded");
  };

  

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | MeetingHistory</title>
        <link rel="canonical" href="https://officemom.me/momGenerate/" />
      </Helmet>
      <section className="relative h-full min-h-screen md:w-full w-screen dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]">
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:20px_20px]",
            "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
          )}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)]"></div>
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
      </section>
    </>
  );
};

export default MeetingHistory;
