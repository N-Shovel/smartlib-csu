// Purpose: Shared borrower-name formatting helpers used by UI and export mappers.
// Parts: normalized name-part extraction and full-name formatting.
export const getBorrowerNameParts = (borrower = {}) => ({
  firstName: String(borrower.firstName || borrower.first_name || "").trim(),
  lastName: String(borrower.lastName || borrower.last_name || "").trim(),
  nameSuffix: String(borrower.nameSuffix || borrower.suffix || "").trim()
});

export const formatBorrowerFullName = (
  borrower = {},
  { emptyValue = "-" } = {}
) => {
  const { firstName, lastName, nameSuffix } = getBorrowerNameParts(borrower);
  const baseName = [lastName, firstName].filter(Boolean).join(", ");
  if (!baseName) return emptyValue;

  return nameSuffix ? `${baseName} ${nameSuffix}` : baseName;
};
