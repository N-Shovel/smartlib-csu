const escapeValue = (value) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
};

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return false;

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((key) => escapeValue(row[key])).join(",")
  );
  const csvContent =
    "data:text/csv;charset=utf-8," +
    headers.join(",") +
    "\n" +
    rows.join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  return true;
};
