// Purpose: Generic CSV export utility for browser download actions.
// Parts: value escaping helper, CSV assembly, blob download and cleanup.
const escapeValue = (value) => {
  if (value === null || value === undefined) return "";
  // Escape inner quotes so CSV readers parse values correctly.
  const stringValue = String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
};

export const exportToCSV = (data, filename) => {
  // No-op when there is nothing to export.
  if (!data || data.length === 0) return false;

  // Use object keys of first row as CSV header order.
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((key) => escapeValue(row[key])).join(",")
  );
  const csvContent =
    headers.map((h) => escapeValue(h)).join(",") +
    "\n" +
    rows.join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  // Trigger browser download via temporary anchor element.
  const encodedUri = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};
