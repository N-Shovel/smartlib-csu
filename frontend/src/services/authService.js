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
  const normalized = normalizeEmail(email);
  const users = loadUsers();
  const user = users.find(
    (u) => u.email === normalized && u.password === password
  );

  if (!user) return { ok: false, error: "Invalid credentials" };

  const currentUser = { email: user.email, role: user.role };
  setCurrentUser(currentUser);
  return { ok: true, user: currentUser };
};

export const signup = (email, password, role, profile = {}) => {
  if (!hasValue(email) || !hasValue(password)) {
    return { ok: false, error: "Email and password are required" };
  }

  const validRoles = Object.values(ROLES);
  if (!role || !validRoles.includes(role)) {
    return { ok: false, error: "Invalid role" };
  }

  const normalized = normalizeEmail(email);
  const users = loadUsers();
  const exists = users.some((u) => u.email === normalized);
  if (exists) return { ok: false, error: "Email already in use" };

  if (role === ROLES.BORROWER) {
    const requiredBorrowerFields = [
      "id",
      "firstName",
      "lastName",
      "collegeCourse",
      "yearLevel",
      "contactInfo",
      "currentAddress"
    ];

    const hasMissingField = requiredBorrowerFields.some(
      (field) => !hasValue(profile[field])
    );

    if (hasMissingField) {
      return { ok: false, error: "Please complete all borrower details" };
    }
  }

  const newUser = {
    email: normalized,
    password,
    role,
    id: String(profile.id || "").trim(),
    firstName: String(profile.firstName || "").trim(),
    lastName: String(profile.lastName || "").trim(),
    collegeCourse: String(profile.collegeCourse || "").trim(),
    yearLevel: String(profile.yearLevel || "").trim(),
    contactInfo: String(profile.contactInfo || "").trim(),
    currentAddress: String(profile.currentAddress || "").trim()
  };
  const nextUsers = [...users, newUser];
  saveUsers(nextUsers);
  return { ok: true, user: { email: newUser.email, role: newUser.role } };
};

export const logout = () => {
  removeData(CURRENT_USER_KEY);
};

export const getCurrentUser = () => getData(CURRENT_USER_KEY, null);

export const getBorrowerSignups = () => {
  const users = loadUsers();
  const toBorrowerSignup = (user) => ({
    email: user.email,
    role: user.role,
    id: user.id || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    collegeCourse: user.collegeCourse || "",
    yearLevel: user.yearLevel || "",
    contactInfo: user.contactInfo || "",
    currentAddress: user.currentAddress || ""
  });

  return users
    .filter((user) => user.role === ROLES.BORROWER)
    .map(toBorrowerSignup);
};
