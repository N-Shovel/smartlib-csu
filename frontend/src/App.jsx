// Purpose: Top-level app shell that delegates setup to providers and routes.
// Parts: app composition, provider boundary, route rendering.
import AppProviders from "./app/AppProviders";
import AppRoutes from "./app/AppRoutes";

function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}

export default App;
