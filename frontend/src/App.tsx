import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import useAuthStore from "./store/authStore";

/* ─── Lazy-loaded pages (each becomes its own JS chunk) ─── */
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const TournamentBrowserPage = lazy(
  () => import("./pages/TournamentBrowserPage"),
);
const TournamentDetailPage = lazy(() => import("./pages/TournamentDetailPage"));
const RoundPairingsPage = lazy(() => import("./pages/RoundPairingsPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const OrganizerDashboardPage = lazy(
  () => import("./pages/OrganizerDashboardPage"),
);
const StaffPanelPage = lazy(() => import("./pages/StaffPanelPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));

/* ─── Page-level loading fallback ────────────────────────── */
function PageLoader() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        fontSize: "0.875rem",
        gap: "0.5rem",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: "18px",
          height: "18px",
          border: "2px solid var(--border)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      Loading…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Protected route guard ──────────────────────────────── */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/* ─── Public-only route (redirect if already logged in) ─── */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/* ─── App ────────────────────────────────────────────────── */
export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          {/* Public routes */}
          <Route index element={<HomePage />} />
          <Route path="tournaments" element={<TournamentBrowserPage />} />
          <Route
            path="tournaments/:tournamentId"
            element={<TournamentDetailPage />}
          />
          <Route
            path="tournaments/:tournamentId/rounds/:roundNumber"
            element={<RoundPairingsPage />}
          />
          <Route
            path="tournaments/:tournamentId/leaderboard"
            element={<LeaderboardPage />}
          />

          {/* Public user profile */}
          <Route path="users/:userId" element={<ProfilePage />} />

          {/* Auth routes — redirect away if already logged in */}
          <Route
            path="login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <OrganizerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="staff"
            element={
              <ProtectedRoute>
                <StaffPanelPage />
              </ProtectedRoute>
            }
          />
          {/*
            QR check-in deep-link: /tournaments/:tournamentId/checkin?token=xxx
            Staff page reads the query param and pre-fills the token input.
          */}
          <Route
            path="tournaments/:tournamentId/checkin"
            element={
              <ProtectedRoute>
                <StaffPanelPage />
              </ProtectedRoute>
            }
          />

          {/* Public info pages */}
          <Route path="contact" element={<ContactPage />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
