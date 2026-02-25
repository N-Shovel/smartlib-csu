import { useEffect, useState } from "react";

const TOAST_EVENT_NAME = "app:toast";

const ToasterHost = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const detail = event.detail || {};
      if (!detail.message) return;

      const nextToast = {
        id: Date.now() + Math.random(),
        type: detail.type || "info",
        message: detail.message
      };

      setToasts((current) => [nextToast, ...current].slice(0, 4));

      setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== nextToast.id));
      }, 2800);
    };

    window.addEventListener(TOAST_EVENT_NAME, handleToast);
    return () => window.removeEventListener(TOAST_EVENT_NAME, handleToast);
  }, []);

  return (
    <div className="toast-host" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default ToasterHost;
