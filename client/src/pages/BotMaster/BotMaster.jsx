import React, { useState, useEffect } from "react";
import axios from "axios";
import { Helmet } from "react-helmet";
import { useSelector } from "react-redux";

const BotMaster = () => {
  const [meetingData, setMeetingData] = useState({
    meetingLink: "",
    scheduledTime: "",
    meetingTitle: "",
    participants: "",
    duration: 60,
    joinUntilEnd: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [activeTab, setActiveTab] = useState("schedule");
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [botStatus, setBotStatus] = useState("idle");
  const { token } = useSelector((state) => state.auth);

  // Fetch meetings and bot status on component mount
  useEffect(() => {
    fetchMeetings();
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/bot-meetings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMeetings(response.data.data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    }
  };

  const fetchBotStatus = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/bot/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBotStatus(response.data.data.status);
    } catch (error) {
      console.error("Error fetching bot status:", error);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setMessage("");

  try {
    // Simple payload without complex data
    const payload = {
      meetingLink: meetingData.meetingLink,
      scheduledTime: meetingData.scheduledTime,
      meetingTitle: meetingData.meetingTitle,
      duration: parseInt(meetingData.duration),
      participants: meetingData.participants || '',
      joinUntilEnd: Boolean(meetingData.joinUntilEnd)
    };

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bot-meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.success) {
      setMessage("Meeting scheduled successfully!");
      // Reset form and refresh
      setMeetingData({
        meetingLink: "",
        scheduledTime: "",
        meetingTitle: "",
        participants: "",
        duration: 60,
        joinUntilEnd: false,
      });
      fetchMeetings();
      setActiveTab("meetings");
    } else {
      setMessage("Error: " + (data.message || "Failed to schedule meeting"));
    }
  } catch (error) {
    setMessage("Network error. Please check your connection and try again.");
    console.error('Submission error:', error);
  } finally {
    setIsLoading(false);
  }
};

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMeetingData({
      ...meetingData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const deleteMeeting = async (meetingId) => {
    if (window.confirm("Are you sure you want to delete this meeting?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/bot-meetings/${meetingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMessage("Meeting deleted successfully!");
        fetchMeetings();
        setSelectedMeeting(null);
      } catch (error) {
        setMessage("Error deleting meeting: " + error.message);
      }
    }
  };

  const showMeetingDetails = async (meetingId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/bot-meetings/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSelectedMeeting(response.data.data);
    } catch (error) {
      setMessage("Error fetching meeting details: " + error.message);
    }
  };

  const closeMeetingDetails = () => {
    setSelectedMeeting(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'joined': return 'bg-blue-100 text-blue-800';
      case 'recording': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBotStatusColor = () => {
    switch (botStatus) {
      case 'recording': return 'bg-green-500 animate-pulse';
      case 'joined': return 'bg-blue-500';
      case 'scheduled': return 'bg-yellow-500';
      case 'completed': return 'bg-gray-500';
      case 'failed': return 'bg-red-500';
      case 'idle': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Smart Minutes of the Meeting (OfficeMoM) | BotMaster</title>
        <link rel="canonical" href="https://officemom.me/bot-master" />
      </Helmet>
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Background and other existing elements remain the same */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
          </div>
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
          </div>
        </div>

        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll">
          <div className="min-h-screen lg:px-20 md:px-10 px-4 py-10 mb-16 flex flex-col gap-0 w-full">
            {/* Header with Bot Status */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className={`w-3 h-3 rounded-full mr-2 ${getBotStatusColor()}`}></div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-100 capitalize">
                  Bot Status: {botStatus}
                </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Meeting Master
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-100">
                Automate meeting attendance and recording
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-1 shadow-lg max-w-full mx-auto">
              <button
                onClick={() => setActiveTab("schedule")}
                className={`flex-1 cursor-pointer w-80 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${activeTab === "schedule"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-blue-600"
                  }`}
              >
                Schedule Meeting
              </button>
              <button
                onClick={() => setActiveTab("meetings")}
                className={`flex-1 cursor-pointer py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${activeTab === "meetings"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-blue-600"
                  }`}
              >
                My Meetings ({meetings.length})
              </button>
            </div>

            {message && (
              <div className={`max-w-2xl mx-auto mb-6 p-4 rounded-lg border ${message.includes("Error")
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-green-50 border-green-200 text-green-700"
                }`}>
                <div className="flex items-center justify-center">
                  {message.includes("Error") ? (
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {message}
                </div>
              </div>
            )}

            {/* Schedule Meeting Tab */}
            {activeTab === "schedule" && (
              <div className="max-w-full w-full mx-auto">
                <div className="bg-white/90 dark:bg-gray-900/30 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 mb-8 border border-white/20">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Form Header */}
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Schedule New Meeting
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        Configure your automated meeting attendance and recording
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Left Column */}
                      <div className="space-y-6">
                        {/* Meeting Link */}
                        <div className="space-y-2">
                          <label htmlFor="meetingLink" className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Meeting Link *
                          </label>
                          <input
                            type="url"
                            id="meetingLink"
                            name="meetingLink"
                            value={meetingData.meetingLink}
                            onChange={handleChange}
                            placeholder="https://meet.google.com/xxx-xxxx-xxx"
                            className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                            required
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Supports Google Meet, Zoom, Teams, and other platforms
                          </p>
                        </div>

                        {/* Meeting Title */}
                        <div className="space-y-2">
                          <label htmlFor="meetingTitle" className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Meeting Title *
                          </label>
                          <input
                            type="text"
                            id="meetingTitle"
                            name="meetingTitle"
                            value={meetingData.meetingTitle}
                            onChange={handleChange}
                            placeholder="Weekly Team Sync"
                            className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                            required
                          />
                        </div>

                        {/* Bot Display Name */}
                        <div className="space-y-2">
                          <label htmlFor="participants" className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Bot Display Name
                          </label>
                          <input
                            type="text"
                            id="participants"
                            name="participants"
                            value={meetingData.participants}
                            onChange={handleChange}
                            placeholder="Enter name shown when bot joins"
                            className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            This name will be visible to other participants in the meeting
                          </p>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        {/* Scheduled Time */}
                        <div className="space-y-2">
                          <label htmlFor="scheduledTime" className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Scheduled Time *
                          </label>
                          <input
                            type="datetime-local"
                            id="scheduledTime"
                            name="scheduledTime"
                            value={meetingData.scheduledTime}
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-gray-100"
                            required
                          />
                        </div>

                        {/* Duration and Toggle Section */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Duration */}
                          <div className="space-y-2">
                            <label htmlFor="duration" className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Duration *
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                id="duration"
                                name="duration"
                                value={meetingData.duration}
                                onChange={handleChange}
                                min="1"
                                max="480"
                                className="w-full px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-gray-100 pr-12"
                                required
                              />
                              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                                mins
                              </span>
                            </div>
                          </div>

                          {/* Join Until End Toggle */}
                          <div className="space-y-2">
                            <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Meeting Mode
                            </label>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                              <label className="flex items-center cursor-pointer">
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    id="joinUntilEnd"
                                    name="joinUntilEnd"
                                    checked={meetingData.joinUntilEnd}
                                    onChange={handleChange}
                                    className="sr-only"
                                  />
                                  <div className={`block w-12 h-6 rounded-full transition-colors duration-200 ${meetingData.joinUntilEnd ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}></div>
                                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${meetingData.joinUntilEnd ? 'transform translate-x-6' : ''
                                    }`}></div>
                                </div>
                                <div className="ml-3">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Join until end
                                  </span>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Stay until meeting concludes
                                  </p>
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                          <div className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Automated Recording
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                The bot will join automatically at the scheduled time and record the meeting. Other participants will see the bot display name.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Scheduling Meeting...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Schedule Bot Meeting</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Info Section - remains the same */}
                <div className="bg-white/90 dark:bg-gray-900/30 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8 border border-white/20">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    How it works
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      "Enter the meeting link and scheduled time",
                      "The bot automatically joins at the specified time",
                      "Audio is recorded and stored securely",
                      "Access recordings later for review"
                    ].map((text, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 dark:text-gray-100 dark:bg-gray-900/30 rounded-lg hover:bg-blue-100 hover:dark:bg-gray-800/40 transition-colors duration-200">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 dark:text-gray-100">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Meetings List Tab */}
            {activeTab === "meetings" && (
              <div className="max-w-full w-full mx-auto">
                <div className="bg-white/90 dark:bg-gray-900/30 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Scheduled Meetings
                  </h3>

                  {meetings.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500 text-lg">No meetings scheduled yet</p>
                      <button
                        onClick={() => setActiveTab("schedule")}
                        className="mt-4 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                      >
                        Schedule Your First Meeting
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {meetings.map((meeting) => (
                        <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-2">{meeting.meeting_title}</h4>
                              <p className="text-gray-600 dark:text-gray-100 text-sm mb-1">
                                <span className="font-medium">Link:</span> {meeting.meeting_link}
                              </p>
                              <p className="text-gray-600 dark:text-gray-100 text-sm mb-1">
                                <span className="font-medium">Scheduled:</span> {new Date(meeting.scheduled_time).toLocaleString()}
                              </p>
                              <p className="text-gray-600 dark:text-gray-100 text-sm">
                                <span className="font-medium">Duration:</span> {meeting.duration} minutes
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`px-3 py-1 capitalize rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                                {meeting.status}
                              </span>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => showMeetingDetails(meeting.id)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                  title="View details"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => deleteMeeting(meeting.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors duration-200"
                                  title="Delete meeting"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meeting Details Modal */}
            {selectedMeeting && (
              <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">Meeting Details</h3>
                      <button
                        onClick={closeMeetingDetails}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
                        <p className="text-gray-900 font-semibold">{selectedMeeting.meeting_title}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                        <p className="text-blue-600 break-all">{selectedMeeting.meeting_link}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
                        <p className="text-gray-900">{new Date(selectedMeeting.scheduled_time).toLocaleString()}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <p className="text-gray-900">{selectedMeeting.duration} minutes</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedMeeting.status)}`}>
                          {selectedMeeting.status}
                        </span>
                      </div>

                      {selectedMeeting.participants && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
                          <p className="text-gray-900">{selectedMeeting.participants}</p>
                        </div>
                      )}

                      {selectedMeeting.participants && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bot Display Name</label>
                          <p className="text-gray-900">{selectedMeeting.participants}</p>
                          <p className="text-sm text-gray-500">This name will be shown when bot joins the meeting</p>
                        </div>
                      )}

                      {selectedMeeting.recording_path && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Recording</label>
                          <a
                            href={selectedMeeting.recording_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          >
                            View Recording
                          </a>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Join Until End</label>
                        <p className="text-gray-900">{selectedMeeting.join_until_end ? 'Yes' : 'No'}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={closeMeetingDetails}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features Grid - remains the same */}
            <div className="max-w-4xl mx-auto mt-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: (
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    title: "Automated",
                    description: "Join meetings automatically at scheduled times",
                    color: "green"
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    ),
                    title: "Record Audio",
                    description: "High-quality audio recording with clear capture",
                    color: "purple"
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                    ),
                    title: "Cloud Storage",
                    description: "Secure cloud storage for all your recordings",
                    color: "orange"
                  }
                ].map((feature, index) => (
                  <div key={index} className="bg-white/90 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className={`w-12 h-12 bg-${feature.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      {feature.icon}
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">{feature.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-100 text-center">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Animation Elements */}
        <div className="absolute bottom-10 left-10 w-4 h-4 bg-indigo-400 rounded-full opacity-60 animate-bounce"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-40 animate-bounce animation-delay-1000"></div>
        <div className="absolute top-40 left-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-bounce animation-delay-2000"></div>
        <div className="absolute bottom-32 right-32 w-5 h-5 bg-green-400 rounded-full opacity-40 animate-bounce animation-delay-1500"></div>
      </section>
    </>
  );
};

export default BotMaster;