import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import Footer from "../../components/Footer/Footer";

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | Privacy-Policy</title>
        <link rel="canonical" href="http://mysite.com/example" />
      </Helmet>
      <section className="relative flex h-full min-h-screen md:w-full w-screen items-center justify-center dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]"></div>

        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto my-10 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 md:p-12"
          >
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center"
            >
              Privacy Policy
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              <p>
                At <span className="font-semibold">OfficeMoM</span>, we value
                your privacy and are committed to protecting your personal
                information. This Privacy Policy explains how we collect, use,
                and safeguard your data when you use our services.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6">
                1. Information We Collect
              </h2>
              <p>
                We may collect personal information such as your name, email,
                and meeting recordings when you use OfficeMoM to manage and
                generate meeting minutes.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6">
                2. How We Use Your Information
              </h2>
              <p>
                The information collected is used to provide transcription,
                improve our services, ensure security, and deliver a
                personalized user experience.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6">
                3. Data Security
              </h2>
              <p>
                We implement strict security measures to protect your data from
                unauthorized access, alteration, disclosure, or destruction.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6">
                4. Sharing of Information
              </h2>
              <p>
                OfficeMoM does not sell or rent your personal data. We may share
                data with trusted third parties only to provide services on our
                behalf, under strict confidentiality agreements.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6">
                5. Your Rights
              </h2>
              <p>
                You have the right to access, update, or delete your personal
                data. You can also request to opt out of certain communications.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6">
                6. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. Any changes
                will be posted on this page with the updated date.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6">
                7. Contact Us
              </h2>
              <p>
                If you have any questions or concerns about this Privacy Policy,
                please contact us at{" "}
                <a
                  href="mailto:support@officemom.com"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  support@officemom.com
                </a>
                .
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </motion.div>
          </motion.div>
          <Footer/>
        </div>
      </section>
    </>
  );
};

export default PrivacyPolicy;
