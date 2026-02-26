// Purpose: Maps borrower summary metrics into export-friendly rows.
// Parts: summary fields mapping, export function.
export const getBorrowerSummaryExport = (borrowers) =>
	borrowers.map((b) => ({
		email: b.email,
		borrowedCount: b.borrowedCount,
		titles: b.titles.join("; ")
	}));
