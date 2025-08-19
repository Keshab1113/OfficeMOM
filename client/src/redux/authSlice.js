import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  fullName: null,
  email: null,
  tokenExpiration: null,
  token: null,
  profileImage: null,
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
      const expirationTime = Date.now() + 24 * 60 * 60 * 1000;
      state.tokenExpiration = expirationTime;
      if (logoutTimer) clearTimeout(logoutTimer);
    },
    logout: (state) => {
      state.fullName = null;
      state.email = null;
      state.token = null;
      state.tokenExpiration = null;
      if (logoutTimer) {
        clearTimeout(logoutTimer);
        logoutTimer = null;
      }
    },
    setProfileImage: (state, action) => {
      state.profileImage = action.payload;
    },
    setLogoutTimer: (state, action) => {}
  },
});

export const { setUser, logout, setProfileImage } = authSlice.actions;

export const startLogoutTimer = (timeLeft) => (dispatch) => {
  if (logoutTimer) clearTimeout(logoutTimer);
  logoutTimer = setTimeout(() => {
    dispatch(logout());
  }, timeLeft);
};

export default authSlice.reducer;
