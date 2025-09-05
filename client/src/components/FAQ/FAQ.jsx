import { useState } from "react";
import { useNavigate } from "react-router-dom";

const faqs = [
  {
    question: "What is OfficeMoM?",
    answer:
      "OfficeMoM is an intelligent meeting management platform that transforms how teams collaborate. It provides real-time transcription, smart summaries, and seamless integration with your favorite tools to make every meeting more productive and accessible.",
    category: "General"
  },
  {
    question: "How does OfficeMoM handle online meetings?",
    answer:
      "OfficeMoM integrates seamlessly with all major video conferencing platforms including Google Meet, Zoom, Microsoft Teams, and Webex. Simply invite our AI assistant to your meeting or use our browser extension for automatic transcription and note-taking.",
    category: "Integration"
  },
  {
    question: "Can I use OfficeMoM for in-person meetings?",
    answer:
      "Absolutely! OfficeMoM works perfectly for offline meetings too. Use our mobile app or web platform to record audio, generate live transcripts, and create meeting summaries even when you're meeting face-to-face.",
    category: "Features"
  },
  {
    question: "What are the pricing options?",
    answer:
      "OfficeMoM offers a generous free tier with up to 5 hours of transcription per month. Our Pro plan starts at $12/month with unlimited transcription, advanced AI features, and team collaboration tools. Enterprise solutions are available for larger organizations.",
    category: "Pricing"
  },
  {
    question: "Is there a mobile app available?",
    answer:
      "Yes! OfficeMoM is available on iOS and Android with full feature parity. The mobile app offers offline recording, real-time sync, and push notifications to keep you connected wherever you are.",
    category: "Platform"
  },
  {
    question: "Which languages are supported?",
    answer:
      "OfficeMoM supports over 160+ languages with industry-leading accuracy. Our AI can detect languages automatically, handle multilingual meetings, and provide translations in real-time, making it perfect for global teams.",
    category: "Features"
  },
  {
    question: "How secure is my meeting data?",
    answer:
      "Security is our top priority. All data is encrypted end-to-end, stored in SOC 2 compliant data centers, and we never use your meeting content to train our AI models. You maintain full control over your data with granular privacy settings.",
    category: "Security"
  },
  {
    question: "Can I integrate with my existing workflow?",
    answer:
      "Definitely! OfficeMoM integrates with 50+ tools including Slack, Notion, Trello, Asana, Salesforce, and Google Workspace. Use our API or Zapier integration to create custom workflows that fit your team's needs.",
    category: "Integration"
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const nav = useNavigate();

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const categoryColors = {
    General: "bg-gradient-to-r from-blue-500 to-purple-600",
    Integration: "bg-gradient-to-r from-green-500 to-teal-600",
    Features: "bg-gradient-to-r from-orange-500 to-red-600",
    Pricing: "bg-gradient-to-r from-yellow-500 to-orange-600",
    Platform: "bg-gradient-to-r from-pink-500 to-rose-600",
    Security: "bg-gradient-to-r from-indigo-500 to-blue-600"
  };

  return (
    <div className="min-h-screen bg-blue-100 dark:bg-gray-800 transition-all duration-700">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 shadow-lg">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Frequently Asked Questions
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent mb-4">
              Got Questions?
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Find answers to everything you need to know about OfficeMoM and how it can transform your meetings.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 ${
                  openIndex === index ? 'ring-2 ring-blue-500/50 shadow-blue-500/20' : ''
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Category Badge */}
                <div className="absolute -top-2 left-6 z-10">
                  <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${categoryColors[faq.category]} shadow-lg`}>
                    {faq.category}
                  </span>
                </div>

                {/* Question Button */}
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex justify-between items-center px-8 py-6 pt-8 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-3xl transition-all duration-300"
                >
                  <span className="text-lg font-semibold text-gray-800 dark:text-gray-100 pr-4 leading-relaxed">
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${
                    openIndex === index 
                      ? 'bg-blue-500 text-white transform rotate-180' 
                      : hoveredIndex === index
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  }`}>
                    <svg 
                      className="w-4 h-4 transition-transform duration-300" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Answer */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-8 pb-6">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-600 to-transparent mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                      {faq.answer}
                    </p>
                  </div>
                </div>

                {/* Hover Effect Border */}
                <div className={`absolute inset-0 rounded-3xl transition-opacity duration-300 pointer-events-none ${
                  hoveredIndex === index && openIndex !== index
                    ? 'opacity-100 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10'
                    : 'opacity-0'
                }`}></div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-8 py-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                  Still have questions?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Our support team is here to help you get started.
                </p>
              </div>
              <button onClick={() => nav("/contact-us")} className="px-6 py-3 cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;