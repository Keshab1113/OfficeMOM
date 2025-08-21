import React, { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (type, message) => {
    setToasts((prev) => {
      const alreadyExists = prev.some(
        (toast) => toast.type === type && toast.message === message
      );
      if (alreadyExists) return prev;
      const id = toastId++;
      const newToasts = [...prev, { id, type, message }];
      setTimeout(() => {
        setToasts((curr) => curr.filter((toast) => toast.id !== id));
      }, 3000);

      return newToasts;
    });
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-container ${
              toast.type === "success"
                ? "toast-success"
                : toast.type === "error"
                ? "toast-error"
                : "toast-default"
            }`}
          >
            <div className="flex items-start gap-3">
              <span>
                {toast.type === "success"
                  ? "✅"
                  : toast.type === "error"
                  ? "❌"
                  : "ℹ️"}
              </span>
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <div className="toast-progress" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
