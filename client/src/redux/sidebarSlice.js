import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  heading: "",
  subHeading: "",
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    setSidebarSelection: (state, action) => {
      state.heading = action.payload.heading;
      state.subHeading = action.payload.subHeading;
    },
  },
});

export const { setSidebarSelection } = sidebarSlice.actions;
export default sidebarSlice.reducer;
