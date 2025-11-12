import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  fullName: null,
  email: null,
  tokenExpiration: null,
  token: null,
  profileImage: null,
  totalTimes: 0,
  totalRemainingTime: 0,
  totalCreatedMoMs: 0,
};

let logoutTimer;

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.fullName = action.payload.fullName;
      state.email = action.payload.email;
      state.token = action.payload.token;
      const expirationTime = Date.now() + 24 * 60 * 60 * 1000; // ✅ 1 day
      state.tokenExpiration = expirationTime;
      state.totalTimes = action.payload.totalTimes;
      state.totalRemainingTime = action.payload.totalRemainingTime;
      state.totalCreatedMoMs = action.payload.totalCreatedMoMs;
      if (logoutTimer) clearTimeout(logoutTimer);
    },

    logout: (state) => {
      state.fullName = null;
      state.email = null;
      state.token = null;
      state.profileImage = null;
      state.tokenExpiration = null;
      state.totalTimes = 0;
      state.totalRemainingTime = 0;
      state.totalCreatedMoMs = 0;
      if (logoutTimer) {
        clearTimeout(logoutTimer);
        logoutTimer = null;
      }
    },

    setProfileImage: (state, action) => {
      state.profileImage = action.payload;
    },

    updateUser: (state, action) => {
      const updates = action.payload;
      Object.keys(updates).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(state, key)) {
          state[key] = updates[key];
        }
      });
    },

    setLogoutTimer: (state, action) => { },
  },
});

export const { setUser, logout, setProfileImage, updateUser } = authSlice.actions;

// ✅ Auto refresh token before expiration
export const checkAndRefreshToken = () => async (dispatch, getState) => {
  const { token, tokenExpiration } = getState().auth;

  if (!token || !tokenExpiration) return;

  const timeLeft = tokenExpiration - Date.now();

  // Refresh if less than 10 minutes left
  if (timeLeft < 10 * 60 * 1000) {
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/refresh-token`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      dispatch(updateUser({
        token: data.token,
        tokenExpiration: Date.now() + 24 * 60 * 60 * 1000, // reset 1 day
      }));
    } catch (err) {
      console.error("Token refresh failed:", err);
      dispatch(logout());
    }
  }
};

export const startLogoutTimer = (timeLeft, token) => (dispatch) => {
  if (logoutTimer) clearTimeout(logoutTimer);

  logoutTimer = setTimeout(async () => {
    try {
      if (token) {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.warn("⚠️ Backend logout failed:", error.message);
    } finally {
      dispatch(logout());
    }
  }, timeLeft);
};


export default authSlice.reducer;
