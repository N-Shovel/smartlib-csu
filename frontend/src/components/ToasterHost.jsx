// Purpose: Global toast renderer that listens to app notification events.
// Parts: event subscription effect, toast queue state, toast list render.
import { useEffect, useRef, useState } from "react";
import { TOAST_EVENT_NAME } from "../utils/notification";

const ToasterHost = () => {
  const [toasts, setToasts] = useState([]);
  const timeoutIdsRef = useRef([]);

  useEffect(() => {
    // Safeguard for SSR/test environments where window is unavailable.
    if (typeof window === "undefined") return;

    const handleToast = (event) => {
      const detail = event.detail || {};
      // Ignore invalid events that don't carry a displayable message.
      if (!detail.message) return;
      const durationMs = Number(detail.durationMs);
      // LOGIC: Allow per-toast lifetime overrides while preserving a safe default
      // so legacy calls without duration still auto-dismiss predictably.
      const toastDuration = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 2800;

      const nextToast = {
        id: Date.now() + Math.random(),
        type: detail.type || "info",
        message: detail.message
      };

      // Prepend latest toast and keep only the newest four entries.
      setToasts((current) => [nextToast, ...current].slice(0, 4));

      // Auto-dismiss each toast after a short delay.
      const timeoutId = setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== nextToast.id));

        // Remove completed timeout from tracking to avoid unbounded growth.
        timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
      }, toastDuration);

      timeoutIdsRef.current.push(timeoutId);
    };

    window.addEventListener(TOAST_EVENT_NAME, handleToast);
    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, handleToast);

      // Clear any pending auto-dismiss timers when host unmounts.
      timeoutIdsRef.current.forEach((id) => clearTimeout(id));
      timeoutIdsRef.current = [];
    };
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
