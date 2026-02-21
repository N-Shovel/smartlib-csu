import { formatDateTime } from "../utils/dateUtils";

export const getBorrowHistoryExport = (history) =>
	history.map((entry) => ({
		borrowerEmail: entry.borrowerEmail,
		bookTitle: entry.title,
		action: entry.action,
		time: formatDateTime(entry.timestamp)
	}));
