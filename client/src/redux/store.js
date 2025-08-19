import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import meetingReducer from "./meetingSlice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { logout } from "./authSlice";

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

const tokenExpirationMiddleware = (store) => (next) => (action) => {
  const state = store.getState();
  if (action.type !== "auth/logout" && state.auth.token && state.auth.tokenExpiration) {
    const currentTime = Date.now();
    if (currentTime > state.auth.tokenExpiration) {
      store.dispatch(logout());
      return;
    }
  }
  return next(action);
};

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    meeting: persistedMeetingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(tokenExpirationMiddleware),
});

export const persistor = persistStore(store);
