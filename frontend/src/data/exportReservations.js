import { formatDateTime } from "../utils/dateUtils";

export const getReservationHistoryExport = (history) =>
	history.map((entry) => ({
		room: entry.room,
		requestedBy: entry.requestedBy,
		action: entry.action,
		status: entry.status,
		time: formatDateTime(entry.timestamp)
	}));
