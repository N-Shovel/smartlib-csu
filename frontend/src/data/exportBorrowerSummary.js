export const getBorrowerSummaryExport = (borrowers) =>
	borrowers.map((b) => ({
		email: b.email,
		borrowedCount: b.borrowedCount,
		titles: b.titles.join("; ")
	}));
