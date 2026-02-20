import { createContext, useContext, useMemo, useState } from "react";
import {
	login,
	signup,
	logout,
	getCurrentUser
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(getCurrentUser());

	const loginUser = (email, password) => {
		const result = login(email, password);
		if (result.ok) setUser(result.user);
		return result;
	};

	const signupUser = (email, password, role, profile) => {
		const result = signup(email, password, role, profile);
		return result;
	};

	const logoutUser = () => {
		logout();
		setUser(null);
	};

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

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
};
