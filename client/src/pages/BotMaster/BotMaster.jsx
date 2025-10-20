import React, { useState, useEffect } from "react";
import axios from "axios";
import { Helmet } from "react-helmet";

const BotMaster = () => {
  const [meetingData, setMeetingData] = useState({
    meetingLink: "",
    scheduledTime: "",
    meetingTitle: "",
    duration: 60,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [activeTab, setActiveTab] = useState("schedule");
  const [botStatus, setBotStatus] = useState("idle");

  // Fetch meetings and bot status on component mount
  useEffect(() => {
    fetchMeetings();
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 5000); // Update status every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/bot-meetings");
      setMeetings(response.data.data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    }
  };

  const fetchBotStatus = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/bot/status");
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
      const response = await axios.post(
        "http://localhost:3000/api/bot-meetings",
        meetingData
      );
      setMessage("Meeting scheduled successfully! Bot will join at the specified time.");
      setMeetingData({
        meetingLink: "",
        scheduledTime: "",
        meetingTitle: "",
        duration: 60,
      });
      fetchMeetings(); // Refresh meetings list
      setActiveTab("meetings"); // Switch to meetings tab
    } catch (error) {
      setMessage(
        "Error scheduling meeting: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setMeetingData({
      ...meetingData,
      [e.target.name]: e.target.value,
    });
  };

  const deleteMeeting = async (meetingId) => {
    if (window.confirm("Are you sure you want to delete this meeting?")) {
      try {
        await axios.delete(`http://localhost:3000/api/bot-meetings/${meetingId}`);
        setMessage("Meeting deleted successfully!");
        fetchMeetings();
      } catch (error) {
        setMessage("Error deleting meeting: " + error.message);
      }
    }
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
        {/* Enhanced Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900/30">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300 dark:bg-purple-600 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-300 dark:bg-blue-600 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-300 dark:bg-indigo-600 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
          </div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
          </div>
        </div>

        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll ">
          <div className=" min-h-screen lg:px-20 md:px-10 px-4 py-10 mb-16 flex flex-col gap-0 w-full">
            {/* Header with Bot Status */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className={`w-3 h-3 rounded-full mr-2 ${getBotStatusColor()}`}></div>
                <span className="text-sm font-medium text-gray-600 capitalize">
                  Bot Status: {botStatus}
                </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Meeting Master
              </h1>
              <p className="text-lg text-gray-600">
                Automate meeting attendance and recording
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-1 shadow-lg max-w-full mx-auto">
              <button
                onClick={() => setActiveTab("schedule")}
                className={`flex-1 w-80 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === "schedule"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                Schedule Meeting
              </button>
              <button
                onClick={() => setActiveTab("meetings")}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === "meetings"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                My Meetings ({meetings.length})
              </button>
            </div>

            {message && (
              <div className={`max-w-2xl mx-auto mb-6 p-4 rounded-lg border ${
                message.includes("Error")
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
              <div className="max-w-2xl mx-auto">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 mb-8 border border-white/20">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Meeting Link */}
                      <div className="md:col-span-2">
                        <label htmlFor="meetingLink" className="block text-sm font-medium text-gray-700 mb-2">
                          Meeting Link *
                        </label>
                        <input
                          type="url"
                          id="meetingLink"
                          name="meetingLink"
                          value={meetingData.meetingLink}
                          onChange={handleChange}
                          placeholder="https://meet.google.com/xxx-xxxx-xxx"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>

                      {/* Meeting Title */}
                      <div className="md:col-span-2">
                        <label htmlFor="meetingTitle" className="block text-sm font-medium text-gray-700 mb-2">
                          Meeting Title *
                        </label>
                        <input
                          type="text"
                          id="meetingTitle"
                          name="meetingTitle"
                          value={meetingData.meetingTitle}
                          onChange={handleChange}
                          placeholder="Team Meeting"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>

                      {/* Scheduled Time */}
                      <div>
                        <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
                          Scheduled Time *
                        </label>
                        <input
                          type="datetime-local"
                          id="scheduledTime"
                          name="scheduledTime"
                          value={meetingData.scheduledTime}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>

                      {/* Duration */}
                      <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                          Duration (minutes) *
                        </label>
                        <input
                          type="number"
                          id="duration"
                          name="duration"
                          value={meetingData.duration}
                          onChange={handleChange}
                          min="1"
                          max="240"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Scheduling...
                        </div>
                      ) : (
                        "Schedule Bot Meeting"
                      )}
                    </button>
                  </form>
                </div>

                {/* Info Section */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8 border border-white/20">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
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
                      <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-gray-700">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Meetings List Tab */}
            {activeTab === "meetings" && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
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
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
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
                              <h4 className="font-semibold text-gray-900 text-lg mb-2">{meeting.meeting_title}</h4>
                              <p className="text-gray-600 text-sm mb-1">
                                <span className="font-medium">Link:</span> {meeting.meeting_link}
                              </p>
                              <p className="text-gray-600 text-sm mb-1">
                                <span className="font-medium">Scheduled:</span> {new Date(meeting.scheduled_time).toLocaleString()}
                              </p>
                              <p className="text-gray-600 text-sm">
                                <span className="font-medium">Duration:</span> {meeting.duration} minutes
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                                {meeting.status}
                              </span>
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
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Features Grid */}
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
                  <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className={`w-12 h-12 bg-${feature.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      {feature.icon}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-center mb-2">{feature.title}</h4>
                    <p className="text-sm text-gray-600 text-center">{feature.description}</p>
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