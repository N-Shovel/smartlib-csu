// Purpose: Auth context/provider exposing current user and auth actions.
// Parts: context shape, provider state/actions, memoized value, consumer hook.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
	login,
	signup,
	logout,
	getCurrentUser,
	updateBorrowerAccount
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	// Start with null user until persisted session is safely validated.
	const [user, setUser] = useState(null);
	// Prevent route/UI role checks from running before hydration completes.
	const [isAuthLoading, setIsAuthLoading] = useState(true);

	useEffect(() => {
		// Hydrate persisted session on app mount.
		// In production builds, this mount/hydration timing can expose null-role access
		// if guarded components render before local session is restored.
		try {
			const persistedUser = getCurrentUser();
			const hasRequiredSessionShape =
				Boolean(persistedUser?.email) && Boolean(persistedUser?.role);
			// Reject malformed persisted user payloads to avoid role-check crashes.
			setUser(hasRequiredSessionShape ? persistedUser : null);
		} catch {
			setUser(null);
		} finally {
			setIsAuthLoading(false);
		}
	}, []);

	const loginUser = useCallback((email, password) => {
		const result = login(email, password);
		// Update in-memory auth state only on successful login.
		if (result.ok) setUser(result.user);
		return result;
	}, []);

	const signupUser = useCallback((email, password, role, profile) => {
		return signup(email, password, role, profile);
	}, []);

	const logoutUser = useCallback(() => {
		// Clear persistent auth and reset context user.
		logout();
		setUser(null);
	}, []);

	const updateBorrowerAccountUser = useCallback((updates) => {
		if (!user?.email) {
			return { ok: false, error: "No active user." };
		}

		// Service returns refreshed session user after email/password/contact update.
		const result = updateBorrowerAccount(user.email, updates);
		if (result.ok) {
			// Keep context session aligned with persisted current user (important after email change).
			setUser(result.user);
		}
		return result;
	}, [user]);

	// Memoize context value so consumers only rerender when user changes.
	const value = useMemo(
		() => ({
			user,
			isAuthLoading,
			loginUser,
			signupUser,
			logoutUser,
			updateBorrowerAccountUser
		}),
		[user, isAuthLoading, loginUser, signupUser, logoutUser, updateBorrowerAccountUser]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
};
