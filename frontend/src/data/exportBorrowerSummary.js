// Purpose: Maps borrower summary metrics into export-friendly rows.
// Parts: summary fields mapping, export function.
export const getBorrowerSummaryExport = (borrowers) =>
	// Flatten summary objects to simple CSV row values.
	borrowers.map((b) => ({
		email: b.email,
		borrowedCount: b.borrowedCount,
		titles: Array.isArray(b.titles) ? b.titles.join("; ") : ""
	}));
