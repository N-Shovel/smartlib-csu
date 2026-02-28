// Purpose: Shared page layout that combines sidebar, header, and content area.
// Parts: shell structure, content slot placement, page spacing.
import Header from "./Header";
import Sidebar from "./Sidebar";

function Layout({ children }) {
  return (
    // Shared shell keeps sidebar/header persistent while page content changes.
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__main">
        <Header />
        {/* Routed page content is injected here. */}
        <main className="page">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
