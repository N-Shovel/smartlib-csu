// Purpose: Maps borrower signup records to tabular export format.
// Parts: column mapping, per-record transform, export function.
export const getBorrowerSignupsExport = (borrowers) =>
  // Project borrower records into stable CSV columns.
  borrowers.map((borrower) => {
    const lastName = String(borrower.lastName || "").trim();
    const firstName = String(borrower.firstName || "").trim();
    const nameSuffix = String(borrower.nameSuffix || "").trim();
    const baseName = [lastName, firstName].filter(Boolean).join(", ");

    return {
      name: nameSuffix ? `${baseName} ${nameSuffix}` : baseName,
      firstName: borrower.firstName || "",
      lastName: borrower.lastName || "",
      nameSuffix: borrower.nameSuffix || "",
      collegeCourse: borrower.collegeCourse || "",
      yearLevel: borrower.yearLevel || "",
      id: borrower.id || "",
      contactInfo: borrower.contactInfo || "",
      currentAddress: borrower.currentAddress || "",
      email: borrower.email || ""
    };
  });
