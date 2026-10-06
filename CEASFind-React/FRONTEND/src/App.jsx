import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { DialogProvider } from "./context/DialogContext.jsx";
import RequireAuth, { FullPageSpinner } from "./components/RequireAuth.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import PostingPage from "./pages/PostingPage.jsx";
import ClaimPage from "./pages/ClaimPage.jsx";
import ReturnPage from "./pages/ReturnPage.jsx";
import SavedPage from "./pages/SavedPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import PendingPage from "./pages/PendingPage.jsx";
import ReviewPage from "./pages/ReviewPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

// Claim / return pages don't require an account (the original pages allowed
// anyone to send a return offer) but wait for auth so they can pre-fill details.
function WaitForAuth({ children }) {
  return useAuth().loading ? <FullPageSpinner /> : children;
}

const signedIn = (page) => <RequireAuth>{page}</RequireAuth>;

// Old multi-page URLs (e.g. links already shared as /proof-page.html?postId=…).
const LEGACY_PAGES = {
  "/landing-page.html": "/",
  "/auth.html": "/auth",
  "/homepage.html": "/home",
  "/posting-page.html": "/post",
  "/saved.html": "/saved",
  "/history.html": "/history",
  "/notif.html": "/notifications",
  "/pending.html": "/pending",
  "/review.html": "/review",
  "/pfp.html": "/profile",
};

function NotFound() {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);

  if (pathname === "/proof-page.html" && params.get("postId")) return <Navigate to={`/claim/${params.get("postId")}`} replace />;
  if (pathname === "/return-page.html" && params.get("postId")) return <Navigate to={`/return/${params.get("postId")}`} replace />;
  if (LEGACY_PAGES[pathname]) return <Navigate to={`${LEGACY_PAGES[pathname]}${search}`} replace />;

  return (
    <div className="not-found">
      <h1>404</h1>
      <p>That page doesn't exist.</p>
      <Link to="/home">Back to Home</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DialogProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/home" element={signedIn(<HomePage />)} />
            <Route path="/post" element={signedIn(<PostingPage />)} />
            <Route path="/saved" element={signedIn(<SavedPage />)} />
            <Route path="/history" element={signedIn(<HistoryPage />)} />
            <Route path="/notifications" element={signedIn(<NotificationsPage />)} />
            <Route path="/pending" element={signedIn(<PendingPage />)} />
            <Route path="/review" element={signedIn(<ReviewPage />)} />
            <Route path="/profile" element={signedIn(<ProfilePage />)} />
            <Route path="/claim/:postId" element={<WaitForAuth><ClaimPage /></WaitForAuth>} />
            <Route path="/return/:postId" element={<WaitForAuth><ReturnPage /></WaitForAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DialogProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
