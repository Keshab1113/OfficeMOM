import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import { FiUser, FiCamera, FiEdit3, FiCheck, FiX } from "react-icons/fi";
import { setProfileImage } from "../../redux/authSlice";
import getCroppedImg from "../../lib/cropImage";

const ProfileImageUploader = () => {
  const dispatch = useDispatch();
  const { email, fullName, profileImage } = useSelector((state) => state.auth);

  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result.toString());
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    try {
      const croppedImg = await getCroppedImg(imageSrc, croppedAreaPixels);
      dispatch(setProfileImage(croppedImg));
      setShowCropper(false);
    } catch (e) {
      console.error(e);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2,
        ease: "easeIn",
      },
    },
  };

  return (
    <>
      <motion.div
        className="flex flex-col !max-h-[55vh] items-center gap-8 p-12 mx-6 rounded-3xl
        backdrop-blur-xl bg-gradient-to-br from-white/20 via-white/10 to-white/5
        dark:from-white/10 dark:via-white/5 dark:to-transparent
        border border-white/30 dark:border-white/20 shadow-2xl shadow-blue-500/10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Profile Image Display */}
        <motion.div
          variants={itemVariants}
          className="relative !max-h-[600px]"
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          <motion.label
            className="relative w-[300px] h-[200px] !max-h-[200px] rounded-full cursor-pointer overflow-hidden group
  bg-gradient-to-br from-blue-400/20 to-indigo-600/20 shadow-2xl shadow-blue-500/20 bg-transparent"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Profile image or placeholder */}
            <div className=" w-[200px] h-[200px] flex items-center justify-center relative overflow-hidden rounded-full">
              {profileImage ? (
                <motion.img
                  src={profileImage}
                  alt="profile"
                  className="w-full h-full object-cover "
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                />
              ) : (
                <motion.div
                  className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-gray-700 dark:to-gray-800 relative"
                  whileHover={{ scale: 1.1 }}
                >
                  {/* Decorative background pattern for empty state */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full bg-gradient-to-br from-blue-300/30 via-transparent to-indigo-300/30" />
                    <div className="absolute inset-4 rounded-full border-2 border-dashed border-blue-400/40" />
                  </div>
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <FiUser className="text-blue-500 dark:text-blue-400 text-4xl" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                      Add Photo
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Overlay on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="flex flex-col items-center gap-1 text-white"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                    >
                      <FiCamera className="text-xl" />
                      <span className="text-xs font-semibold">Change</span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Edit icon */}
            <motion.div
              className="absolute -bottom-1 -right-1 w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 
              rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30 border-3 border-white dark:border-gray-800"
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            >
              <FiEdit3 className="text-sm" />
            </motion.div>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </motion.label>
        </motion.div>

        {/* User details */}
        <motion.div className="text-center space-y-2" variants={itemVariants}>
          <motion.h2
            className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {fullName || "Full Name"}
          </motion.h2>
          <motion.p
            className="text-sm text-gray-600 dark:text-gray-400 font-medium"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {email || "user@example.com"}
          </motion.p>
        </motion.div>

        {/* Status indicator */}
        <motion.div
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-sm font-semibold">Active</span>
        </motion.div>
      </motion.div>

      {/* Cropping Modal */}
      <AnimatePresence>
        {showCropper && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) =>
              e.target === e.currentTarget && setShowCropper(false)
            }
          >
            <motion.div
              className="bg-white dark:bg-gray-800 p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
              variants={modalVariants}
            >
              <motion.h3
                className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Crop Your Photo
              </motion.h3>

              <motion.div
                className="relative w-full h-80 bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="round"
                  showGrid={false}
                />
              </motion.div>

              {/* Zoom control */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Zoom: {Math.round(zoom * 100)}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </motion.div>

              {/* Action buttons */}
              <motion.div
                className="flex gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.button
                  onClick={() => setShowCropper(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 
                  rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiX className="text-lg" />
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleCropSave}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white 
                  rounded-2xl font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-indigo-700 
                  transition-all shadow-lg shadow-blue-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiCheck className="text-lg" />
                  Save
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProfileImageUploader;
