import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import { FiUser, FiCamera, FiEdit3, FiCheck, FiX } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import { setProfileImage, setUser } from "../../redux/authSlice";
import getCroppedImg from "../../lib/cropImage";
import axios from "axios";
import { useToast } from "../ToastContext";

const ProfileImageUploader = () => {
  const dispatch = useDispatch();
  const { email, fullName, token } = useSelector(
    (state) => state.auth
  );
  const { profileImage } = useSelector(
    (state) => state.auth
  );

  const [imageSrc, setImageSrc] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [name, setName] = useState(fullName || "");
  const [emailID, setEmailID] = useState(email || "");

  const { addToast } = useToast();

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setImageFile(file);
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
    setUploading(true);
    try {
      const croppedImgBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      const res = await fetch(croppedImgBase64);
      const blob = await res.blob();
      const croppedFile = new File([blob], imageFile?.name || "profile.jpg", {
        type: blob.type,
      });
      const formData = new FormData();
      formData.append("profilePic", croppedFile);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/upload-profile-picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      dispatch(setProfileImage({profileImage: response?.data?.profilePic}));
      setShowCropper(false);
      setUploading(false);
      addToast("success", "Profile picture updated Successfully");
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

  const handleUpdateProfile = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/update-user`,
        { fullName: name, email: emailID, profilePic: profileImage?.profileImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(
        setUser({
          fullName: name,
          email: emailID,
          token: token,
        })
      );
      addToast("success", "Profile updated Successfully");
    } catch (err) {
      console.error("Profile update failed:", err);
      addToast("error", "Profile update failed");
    }
  };

  return (
    <>
      <motion.div
        className="flex flex-col md:flex-row items-center gap-8 md:p-12 p-6 rounded-3xl
        backdrop-blur-xl bg-gradient-to-br from-white/20 via-white/10 to-white/5
        dark:from-white/10 dark:via-white/5 dark:to-transparent
        border border-white/30 dark:border-white/20 shadow-2xl shadow-blue-500/10 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div>
          <motion.div
            variants={itemVariants}
            className="relative !max-h-[600px] rounded-full"
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
              <div className=" w-[200px] h-[200px] flex items-center justify-center relative overflow-hidden rounded-full">
                {profileImage?.profileImage ? (
                  <motion.img
                    src={profileImage?.profileImage}
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

                <AnimatePresence>
                  {profileImage?.profileImage && isHovered && (
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
          <motion.div
            className="flex items-center mt-5 w-fit gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 mx-auto"
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
        </div>
        <motion.div
          className="text-center space-y-4 border border-solid border-gray-200 dark:border-slate-600 w-full md:p-10 p-4 rounded-md"
          variants={itemVariants}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="w-full p-3 rounded-md border border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800 dark:text-white"
          />

          <input
            type="email"
            value={emailID}
            onChange={(e) => setEmailID(e.target.value)}
            placeholder="Email"
            className="w-full p-3 rounded-md border border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800 dark:text-white"
          />
          <motion.button
            onClick={handleUpdateProfile}
            className="md:w-fit w-full py-3 px-10 cursor-pointer rounded-md font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transition-transform"
          >
            Update Profile
          </motion.button>
        </motion.div>
      </motion.div>

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

              <motion.div
                className="flex gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.button
                  onClick={() => setShowCropper(false)}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 cursor-pointer bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 
                  rounded-2xl font-semibold flex items-center disabled:cursor-not-allowed disabled:opacity-50 justify-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiX className="text-lg" />
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleCropSave}
                  disabled={uploading}
                  className="flex-1 px-6 cursor-pointer py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white 
                  rounded-2xl font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-indigo-700 
                  transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed text-xs md:text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {uploading ? (
                    <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Uploading...
                    </>
                  ) : (
                    <>
                      <FiCheck className="text-lg" />
                      Save
                    </>
                  )}
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
