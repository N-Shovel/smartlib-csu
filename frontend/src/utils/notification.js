const TOAST_EVENT_NAME = "app:toast";

const emitToast = (type, message) => {
	if (!message) return;

	if (typeof window === "undefined") return;

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
