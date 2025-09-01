import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  previews: [],
};

const audioSlice = createSlice({
  name: "audio",
  initialState,
  reducers: {
    addAudioPreview: (state, action) => {
      state.previews.push(action.payload);
    },
    setAudioPreviews: (state, action) => {
      state.previews = action.payload;
    },
    clearAudioPreviews: (state) => {
      state.previews = [];
    },
    removeAudioPreview: (state, action) => {
      state.previews = state.previews.filter(
        (item) => item.id !== action.payload
      );
    },
    updateAudioDuration: (state, action) => {
      const { id, duration } = action.payload;
      const target = state.previews.find((item) => item.id === id);
      if (target) {
        target.duration = duration;
      }
    },
    updateNeedToShow: (state, action) => {
      const { id, needToShow } = action.payload;
      const target = state.previews.find((item) => item.id === id);
      if (target) {
        target.needToShow = needToShow;
      }
    },
  },
});

export const {
  addAudioPreview,
  setAudioPreviews,
  clearAudioPreviews,
  removeAudioPreview,
  updateAudioDuration,
  updateNeedToShow,
} = audioSlice.actions;
export default audioSlice.reducer;
