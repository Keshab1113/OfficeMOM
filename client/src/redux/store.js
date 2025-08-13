import { configureStore } from "@reduxjs/toolkit";
import sidebarReducer from "./sidebarSlice";
import authReducer from "./authSlice";
import meetingReducer from "./meetingSlice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const authPersistConfig = {
  key: "auth",
  storage,
};

const sidebarPersistConfig = {
  key: "sidebar",
  storage,
};
const tableHeadersConfig = {
  key: "headers",
  storage,
}

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedSidebarReducer = persistReducer(sidebarPersistConfig, sidebarReducer);
const persistedHeaderReducer = persistReducer(tableHeadersConfig, meetingReducer);

export const store = configureStore({
  reducer: {
    sidebar: persistedSidebarReducer,
    auth: persistedAuthReducer,
    headers: persistedHeaderReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
