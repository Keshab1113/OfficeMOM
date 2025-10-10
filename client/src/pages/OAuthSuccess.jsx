// src/pages/OAuthSuccess.jsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser, setProfileImage, startLogoutTimer } from "../redux/authSlice";
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
      dispatch(setUser({ id, fullName: name, email, token }));
      dispatch(setProfileImage({ profileImage: profilePic }));
      dispatch(startLogoutTimer(24 * 60 * 60 * 1000));

      addToast("success", "Google login successful!");
      navigate("/");
    } else {
      addToast("error", "Google login failed!");
      navigate("/login");
    }
  }, [location, dispatch, navigate, addToast]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
        Authenticating...
      </p>
    </div>
  );
}
