// src/pages/OAuthSuccess.jsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser, setProfileImage } from "../redux/authSlice";
import { useToast } from "../components/ToastContext";

export default function OAuthSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const id = params.get("id");
    const name = params.get("name");
    const email = params.get("email");
    const profilePic = params.get("profilePic");

    if (token) {
      dispatch(
        setUser({
          id,
          fullName: name,
          email,
          token,
          totalCreatedMoMs: Number(params.get("totalCreatedMoMs")) || 0,
          totalRemainingTime: Number(params.get("totalRemainingTime")) || 0,
          totalTimes: Number(params.get("totalTimes")) || 0,
        })
      );
      dispatch(setProfileImage({ profileImage: profilePic }));

      addToast("success", "Login successful!");
      navigate("/");
    } else {
      addToast("error", "Login failed!");
      navigate("/login");
    }
  }, [location, dispatch, navigate, addToast]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
}
