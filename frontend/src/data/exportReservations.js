import { formatDateTime } from "../utils/dateUtils";
import { formatReservationHour } from "../services/reservationService";

export const getReservationHistoryExport = (history) =>
	history.map((entry) => ({
		room: entry.room,
		timeSlot: formatReservationHour(entry.reservationHour),
		requestedBy: entry.requestedBy,
		action: entry.action,
		status: entry.status,
		time: formatDateTime(entry.timestamp)
	}));
