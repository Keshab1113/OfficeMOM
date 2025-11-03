// ProfileImageUploader.jsx
import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import { FiUser, FiCamera, FiEdit3, FiCheck, FiX, FiMail, FiUserCheck, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { Loader2, Shield, Zap, Users, Calendar, AlarmClock, Clock } from "lucide-react";
import { setProfileImage, setUser } from "../../redux/authSlice";
import getCroppedImg from "../../lib/cropImage";
import axios from "axios";
import { useToast } from "../ToastContext";
import { useEffect } from "react";

const ProfileImageUploader = () => {
  const dispatch = useDispatch();
  const {
    email,
    fullName,
    token,
  } = useSelector((state) => state.auth);
  const { profileImage } = useSelector((state) => state.auth);

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
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const { addToast } = useToast();

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  useEffect(() => {
    if (token) {
      const fetchSubscription = async () => {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/subscription`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setSubscription(res.data.data);
        } catch (err) {
          console.error("Failed to load subscription details.", err);
        }
      };

      fetchSubscription();
    }
  }, [token]);



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

      const blobResponse = await axios.get(croppedImgBase64, {
        responseType: "blob",
      });
      const blob = blobResponse.data;

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

      dispatch(setProfileImage({ profileImage: response?.data?.profilePic }));
      setShowCropper(false);
      setUploading(false);
      addToast("success", "Profile picture updated successfully! 🎉");
    } catch (e) {
      console.error(e);
      setUploading(false);
      addToast("error", "Failed to update profile picture");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/update-user`,
        {
          fullName: name,
          email: emailID,
          profilePic: profileImage?.profileImage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(
        setUser({
          fullName: name,
          email: emailID,
          token: token,
        })
      );
      setIsEditing(false);
      addToast("success", "Profile updated successfully! ✨");
    } catch (err) {
      console.error("Profile update failed:", err);
      addToast("error", "Profile update failed");
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      addToast("error", "New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      addToast("error", "Password must be at least 6 characters long");
      return;
    }

    setUpdatingPassword(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/forgot-password/reset-without-otp`,
        {
          email,
          newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
      addToast("success", "Password updated successfully! 🔒");
    } catch (err) {
      console.error("Password update failed:", err);
      addToast("error", err.response?.data?.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
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


  const SubscriptionName = (subscription?.plan_name === null ? "Free" : subscription?.plan_name) || "Free";

  const stats = [
    { icon: Shield, label: "Subscription", value: SubscriptionName, color: "text-blue-500" },
    { icon: Zap, label: "Total Used", value: `${subscription?.total_used_time} min`, color: "text-purple-500" },
    { icon: Clock, label: "Total Times", value: `${subscription?.total_minutes} min`, color: "text-green-500" },
    { icon: AlarmClock, label: "Remaining Time", value: `${subscription?.total_remaining_time} min`, color: "text-orange-500" },
  ];

return (
  <>
    <motion.div
      className="flex flex-col xl:flex-row items-start gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl
        backdrop-blur-xl bg-gradient-to-br from-white/40 via-white/20 to-white/10
        dark:from-gray-800/60 dark:via-gray-700/40 dark:to-gray-600/20
        border border-white/30 dark:border-white/20 shadow-2xl shadow-blue-500/20 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >

      {/* Profile Image Section */}
      <div className="flex flex-col items-center space-y-4 lg:space-y-6 w-full xl:w-auto">
        <motion.div
          variants={itemVariants}
          className="relative"
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          <motion.label
            className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 cursor-pointer group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="h-[8rem] w-[8rem] flex items-center justify-center relative overflow-hidden rounded-full bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-white/30 dark:border-white/20">
              {profileImage?.profileImage ? (
                <motion.img
                  src={profileImage?.profileImage}
                  alt="profile"
                  className=" object-cover rounded-2xl h-[8rem] w-[8rem]"
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
                  </div>
                  <div className="relative z-10 flex flex-col items-center gap-2 lg:gap-3">
                    <FiUser className="text-blue-500 dark:text-blue-400 text-3xl lg:text-5xl" />
                    <span className="text-xs lg:text-sm font-semibold text-blue-600 dark:text-blue-300">
                      Add Photo
                    </span>
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {profileImage?.profileImage && isHovered && (
                  <motion.div
                    className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="flex flex-col items-center gap-1 lg:gap-2 text-white"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                    >
                      <FiCamera className="text-lg lg:text-2xl" />
                      <span className="text-xs lg:text-sm font-semibold">Change Photo</span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              className="absolute -bottom-1 -right-1 w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-indigo-600 
                rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 border-2 lg:border-4 border-white dark:border-gray-800"
              whileHover={{ scale: 1.15, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            >
              <FiEdit3 className="text-sm lg:text-lg" />
            </motion.div>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </motion.label>
        </motion.div>

        {/* Status Badge */}
        <motion.div
          className="flex items-center gap-2 lg:gap-3 px-4 lg:px-6 py-2 lg:py-3 rounded-xl lg:rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 backdrop-blur-sm"
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            className="w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-green-700 dark:text-green-400 font-bold text-xs lg:text-sm">Active</span>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="grid grid-cols-2 gap-3 lg:gap-4 w-full max-w-xs"
          variants={itemVariants}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="p-3 lg:p-4 rounded-xl bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm border border-white/20 text-center group hover:scale-105 transition-all duration-300"

            >
              <stat.icon className={`w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2 ${stat.color}`} />
              <div className="text-xs text-gray-600 dark:text-gray-300">{stat.label}</div>
              <div className="font-bold text-gray-800 dark:text-white text-sm lg:text-base">{stat.value}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Profile Info Section */}
      <motion.div
        className="flex-1 space-y-4 lg:space-y-6 w-full min-w-0"
        variants={itemVariants}
      >
        <div className="flex flex-wrap flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 lg:mb-6">
          <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Profile Information
          </h2>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 sm:flex-none cursor-pointer px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all text-sm lg:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </motion.button>
            <motion.button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="flex-1 sm:flex-none cursor-pointer px-4 py-2 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold shadow-lg shadow-gray-500/30 hover:shadow-gray-500/50 transition-all text-sm lg:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showPasswordSection ? 'Cancel' : 'Change Password'}
            </motion.button>
          </div>
        </div>

        <div className="space-y-4 lg:space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <FiUserCheck className="text-blue-500" />
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 lg:p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:text-white transition-all text-sm lg:text-base"
                placeholder="Enter your full name"
              />
            ) : (
              <div className="p-3 lg:p-4 rounded-xl bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/30 text-gray-800 dark:text-white font-medium text-sm lg:text-base">
                {name}
              </div>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <FiMail className="text-purple-500" />
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                value={emailID}
                onChange={(e) => setEmailID(e.target.value)}
                className="w-full p-3 lg:p-4 rounded-xl border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:bg-gray-700 dark:text-white transition-all text-sm lg:text-base"
                placeholder="Enter your email"
              />
            ) : (
              <div className="p-3 lg:p-4 rounded-xl bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/30 text-gray-800 dark:text-white font-medium text-sm lg:text-base">
                {emailID}
              </div>
            )}
          </div>

          {/* Password Update Section */}
          <AnimatePresence>
            {showPasswordSection && (
              <motion.div
                className="space-y-4 p-4 lg:p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-400/30"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <FiLock className="text-orange-500" />
                  Change Password
                </h3>

                <div className="space-y-3">


                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:bg-gray-700 dark:text-white transition-all pr-10"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showNewPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:bg-gray-700 dark:text-white transition-all pr-10"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword || !newPassword || !confirmPassword}
                    className="w-full py-3 px-6 cursor-pointer rounded-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all transform  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"

                  >
                    {updatingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Update Button */}
          {isEditing && (
            <motion.button
              onClick={handleUpdateProfile}
              className="w-full py-3 lg:py-4 px-6 cursor-pointer rounded-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 transition-all transform  text-sm lg:text-base"

            >
              Save Changes
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>

    {/* Cropper Modal */}
    <AnimatePresence>
      {showCropper && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && setShowCropper(false)}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 p-6 lg:p-8 rounded-2xl lg:rounded-3xl w-full max-w-lg shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <motion.h3
              className="text-xl lg:text-2xl font-bold text-center mb-4 lg:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Crop Your Photo
            </motion.h3>

            <motion.div
              className="relative w-full h-64 lg:h-80 bg-gray-100 dark:bg-gray-700 rounded-xl lg:rounded-2xl overflow-hidden mb-4 lg:mb-6 border-2 border-blue-200 dark:border-blue-800"
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
              className="mb-6 lg:mb-8"
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
                className="w-full h-2 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-3 lg:gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.button
                onClick={() => setShowCropper(false)}
                disabled={uploading}
                className="flex-1 px-4 lg:px-6 py-2 lg:py-3 cursor-pointer bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-300 
                  rounded-xl lg:rounded-2xl font-semibold flex items-center disabled:cursor-not-allowed disabled:opacity-50 justify-center gap-2 hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-500 dark:hover:to-gray-600 transition-all text-sm lg:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiX className="text-lg" />
                Cancel
              </motion.button>
              <motion.button
                onClick={handleCropSave}
                disabled={uploading}
                className="flex-1 px-4 lg:px-6 cursor-pointer py-2 lg:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white 
                  rounded-xl lg:rounded-2xl font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-indigo-700 
                  transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed text-sm lg:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiCheck className="text-lg" />
                    Save Changes
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