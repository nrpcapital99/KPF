import { Suspense, lazy, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { isStaff, useSession } from "./auth/session";
import AuthShell, { Notice } from "./components/AuthShell";
import { SkeletonRows } from "./components/ui";
import { signOut } from "./data/api";
import Layout from "./components/Layout";
import FirstRun from "./pages/auth/FirstRun";
import Login from "./pages/auth/Login";
import RequestAccount from "./pages/auth/RequestAccount";
import PendingAccount from "./pages/auth/PendingAccount";

/**
 * Signed-in pages load on demand. A volunteer never downloads the admin
 * approval queue, and nobody downloads any of it before signing in.
 */
const AddParticipant = lazy(() => import("./pages/AddParticipant"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const ParticipantDetail = lazy(() => import("./pages/ParticipantDetail"));
const PeopleDirectory = lazy(() => import("./pages/PeopleDirectory"));
const Projects = lazy(() => import("./pages/Projects"));
const Settings = lazy(() => import("./pages/Settings"));
const Approvals = lazy(() => import("./pages/admin/Approvals"));
const ManageSlots = lazy(() => import("./pages/admin/ManageSlots"));
const MyCommitments = lazy(() => import("./pages/volunteer/MyCommitments"));
const Opportunities = lazy(() => import("./pages/volunteer/Opportunities"));

export default function App() {
  const session = useSession();

  if (session.kind === "loading") {
    return (
      <div className="auth" role="status" aria-live="polite">
        <div className="skeleton" style={{ width: 280, height: 180 }} />
        <span className="sr-only">Loading foundation data...</span>
      </div>
    );
  }

  if (session.kind === "error") {
    // The overwhelmingly common first-run failure is that firestore.rules
    // hasn't been deployed yet, so Firestore's default locked rules deny
    // everything. Say that plainly instead of echoing the raw SDK message.
    const isPermissionDenied = /permission|insufficient/i.test(session.message);

    return (
      <AuthShell
        title={isPermissionDenied ? "Firestore rules not deployed" : "Firebase setup needed"}
        lede={
          isPermissionDenied
            ? "The app reached your Firebase project, but Firestore is still using its default locked rules, so every read is denied."
            : session.message
        }
      >
        {isPermissionDenied && (
          <>
            <Notice kind="warn">
              Deploy the rules in <code>firestore.rules</code>, then reload:
              <br />
              <code style={{ display: "block", marginTop: 8, fontWeight: 600 }}>
                firebase deploy --only firestore:rules
              </code>
            </Notice>
            <div style={{ marginTop: "var(--sp-4)" }}>
              <Notice kind="info">
                Also make sure <strong>Email/Password</strong> sign-in is enabled
                under Authentication &rarr; Sign-in method in the Firebase console.
              </Notice>
            </div>
          </>
        )}
        <button
          className="btn btn--primary btn--block"
          style={{ marginTop: "var(--sp-5)" }}
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </AuthShell>
    );
  }

  if (session.kind === "setup") {
    return (
      <Routes>
        <Route path="*" element={<FirstRun />} />
      </Routes>
    );
  }

  if (session.kind === "anonymous") {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/request-account" element={<RequestAccount />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (session.kind === "pending") {
    return <PendingAccount request={session.request} />;
  }

  if (session.kind === "inactive") {
    return (
      <AuthShell
        title="Account inactive"
        lede="This profile no longer has access to the foundation workspace."
        footer={
          <button className="btn btn--text" onClick={() => void signOut()}>
            Sign out
          </button>
        }
      >
        <Notice kind="error">
          Contact a foundation administrator if you think this is a mistake.
        </Notice>
      </AuthShell>
    );
  }

  const staff = isStaff(session.user);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={
            <Lazy>
              <Dashboard />
            </Lazy>
          }
        />
        <Route
          path="people"
          element={
            <Lazy>
              <PeopleDirectory />
            </Lazy>
          }
        />
        <Route
          path="people/:id"
          element={
            <Lazy>
              <ParticipantDetail />
            </Lazy>
          }
        />
        <Route
          path="profile"
          element={
            <Lazy>
              <MyProfile />
            </Lazy>
          }
        />
        <Route
          path="settings"
          element={
            <Lazy>
              <Settings />
            </Lazy>
          }
        />

        {staff ? (
          <>
            <Route
              path="approvals"
              element={
                <Lazy>
                  <Approvals />
                </Lazy>
              }
            />
            <Route
              path="slots"
              element={
                <Lazy>
                  <ManageSlots />
                </Lazy>
              }
            />
            <Route
              path="people/new"
              element={
                <Lazy>
                  <AddParticipant />
                </Lazy>
              }
            />
            <Route
              path="projects"
              element={
                <Lazy>
                  <Projects />
                </Lazy>
              }
            />
          </>
        ) : (
          <>
            <Route
              path="opportunities"
              element={
                <Lazy>
                  <Opportunities />
                </Lazy>
              }
            />
            <Route
              path="commitments"
              element={
                <Lazy>
                  <MyCommitments />
                </Lazy>
              }
            />
          </>
        )}

        <Route path="login" element={<Navigate to="/" replace />} />
        <Route path="request-account" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

/**
 * Suspense boundary for a lazily loaded page. It sits inside <Layout />, so the
 * sidebar and top bar stay painted while the page chunk arrives — the shell
 * never flashes.
 */
function Lazy({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="content" style={{ paddingTop: "var(--sp-7)" }}>
          <div className="card" style={{ overflow: "hidden" }}>
            <SkeletonRows rows={6} />
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
