// Purpose: Maps borrower signup records to tabular export format.
// Parts: column mapping, per-record transform, export function.
import { formatBorrowerFullName, getBorrowerNameParts } from "../utils/name";

export const getBorrowerSignupsExport = (borrowers) =>
  // Project borrower records into stable CSV columns.
  borrowers.map((borrower) => {
    const { firstName, lastName, nameSuffix } = getBorrowerNameParts(borrower);
    const name = formatBorrowerFullName(borrower, { emptyValue: "" });

    return {
      name,
      firstName,
      lastName,
      nameSuffix,
      collegeCourse: borrower.collegeCourse || "",
      yearLevel: borrower.yearLevel || "",
      id: borrower.id || "",
      contactInfo: borrower.contactInfo || "",
      currentAddress: borrower.currentAddress || "",
      email: borrower.email || ""
    };
  });
