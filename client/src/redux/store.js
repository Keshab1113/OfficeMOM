import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
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

// Token refresh tracking
let isRefreshing = false;
let refreshPromise = null;

const tokenExpirationMiddleware = (store) => {
  // Check token expiration every 5 minutes
  const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const REFRESH_THRESHOLD = 10 * 60 * 1000; // Refresh if less than 10 minutes remaining

  setInterval(() => {
    const state = store.getState();
    const { token, tokenExpiration } = state.auth;

    if (!token || !tokenExpiration) return;

    const currentTime = Date.now();
    const timeUntilExpiration = tokenExpiration - currentTime;

    // If token expired, logout
    if (timeUntilExpiration <= 0) {
      console.log("Token expired, logging out...");
      handleTokenExpired(store, token);
      return;
    }

    // If token expiring soon, refresh it
    if (timeUntilExpiration <= REFRESH_THRESHOLD && !isRefreshing) {
      console.log("Token expiring soon, refreshing...");
      refreshTokenAsync(store, token);
    }
  }, CHECK_INTERVAL);

  return (next) => (action) => {
    return next(action);
  };
};

// Handle expired token
const handleTokenExpired = async (store, token) => {
  try {
    // Try to notify backend
    await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 2000
      }
    );
  } catch (error) {
    console.warn("Backend logout notification failed:", error.message);
  }

  // Clear Redux state
  store.dispatch(logout());
};

// Refresh token function
const refreshTokenAsync = async (store, oldToken) => {
  // Prevent multiple simultaneous refresh attempts
  if (isRefreshing) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/refresh`,
        {},
        {
          headers: { Authorization: `Bearer ${oldToken}` },
          timeout: 5000
        }
      );

      if (response.data && response.data.token) {
        const newToken = response.data.token;

        // Decode to get expiration
        const payload = JSON.parse(atob(newToken.split('.')[1]));
        const newExpiration = payload.exp * 1000; // Convert to milliseconds

        // Update Redux state with new token
        store.dispatch({
          type: 'auth/updateToken',
          payload: {
            token: newToken,
            tokenExpiration: newExpiration
          }
        });

        console.log("Token refreshed successfully");
        return newToken;
      } else {
        throw new Error("No token in refresh response");
      }
    } catch (error) {
      console.error("Token refresh failed:", error.message);

      // If refresh fails, logout user
      if (error.response?.status === 401) {
        console.log("Refresh token invalid, logging out...");
        handleTokenExpired(store, oldToken);
      }

      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Axios interceptor for handling 401 responses
let axiosInterceptorId = null;

const setupAxiosInterceptor = (store) => {
  // Remove existing interceptor if any
  if (axiosInterceptorId !== null) {
    axios.interceptors.response.eject(axiosInterceptorId);
  }

  axiosInterceptorId = axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If 401 error and not already retried
      if (error.response?.status === 401 && !originalRequest._retry) {
        const errorCode = error.response?.data?.code;

        // If token expired, try to refresh
        if (errorCode === "TOKEN_EXPIRED" && !originalRequest._isRefresh) {
          originalRequest._retry = true;

          try {
            const state = store.getState();
            const oldToken = state.auth.token;

            if (!oldToken) {
              throw new Error("No token available");
            }

            // Refresh token
            const newToken = await refreshTokenAsync(store, oldToken);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            console.error("Token refresh failed in interceptor:", refreshError);
            handleTokenExpired(store, store.getState().auth.token);
            return Promise.reject(refreshError);
          }
        }

        // If token revoked or invalid, logout immediately
        if (errorCode === "TOKEN_REVOKED" || errorCode === "TOKEN_INVALID") {
          console.log("Token revoked/invalid, logging out...");
          handleTokenExpired(store, store.getState().auth.token);
        }
      }

      return Promise.reject(error);
    }
  );
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

// Setup axios interceptor after store is created
setupAxiosInterceptor(store);

export const persistor = persistStore(store);