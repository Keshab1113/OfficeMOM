import React, { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiSend,
  FiUser,
  FiMessageSquare,
} from "react-icons/fi";
import { Helmet } from "react-helmet";
import Footer from "../../components/Footer/Footer";
import axios from "axios";
import { useSelector } from "react-redux";
import Breadcrumb from "../../components/LittleComponent/Breadcrumb";
import { cn } from "../../lib/utils";

const breadcrumbItems = [{ label: "ContactUs" }];

const ContactPage = () => {
  const { email, fullName } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: fullName || "",
    email: email || "",
    message: "",
  });
  // eslint-disable-next-line no-unused-vars
  const [focusedField, setFocusedField] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // simple front-end validation
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim()
    ) {
      setErrorMsg("Please fill in all fields.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/contact`,
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.success) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });

        setTimeout(() => setStatus("idle"), 4500);
      } else {
        setStatus("error");
        setErrorMsg(res.data?.error || "Failed to submit. Please try again.");
      }
    } catch (err) {
      console.error("Contact submit error:", err);
      setStatus("error");
      setErrorMsg(
        err?.response?.data?.error ||
          err?.message ||
          "Something went wrong. Please try again later."
      );
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const isSubmitting = status === "submitting";

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | ContactUs</title>
        <link rel="canonical" href="https://officemom.me/contact-us" />
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
        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll">
          <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 relative overflow-hidden">
            <motion.div
              className=" z-10 px-6 py-16 lg:py-10"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Breadcrumb items={breadcrumbItems} />
              <div className="md:max-w-7xl max-w-[90vw] mx-auto">
                {/* Header Section */}
                <motion.div
                  className="text-center mb-10 mt-16"
                  variants={itemVariants}
                >
                  <motion.div
                    className="inline-block"
                    variants={floatingVariants}
                    animate="animate"
                  >
                    <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      Let's Connect
                    </h1>
                  </motion.div>
                  <p className="text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Ready to transform your ideas into reality? Drop us a
                    message and let's create something amazing together.
                  </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8 items-start md:max-w-full max-w-[90vw]">
                  {/* Left Section - Contact Info */}
                  <motion.div
                    variants={itemVariants}
                    className="space-y-4 h-fit md:max-w-full max-w-[90vw]"
                  >
                    <div className="backdrop-blur-lg bg-white/60 dark:bg-gray-800/20 rounded-3xl p-8 shadow-xl border border-white/20 dark:border-gray-700/30">
                      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        Get in Touch
                      </h2>
                      <p className="text-base text-gray-600 dark:text-gray-300 mb-8">
                        Have questions or need help? Our team is here to support
                        you every step of the way.
                      </p>

                      <div className="space-y-6">
                        {[
                          {
                            icon: FiMail,
                            text: "support@officemom.com",
                            color: "from-blue-500 to-cyan-500",
                          },

                          {
                            icon: FiMapPin,
                            text: "800 N King Street, Suite 304, Wilmington, DE 19801, USA",
                            color: "from-purple-500 to-pink-500",
                          },
                        ].map((item, index) => (
                          <motion.div
                            key={index}
                            className="flex items-center gap-4 group cursor-pointer"
                            whileHover={{
                              x: 10,
                              transition: { duration: 0.2 },
                            }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              delay: 0.3 + index * 0.1,
                              duration: 0.5,
                            }}
                          >
                            <div
                              className={`p-3 rounded-xl bg-gradient-to-r ${item.color} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                            >
                              <item.icon className="text-white text-xl" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-200 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                              {item.text}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="h-[21rem] w-full rounded-xl overflow-hidden shadow-lg">
                      <iframe
                        title="OfficeMoM Location"
                        src="https://www.google.com/maps?q=800+N+King+Street,+Suite+304,+Wilmington,+DE+19801,+USA&output=embed"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>
                  </motion.div>

                  {/* Right Section - Contact Form */}
                  <motion.div
                    variants={itemVariants}
                    className="backdrop-blur-lg bg-white/70 dark:bg-gray-800/20 rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/20 dark:border-gray-700/30"
                  >
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                        <FiMessageSquare className="text-white text-xl" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                        Send Message
                      </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name Field */}
                      <div className="relative">
                        <label
                          htmlFor="name"
                          className="block text-gray-700 dark:text-gray-300 mb-3 font-semibold"
                        >
                          Your Name
                        </label>
                        <div className="relative">
                          <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                          <motion.input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField("name")}
                            onBlur={() => setFocusedField("")}
                            placeholder="John Doe"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all duration-300 backdrop-blur-sm"
                            whileFocus={{ scale: 1.02 }}
                          />
                        </div>
                      </div>

                      {/* Email Field */}
                      <div className="relative">
                        <label
                          htmlFor="email"
                          className="block text-gray-700 dark:text-gray-300 mb-3 font-semibold"
                        >
                          Your Email
                        </label>
                        <div className="relative">
                          <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                          <motion.input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField("email")}
                            onBlur={() => setFocusedField("")}
                            placeholder="you@example.com"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all duration-300 backdrop-blur-sm"
                            whileFocus={{ scale: 1.02 }}
                          />
                        </div>
                      </div>

                      {/* Message Field */}
                      <div className="relative">
                        <label
                          htmlFor="message"
                          className="block text-gray-700 dark:text-gray-300 mb-3 font-semibold"
                        >
                          Your Message
                        </label>
                        <motion.textarea
                          id="message"
                          rows="5"
                          value={formData.message}
                          onChange={handleInputChange}
                          onFocus={() => setFocusedField("message")}
                          onBlur={() => setFocusedField("")}
                          placeholder="Tell us about your project or ask any questions..."
                          className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:border-purple-500 dark:focus:border-purple-400 outline-none transition-all duration-300 backdrop-blur-sm resize-none"
                          whileFocus={{ scale: 1.02 }}
                        />
                      </div>

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full cursor-pointer disabled:cursor-not-allowed py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <FiSend className="text-lg" />
                            Send Message
                          </>
                        )}
                      </motion.button>
                    </form>

                    {status === "success" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-xl text-center"
                      >
                        Message sent successfully! We'll get back to you soon.
                      </motion.div>
                    )}

                    {status === "error" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-xl text-center"
                      >
                        {errorMsg ||
                          "Could not send your message. Please try again."}
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
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

export default ContactPage;
