import { configureStore } from "@reduxjs/toolkit";
import sidebarReducer from "./sidebarSlice";
import authReducer from "./authSlice";
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

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedSidebarReducer = persistReducer(sidebarPersistConfig, sidebarReducer);

export const store = configureStore({
  reducer: {
    sidebar: persistedSidebarReducer,
    auth: persistedAuthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
