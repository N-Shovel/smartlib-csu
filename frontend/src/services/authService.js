// Purpose: Auth domain service for login/signup/current-user persistence.
// Parts: storage keys/default users, helper lookups, login/signup flows, borrower queries.
import { ROLES } from "../constants/roles";
import { getData, removeData, saveData } from "./localStorageService";

const USERS_KEY = "library_users";
const CURRENT_USER_KEY = "library_current_user";

const defaultUsers = [
  { email: "staff@library.com", password: "1234", role: ROLES.STAFF },
  { email: "borrower@library.com", password: "1234", role: ROLES.BORROWER }
];

const loadUsers = () => {
  const stored = getData(USERS_KEY, null);
  if (!stored || stored.length === 0) {
    // First-run bootstrap: seed storage with default demo accounts.
    saveData(USERS_KEY, defaultUsers);
    return [...defaultUsers];
  }
  return stored;
};

const saveUsers = (users) => saveData(USERS_KEY, users);

const setCurrentUser = (user) => saveData(CURRENT_USER_KEY, user);

const normalizeEmail = (email) => email.trim().toLowerCase();
const hasValue = (value) => String(value || "").trim().length > 0;

export const login = (email, password) => {
  // Normalize for case-insensitive email matching.
  const normalized = normalizeEmail(email);
  const users = loadUsers();
  const user = users.find(
    (u) => u.email === normalized && u.password === password
  );

  if (!user) return { ok: false, error: "Invalid credentials" };

  // Persist only non-sensitive session shape for app state.
  const currentUser = { email: user.email, role: user.role };
  setCurrentUser(currentUser);
  return { ok: true, user: currentUser };
};

export const signup = (email, password, role, profile = {}) => {
  // Base credential presence check.
  if (!hasValue(email) || !hasValue(password)) {
    return { ok: false, error: "Email and password are required" };
  }

  // Guard against unknown role values.
  const validRoles = Object.values(ROLES);
  if (!role || !validRoles.includes(role)) {
    return { ok: false, error: "Invalid role" };
  }

  // Prevent duplicate accounts by normalized email.
  const normalized = normalizeEmail(email);
  const users = loadUsers();
  const exists = users.some((u) => u.email === normalized);
  if (exists) return { ok: false, error: "Email already in use" };

  if (role === ROLES.BORROWER) {
    // Borrower accounts require full profile details.
    const requiredBorrowerFields = [
      "firstName",
      "lastName",
      "collegeCourse",
      "id",
      "contactInfo",
      "currentAddress"
    ];

    const hasMissingField = requiredBorrowerFields.some(
      (field) => !hasValue(profile[field])
    );

    if (hasMissingField) {
      return { ok: false, error: "Please complete all required fields" };
    }
  }

  const newUser = {
    email: normalized,
    password,
    role,
    firstName: String(profile.firstName || "").trim(),
    lastName: String(profile.lastName || "").trim(),
    collegeCourse: String(profile.collegeCourse || "").trim(),
    id: String(profile.id || "").trim(),
    contactInfo: String(profile.contactInfo || "").trim(),
    currentAddress: String(profile.currentAddress || "").trim()
  };
  const nextUsers = [...users, newUser];
  // Persist account list and return safe user payload.
  saveUsers(nextUsers);
  return { ok: true, user: { email: newUser.email, role: newUser.role } };
};

export const logout = () => {
  removeData(CURRENT_USER_KEY);
};

export const getCurrentUser = () => getData(CURRENT_USER_KEY, null);

export const getBorrowerSignups = () => {
  const users = loadUsers();
  // Restrict exported rows to borrower role and normalize missing fields.
  const toBorrowerSignup = (user) => ({
    email: user.email,
    role: user.role,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    collegeCourse: user.collegeCourse || "",
    id: user.id || "",
    contactInfo: user.contactInfo || "",
    currentAddress: user.currentAddress || ""
  });

  return users
    .filter((user) => user.role === ROLES.BORROWER)
    .map(toBorrowerSignup);
};
