import { configureStore } from "@reduxjs/toolkit";
import sidebarReducer from "./sidebarSlice";
import authReducer from "./authSlice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

// Persist config for auth slice
const persistConfig = {
  key: "auth", // key for localStorage
  storage,
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    sidebar: sidebarReducer,
    auth: persistedAuthReducer, // Add persisted auth
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Required for redux-persist
    }),
});

export const persistor = persistStore(store);
