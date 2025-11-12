import { configureStore } from "@reduxjs/toolkit";
import authReducer, { checkAndRefreshToken } from "./authSlice";
import meetingReducer from "./meetingSlice";
import audioReducer from "./audioSlice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { logout } from "./authSlice";
import axios from "axios";

const authPersistConfig = {
  key: "auth",
  storage,
};

const meetingPersistConfig = {
  key: "meeting",
  storage,
};

const audioPersistConfig = {
  key: "audio",
  storage,
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedMeetingReducer = persistReducer(meetingPersistConfig, meetingReducer);
const persistedAudioReducer = persistReducer(audioPersistConfig, audioReducer);

const tokenExpirationMiddleware = (store) => { // to prevent multiple refreshes
  return (next) => async (action) => {
    // Always let the action continue first to avoid recursive dispatching
    const result = next(action);

    const state = store.getState();
    const { token, tokenExpiration } = state.auth;
    const currentTime = Date.now();

    if (!token || !tokenExpiration) return result;

    // --- Handle token expiration ---
    if (currentTime > tokenExpiration) {
      try {
        // Call backend logout to clear active_token
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.warn("Backend logout failed (probably already expired):", error.message);
      }

      // Clear Redux state
      store.dispatch(logout());
      return result;
    }
    return result;
  };
};

 


export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    meeting: persistedMeetingReducer,
    audio: persistedAudioReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(tokenExpirationMiddleware),
});

export const persistor = persistStore(store);
