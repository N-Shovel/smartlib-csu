// Purpose: Wraps the application with global context providers.
// Parts: provider imports, provider nesting, children passthrough.
import ToasterHost from "../components/ToasterHost";

const AppProviders = ({ children }) => {
	return (
		// Zustand store provides auth state app-wide (no provider wrapper needed)
		<>
			{/* Render routed pages/content inside global providers. */}
			{children}
			{/* Global toast host listens for notification events and displays messages. */}
			<ToasterHost />
		</>
	);
};

export default AppProviders;
