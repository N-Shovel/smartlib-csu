// Purpose: Converts borrower history records into CSV-ready export rows.
// Parts: date formatting import, row mapping, export function.
import { formatDateTime } from "../utils/dateUtils";

export const getBorrowHistoryExport = (history) =>
	// Normalize borrow-history entries to a flat export schema.
	history.map((entry) => ({
		borrowerEmail: entry.borrowerEmail,
		bookTitle: entry.title,
		action: entry.action,
		time: formatDateTime(entry.timestamp)
	}));
