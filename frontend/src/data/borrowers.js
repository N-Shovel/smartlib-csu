// Purpose: Seed borrower accounts/profile records used by auth and staff views.
// Parts: borrower schema, seeded users, exported dataset.
const borrowers = [
  { id: 1, name: "John Doe", borrowedBooks: [1] },
  { id: 2, name: "Jane Smith", borrowedBooks: [] }
];

export default borrowers;
