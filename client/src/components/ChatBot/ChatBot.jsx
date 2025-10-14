import React, { useState, useRef, useEffect } from "react";

const ChatBot = () => {
  const faqList = [
  {
    question: "what is officemom",
    answer:
      "Automate meeting minutes seamlessly with AI-powered transcription and smart formatting. Capture every detail without lifting a pen, from key points to action items. Get organized summaries instantly, ready to share with your team. Save time, improve accuracy, and keep every meeting productive.",
  },
  {
    question: "how to create an account",
    answer:
      "To create an account: 1) Visit our website 2) Click 'Create account' 3) Enter your full name, email, and password 4) Verify your email 5) Complete your profile setup.",
  },
  {
    question: "what are the pricing plans",
    answer:
      "We offer 5 plans: Free ($0), Professional ($9/month), Professional Plus ($19/month), Business ($37/month), and Business Plus ($55/month). All plans include core features with varying levels of minutes, speed, integrations, and support.",
  },
  {
    question: "is there a free trial",
    answer:
      "Yes! We offer a 300-minute (lifetime) free plan with a maximum of 30 minutes per meeting or file upload. No credit card required to start.",
  },
  {
    question: "how to reset password",
    answer:
      "Click 'Forgot Password' on the login page, enter your registered email, check your inbox for reset instructions, and follow the link to create a new password.",
  },
  {
    question: "how to contact support",
    answer:
      "You can contact support via email at support@officemom.me or through our in-app Live Chat available 24/7.",
  },
  {
    question: "what is your refund policy",
    answer:
      "We offer a 30-day money-back guarantee. If you're not satisfied, contact our support team within 30 days of purchase for a full refund.",
  },
  {
    question: "how to cancel subscription",
    answer:
      "You can cancel your subscription anytime by contacting support at support@officemom.me or from the Billing section in your account settings.",
  },
  {
    question: "can i upgrade or downgrade my plan",
    answer:
      "Yes! You can upgrade or downgrade your plan anytime from your Billing dashboard. Changes take effect immediately, and any unused minutes are carried forward for 7 days.",
  },
  {
    question: "do unused minutes roll over to the next month",
    answer:
      "Unused minutes do not roll over automatically, except in Business and Business Plus plans, which offer a 15-day carry-over period.",
  },
  {
    question: "what payment methods do you accept",
    answer:
      "We accept all major credit/debit cards, PayPal, and Razorpay. Enterprise clients can also opt for invoice-based payments.",
  },
  {
    question: "can i use officemom on mobile devices",
    answer:
      "Yes! Our web interface is fully mobile-optimized. You can access all features from your phone’s browser without downloading an app.",
  },
  {
    question: "what browsers are supported",
    answer:
      "We support Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+. For the best experience, always use the latest version of your browser.",
  },
  {
    question: "how secure is my data",
    answer:
      "We use enterprise-grade security, including SSL encryption, SOC 2 compliance, encrypted data storage, and 24/7 monitored servers. Your files and transcripts are private and never shared.",
  },
  {
    question: "where is my data stored",
    answer:
      "All data is securely stored on encrypted servers located in GDPR-compliant regions. You can request data deletion at any time from your profile settings.",
  },
  {
    question: "can i integrate officemom with other tools",
    answer:
      "Yes, OfficeMoM integrates with Google Meet, Zoom, Microsoft Teams, and Slack. Business and Business Plus users can connect via custom API integrations.",
  },
  {
    question: "does officemom offer transcription in multiple languages",
    answer:
      "Yes, OfficeMoM supports English (US/UK), Spanish, French, Hindi, etc.",
  },
  {
    question: "how accurate are the transcriptions",
    answer:
      "Our AI transcription engine achieves up to 99% accuracy in clear audio conditions. Background noise, accents, and overlapping speech may slightly affect accuracy.",
  },
  {
    question: "can multiple team members use the same account",
    answer:
      "Team management is available for Business and Business Plus plans. You can add members, assign roles, and manage permissions under the Team tab.",
  },
  {
    question: "can i download or export transcripts",
    answer:
      "Yes! You can export transcripts as Word and excel file. Professional Plus and above plans also include advanced export options with formatting and summaries.",
  },
  {
    question: "is API access available",
    answer:
      "Yes, API access is available for Business and Business Plus users. You can integrate OfficeMoM transcription into your existing workflow using secure API endpoints.",
  },
  {
    question: "how to delete my account",
    answer:
      "Contact us at support@officemom.me.",
  },
  {
    question: "do you offer discounts for education or non-profits",
    answer:
      "No. Contact us at support@officemom.me for further details.",
  },
  {
    question: "how often do you update officemom",
    answer:
      "We continuously release updates every 2–3 weeks, improving transcription accuracy, adding features, and enhancing performance.",
  },
];


  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your OfficeMoM support assistant. How can I help you with our project management software today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);
    setError(null);

    // Auto expand textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }

    // ✅ Filter FAQ suggestions (case-insensitive)
    if (value.trim().length > 0) {
      const lower = value.toLowerCase();
      const filtered = faqList.filter((faq) =>
        faq.question.toLowerCase().includes(lower)
      );
      setSuggestions(filtered.slice(0, 5)); // show max 5 suggestions
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (faq) => {
    const userMessage = {
      id: Date.now(),
      text: faq.question,
      isUser: true,
      timestamp: new Date(),
    };
    const botMessage = {
      id: Date.now() + 1,
      text: faq.answer,
      isUser: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInputMessage("");
    setSuggestions([]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    // Check if matches FAQ
    const match = faqList.find(
      (faq) => faq.question.toLowerCase() === inputMessage.trim().toLowerCase()
    );
    if (match) {
      const botMessage = {
        id: Date.now() + 1,
        text: match.answer,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage, botMessage]);
      setInputMessage("");
      setSuggestions([]);
      return;
    }

    // No match — call API
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setSuggestions([]);
    setError(null);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text,
      }));

      const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputMessage.trim(),
          conversationHistory,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.error || "Failed to send message");

      const botMessage = {
        id: Date.now() + 1,
        text: data.data.message,
        isUser: false,
        timestamp: new Date(data.data.timestamp),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I apologize, but I'm having trouble connecting to the support service right now. Please try again in a moment or contact our support team directly at support@officemom.me",
        isUser: false,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your OfficeMoM support assistant. How can I help you with our project management software today?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed cursor-pointer bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:shadow-indigo-500/50 z-50 group"
          aria-label="Open chat support"
        >
          <svg
            className="w-7 h-7 group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 md:right-6 right-2 w-[400px] h-[650px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col z-50 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300">
          {/* Header with Gradient */}
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 py-5 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="flex items-center space-x-3 relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/30">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  OfficeMoM Support
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  <p className="text-white/90 text-sm font-medium">Online</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 relative z-10">
              <button
                onClick={clearChat}
                className="text-white/70 cursor-pointer hover:text-white hover:bg-white/20 transition-all p-2 rounded-xl backdrop-blur-sm"
                aria-label="Clear chat"
                title="Clear conversation"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 cursor-pointer hover:text-white hover:bg-white/20 transition-all p-2 rounded-xl backdrop-blur-sm"
                aria-label="Close chat"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            {messages.map((message, idx) => (
              <div
                key={message.id}
                className={`flex ${
                  message.isUser ? "justify-end" : "justify-start"
                } animate-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
                    message.isUser
                      ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-md shadow-indigo-500/20"
                      : message.isError
                      ? "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 rounded-bl-md"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700 shadow-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.text}
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      message.isUser
                        ? "text-indigo-200"
                        : message.isError
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-5 py-4 border border-gray-200 dark:border-gray-700 shadow-md">
                  <div className="flex space-x-2">
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full border dark:border-gray-600 border-gray-400 rounded-2xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                  rows="2"
                />
                {/* ✅ Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <ul className="absolute dark:border-gray-600 border-gray-400 bottom-full mb-2 left-0 right-0 bg-white dark:bg-gray-800 border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((faq, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSuggestionClick(faq)}
                        className="p-2 text-sm dark:text-gray-100  cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900"
                      >
                        {faq.question}?
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-2xl px-5 py-3 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl disabled:shadow-none hover:scale-105 active:scale-95"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3 flex items-center justify-center space-x-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Powered by AI • Ask anything about OfficeMoM</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
