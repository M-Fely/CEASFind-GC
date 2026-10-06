import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CATEGORIES } from "../lib/constants.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useDialog } from "../context/DialogContext.jsx";

const NAV = [
  { to: "/home", icon: "home", label: "Home" },
  { to: "/saved", icon: "bookmark", label: "Bookmark" },
  { to: "/history", icon: "history", label: "History" },
  { to: "/notifications", icon: "notifications", label: "Notifications" },
  { to: "/pending", icon: "schedule", label: "Pending" },
  { to: "/review", icon: "assignment", label: "Review" },
];

// Sidebar + top bar shell shared by every signed-in page.
// Pages that filter their own list pass `search` + `onSearch`; on other pages
// pressing Enter in the search box searches the home feed instead.
export default function AppLayout({ title, search, onSearch, searchPlaceholder = "Search…", children }) {
  const { displayName, isAdmin, logout, user } = useAuth();
  const dialog = useDialog();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState("");

  const controlled = typeof onSearch === "function";
  const searchValue = controlled ? search : localSearch;

  const submitSearch = () => {
    if (!controlled && localSearch.trim()) navigate(`/home?q=${encodeURIComponent(localSearch.trim())}`);
  };

  const handleLogout = async () => {
    if (!(await dialog.confirm("Log Out", "Are you sure you want to log out?", { icon: "logout" }))) return;
    await logout();
    navigate("/auth");
  };

  return (
    <div className="app-shell">
      <aside className="side-bar">
        <Link to="/home" className="sidebar-header">
          <img className="app-logo" src="/elements/user icon white.png" alt="" />
          <h4>CEAS FIND</h4>
        </Link>

        <nav className="nav-list">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end className="nav-item">
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </NavLink>
          ))}

          <hr className="nav-divider" />
          <p className="category-label">Categories</p>

          {CATEGORIES.map((cat) => (
            <Link key={cat.name} to={`/home?category=${encodeURIComponent(cat.name)}`} className="nav-item">
              <span className="material-symbols-outlined">{cat.icon}</span>
              <span className="nav-text">{cat.name}</span>
            </Link>
          ))}
        </nav>

        <div className="account">
          <Link to={`/profile?user=${encodeURIComponent(user?.email || "")}`} className="account-name" title={displayName}>
            <span className="account-display-name">{displayName}</span>
            {isAdmin && <span className="admin-badge">ADMIN</span>}
          </Link>
          <button className="logout-btn" onClick={handleLogout} title="Log out" aria-label="Log out">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </aside>

      <div className="content-area">
        <header className="top-bar">
          <h1 className="page-title">{title}</h1>

          <div className="search-report-group">
            <form
              className="search-main"
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch();
              }}
            >
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => (controlled ? onSearch(e.target.value) : setLocalSearch(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Escape") controlled ? onSearch("") : setLocalSearch("");
                }}
              />
              <button type="submit" className="search-icon-btn" aria-label="Search">
                <span className="material-symbols-outlined search-icon">search</span>
              </button>
            </form>

            <Link to="/post" className="report-wrapper">
              <div className="report-item">
                <span className="material-symbols-outlined">post_add</span>
                <h5 className="report-text">Report Item!</h5>
              </div>
            </Link>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
