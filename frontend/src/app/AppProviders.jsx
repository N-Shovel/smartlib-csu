// Purpose: Wraps the application with global context providers.
// Parts: provider imports, provider nesting, children passthrough.
import { AuthProvider } from "../context/AuthContext";
import ToasterHost from "../components/ToasterHost";

const AppProviders = ({ children }) => {
	return (
		<AuthProvider>
			{children}
			<ToasterHost />
		</AuthProvider>
	);
};

export default AppProviders;
