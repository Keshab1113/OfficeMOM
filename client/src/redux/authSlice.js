import { createSlice } from "@reduxjs/toolkit";

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
  
  // ✅ Decode JWT to get actual expiration time
  try {
    const payload = JSON.parse(atob(action.payload.token.split('.')[1]));
    state.tokenExpiration = payload.exp * 1000; // Convert to milliseconds
  } catch (err) {
    // Fallback if decode fails
    state.tokenExpiration = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  }
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

    updateToken: (state, action) => {
      state.token = action.payload.token;
      state.tokenExpiration = action.payload.tokenExpiration;
    },

    setLogoutTimer: (state, action) => { },
  },
});

export const { setUser, logout, setProfileImage, updateUser, updateToken } = authSlice.actions;
export default authSlice.reducer;
