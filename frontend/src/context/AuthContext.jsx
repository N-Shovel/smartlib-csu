// Purpose: Auth context/provider exposing current user and auth actions.
// Parts: context shape, provider state/actions, memoized value, consumer hook.
import { createContext, useContext, useMemo, useState } from "react";
import {
	login,
	signup,
	logout,
	getCurrentUser
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	// Initialize from persisted session so refresh keeps user logged in.
	const [user, setUser] = useState(getCurrentUser());

	const loginUser = (email, password) => {
		const result = login(email, password);
		// Update in-memory auth state only on successful login.
		if (result.ok) setUser(result.user);
		return result;
	};

	const signupUser = (email, password, role, profile) => {
		return signup(email, password, role, profile);
	};

	const logoutUser = () => {
		// Clear persistent auth and reset context user.
		logout();
		setUser(null);
	};

	// Memoize context value so consumers only rerender when user changes.
	const value = useMemo(
		() => ({
			user,
			loginUser,
			signupUser,
			logoutUser
		}),
		[user]
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
