// Purpose: Auth domain service for login/signup/current-user persistence.
// Parts: storage keys/default users, helper lookups, login/signup flows, borrower queries.
import { ROLES } from "../constants/roles";
import { getData, removeData, saveData } from "./localStorageService";
import { replaceBorrowerEmail } from "./bookService";
import { replaceReservationRequesterEmail } from "./reservationService";

const USERS_KEY = "library_users";
const CURRENT_USER_KEY = "library_current_user";

const defaultUsers = [
  {
    email: "staff@library.com",
    password: "1234",
    role: ROLES.STAFF,
    firstName: "Maria",
    lastName: "Santos",
    nameSuffix: "",
    collegeCourse: "Library and Information Science",
    yearLevel: "N/A",
    id: "STF-0001",
    contactInfo: "09171234567",
    currentAddress: "CSU Main Campus, Ampayon, Butuan City"
  },
  {
    email: "borrower@library.com",
    password: "1234",
    role: ROLES.BORROWER,
    firstName: "Juan",
    lastName: "Dela Cruz",
    nameSuffix: "",
    collegeCourse: "BSCS",
    yearLevel: "2nd Year",
    id: "241-01234",
    contactInfo: "09991234567",
    currentAddress: "Purok 4, Libertad, Butuan City"
  }
];

const seededProfileByEmail = Object.fromEntries(
  defaultUsers.map((user) => [user.email, user])
);

const loadUsers = () => {
  const stored = getData(USERS_KEY, null);
  if (!stored || stored.length === 0) {
    // First-run bootstrap: seed storage with default demo accounts.
    saveData(USERS_KEY, defaultUsers);
    return [...defaultUsers];
  }

  // Backfill profile details for known demo accounts already saved in storage.
  const mergedUsers = stored.map((user) => {
    const seed = seededProfileByEmail[user.email];
    if (!seed) return user;

    const filled = { ...seed, ...user };
    Object.keys(seed).forEach((key) => {
      if (!hasValue(filled[key])) {
        filled[key] = seed[key];
      }
    });

    return filled;
  });

  const changed = JSON.stringify(mergedUsers) !== JSON.stringify(stored);
  if (changed) {
    saveData(USERS_KEY, mergedUsers);
  }

  return mergedUsers;
};

const saveUsers = (users) => saveData(USERS_KEY, users);

const setCurrentUser = (user) => saveData(CURRENT_USER_KEY, user);

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const hasValue = (value) => String(value || "").trim().length > 0;

export const login = (email, password) => {
  // Gracefully reject missing credentials instead of throwing on normalization.
  if (!hasValue(email) || !hasValue(password)) {
    return { ok: false, error: "Email and password are required" };
  }

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
      "yearLevel",
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
    nameSuffix: String(profile.nameSuffix || "").trim(),
    collegeCourse: String(profile.collegeCourse || "").trim(),
    yearLevel: String(profile.yearLevel || "").trim(),
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

export const getUserProfileByEmail = (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  // Source of truth for Student ID lookups across staff dashboard/tables.
  const users = loadUsers();
  const matchedUser = users.find((user) => user.email === normalized);
  return matchedUser ? { ...matchedUser } : null;
};

export const getBorrowerSignups = () => {
  const users = loadUsers();
  // Restrict exported rows to borrower role and normalize missing fields.
  const toBorrowerSignup = (user) => ({
    email: user.email,
    role: user.role,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    nameSuffix: user.nameSuffix || "",
    collegeCourse: user.collegeCourse || "",
    yearLevel: user.yearLevel || "",
    id: user.id || "",
    contactInfo: user.contactInfo || "",
    currentAddress: user.currentAddress || ""
  });

  return users
    .filter((user) => user.role === ROLES.BORROWER)
    .map(toBorrowerSignup);
};

export const updateBorrowerAccount = (currentEmail, updates = {}) => {
  const normalizedCurrentEmail = normalizeEmail(currentEmail);
  if (!normalizedCurrentEmail) {
    return { ok: false, error: "Current user is not available." };
  }

  const users = loadUsers();
  const index = users.findIndex((user) => user.email === normalizedCurrentEmail);
  if (index === -1) {
    return { ok: false, error: "User account not found." };
  }

  const targetUser = users[index];
  if (targetUser.role !== ROLES.BORROWER) {
    return { ok: false, error: "Only borrower accounts can be updated here." };
  }

  const nextEmail = hasValue(updates.email)
    ? normalizeEmail(updates.email)
    : targetUser.email;
  const wantsPasswordChange = hasValue(updates.password) || hasValue(updates.oldPassword);
  const nextPassword = hasValue(updates.password)
    ? String(updates.password)
    : targetUser.password;
  const nextContactInfo = hasValue(updates.contactInfo)
    ? String(updates.contactInfo).trim()
    : targetUser.contactInfo;

  if (!hasValue(nextEmail)) {
    return { ok: false, error: "Email is required." };
  }

  if (!hasValue(nextPassword)) {
    return { ok: false, error: "Password is required." };
  }

  if (wantsPasswordChange) {
    if (!hasValue(updates.oldPassword)) {
      return { ok: false, error: "Old password is required." };
    }

    if (String(updates.oldPassword) !== String(targetUser.password)) {
      return { ok: false, error: "Old password is incorrect." };
    }

    if (!hasValue(updates.password)) {
      return { ok: false, error: "New password is required." };
    }
  }

  const emailTaken = users.some(
    (user, userIndex) => userIndex !== index && user.email === nextEmail
  );
  if (emailTaken) {
    return { ok: false, error: "Email already in use." };
  }

  const nextUser = {
    ...targetUser,
    email: nextEmail,
    password: nextPassword,
    contactInfo: nextContactInfo
  };

  const nextUsers = [...users];
  nextUsers[index] = nextUser;
  saveUsers(nextUsers);

  if (nextEmail !== targetUser.email) {
    replaceBorrowerEmail(targetUser.email, nextEmail);
    replaceReservationRequesterEmail(targetUser.email, nextEmail);
  }

  const nextCurrentUser = { email: nextUser.email, role: nextUser.role };
  setCurrentUser(nextCurrentUser);

  return { ok: true, user: nextCurrentUser, profile: { ...nextUser } };
};
