import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import meetingReducer from "./meetingSlice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const authPersistConfig = {
  key: "auth",
  storage,
};

const meetingPersistConfig = {
  key: "meeting",
  storage,
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedMeetingReducer = persistReducer(meetingPersistConfig, meetingReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    meeting: persistedMeetingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);