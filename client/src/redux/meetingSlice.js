import { createSlice } from "@reduxjs/toolkit";

const meetingSlice = createSlice({
  name: "meetingHeader",
  initialState: {
    tableHeader: [],
  },
  reducers: {
    setTableHeader(state, action) {
      state.tableHeader = action.payload;
    },
  },
});

export const { setTableHeader } = meetingSlice.actions;
export default meetingSlice.reducer;
