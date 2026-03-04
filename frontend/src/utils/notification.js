// Purpose: Toast notification dispatcher using custom browser events.
// Parts: event contract, emit helper, success/error/info shortcuts.
export const TOAST_EVENT_NAME = "app:toast";

const emitToast = (type, message, durationMs) => {
	// Ignore empty notifications to avoid rendering blank toasts.
	if (!message) return;

	// Safeguard for non-browser environments.
	if (typeof window === "undefined") return;

	// Broadcast toast payload; ToasterHost listens for this custom event.
	window.dispatchEvent(
		new CustomEvent(TOAST_EVENT_NAME, {
			detail: {
				type,
				message,
				durationMs
			}
		})
	);
};

export const showSuccess = (message, durationMs) => emitToast("success", message, durationMs);

export const showError = (message, durationMs) => emitToast("error", message, durationMs);

export const showInfo = (message, durationMs) => emitToast("info", message, durationMs);
