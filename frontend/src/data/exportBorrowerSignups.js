// Purpose: Maps borrower signup records to tabular export format.
// Parts: column mapping, per-record transform, export function.
export const getBorrowerSignupsExport = (borrowers) =>
  borrowers.map((borrower) => ({
    firstName: borrower.firstName || "",
    lastName: borrower.lastName || "",
    collegeCourse: borrower.collegeCourse || "",
    yearLevel: borrower.yearLevel || "",
    contactInfo: borrower.contactInfo || "",
    currentAddress: borrower.currentAddress || "",
    email: borrower.email || ""
  }));
