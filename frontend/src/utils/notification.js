// Purpose: Toast notification dispatcher using custom browser events.
// Parts: event contract, emit helper, success/error/info shortcuts.
const TOAST_EVENT_NAME = "app:toast";

const emitToast = (type, message) => {
	// Ignore empty notifications to avoid rendering blank toasts.
	if (!message) return;

	// Safeguard for non-browser environments.
	if (typeof window === "undefined") return;

	// Broadcast toast payload; ToasterHost listens for this custom event.
	window.dispatchEvent(
		new CustomEvent(TOAST_EVENT_NAME, {
			detail: {
				type,
				message
			}
		})
	);
};

export const showSuccess = (message) => emitToast("success", message);

export const showError = (message) => emitToast("error", message);

export const showInfo = (message) => emitToast("info", message);
