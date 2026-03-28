// --- START OF FILE src/App.tsx ---
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import useAuthStore from "./store/authStore";

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
const CreateTournamentPage = lazy(() => import("./pages/CreateTournamentPage"));
const UpdateTournamentPage = lazy(() => import("./pages/UpdateTournamentPage")); // NEW
const ManageRoundsPage = lazy(() => import("./pages/ManageRoundsPage"));
const StaffPanelPage = lazy(() => import("./pages/StaffPanelPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tournaments" element={<TournamentBrowserPage />} />
          <Route
            path="tournaments/:tournamentId"
            element={<TournamentDetailPage />}
          />

          <Route
            path="tournaments/:tournamentId/rounds"
            element={<RoundPairingsPage />}
          />
          <Route
            path="tournaments/:tournamentId/leaderboard"
            element={<LeaderboardPage />}
          />

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

          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <OrganizerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="create-tournament"
            element={
              <ProtectedRoute>
                <CreateTournamentPage />
              </ProtectedRoute>
            }
          />

          {/* NEW UPDATE ROUTE */}
          <Route
            path="tournaments/:tournamentId/update"
            element={
              <ProtectedRoute>
                <UpdateTournamentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="tournaments/:tournamentId/manage"
            element={
              <ProtectedRoute>
                <ManageRoundsPage />
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
          <Route
            path="tournaments/:tournamentId/staff"
            element={
              <ProtectedRoute>
                <StaffPanelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="tournaments/:tournamentId/checkin"
            element={
              <ProtectedRoute>
                <StaffPanelPage />
              </ProtectedRoute>
            }
          />

          <Route path="contact" element={<ContactPage />} />
          <Route path="users/:userId" element={<PublicProfilePage />} />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
// --- END OF FILE src/App.tsx ---
