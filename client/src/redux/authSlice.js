import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  fullName: null,
  email: null,
  token: null,
  profileImage: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.fullName = action.payload.fullName;
      state.email = action.payload.email;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.fullName = null;
      state.email = null;
      state.token = null;
    },
    setProfileImage: (state, action) => {
      state.profileImage = action.payload;
    },
  },
});

export const { setUser, logout, setProfileImage } = authSlice.actions;
export default authSlice.reducer;
