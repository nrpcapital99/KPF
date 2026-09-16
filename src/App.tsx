import { Navigate, Route, Routes } from "react-router-dom";
import { isStaff, useSession } from "./auth/session";
import AuthShell, { Notice } from "./components/AuthShell";
import { signOut } from "./data/api";
import Layout from "./components/Layout";
import AddParticipant from "./pages/AddParticipant";
import Dashboard from "./pages/Dashboard";
import MyProfile from "./pages/MyProfile";
import ParticipantDetail from "./pages/ParticipantDetail";
import PeopleDirectory from "./pages/PeopleDirectory";
import Projects from "./pages/Projects";
import Settings from "./pages/Settings";
import Approvals from "./pages/admin/Approvals";
import ManageSlots from "./pages/admin/ManageSlots";
import FirstRun from "./pages/auth/FirstRun";
import Login from "./pages/auth/Login";
import RequestAccount from "./pages/auth/RequestAccount";
import PendingAccount from "./pages/auth/PendingAccount";
import MyCommitments from "./pages/volunteer/MyCommitments";
import Opportunities from "./pages/volunteer/Opportunities";

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
        <Route index element={<Dashboard />} />
        <Route path="people" element={<PeopleDirectory />} />
        <Route path="people/:id" element={<ParticipantDetail />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="settings" element={<Settings />} />

        {staff ? (
          <>
            <Route path="approvals" element={<Approvals />} />
            <Route path="slots" element={<ManageSlots />} />
            <Route path="people/new" element={<AddParticipant />} />
            <Route path="projects" element={<Projects />} />
          </>
        ) : (
          <>
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="commitments" element={<MyCommitments />} />
          </>
        )}

        <Route path="login" element={<Navigate to="/" replace />} />
        <Route path="request-account" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
