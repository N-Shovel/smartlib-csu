// Purpose: Converts reservation history records to export row objects.
// Parts: date formatter import, row transform, export function.
import { formatDateTime } from "../utils/dateUtils";
import { formatReservationHour } from "../services/reservationService";

export const getReservationHistoryExport = (history) =>
	// Convert reservation timeline entries into report-friendly fields.
	history.map((entry) => ({
		room: entry.room,
		timeSlot: formatReservationHour(entry.reservationHour),
		requestedBy: entry.requestedBy,
		action: entry.action,
		status: entry.status,
		time: formatDateTime(entry.timestamp)
	}));
