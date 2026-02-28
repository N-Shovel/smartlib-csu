// Purpose: Wraps the application with global context providers.
// Parts: provider imports, provider nesting, children passthrough.
import { AuthProvider } from "../context/AuthContext";
import ToasterHost from "../components/ToasterHost";

const AppProviders = ({ children }) => {
	return (
		// AuthProvider makes user/session state available app-wide.
		<AuthProvider>
			{/* Render routed pages/content inside global providers. */}
			{children}
			{/* Global toast host listens for notification events and displays messages. */}
			<ToasterHost />
		</AuthProvider>
	);
};

export default AppProviders;
