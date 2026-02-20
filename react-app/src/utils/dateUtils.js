export const getIsoTimestamp = () => new Date().toISOString();

export const formatDateTime = (isoString) => {
	if (!isoString) return "-";
	const date = new Date(isoString);
	if (Number.isNaN(date.getTime())) return "-";
	return date.toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit"
	});
};
