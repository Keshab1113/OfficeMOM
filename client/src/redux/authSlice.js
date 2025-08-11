import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  fullName: null,
  email: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.fullName = action.payload.fullName;
      state.email = action.payload.email;
    },
    logout: (state) => {
      state.fullName = null;
      state.email = null;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
