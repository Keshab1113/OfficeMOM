import { createSlice } from "@reduxjs/toolkit";

const meetingSlice = createSlice({
  name: "meetingHeader",
  initialState: {
    tableHeader: [],
    tableData: {
      headers: [],
      columns: 0,
    },
  },
  reducers: {
    setTableHeader(state, action) {
      state.tableHeader = action.payload;
    },
    setTableData(state, action) {
      state.tableData = action.payload;
      // Also update the legacy tableHeader for backward compatibility
      state.tableHeader = action.payload.headers;
    },
    clearTableData(state) {
      state.tableData = {
        headers: [],
        columns: 0,
      };
      state.tableHeader = [];
    },
  },
});

export const { setTableHeader, setTableData, clearTableData } = meetingSlice.actions;
export default meetingSlice.reducer;