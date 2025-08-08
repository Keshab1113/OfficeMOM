import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  email: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.email = action.payload.email;
    },
    logout: (state) => {
      state.user = null;
      state.email = null;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
