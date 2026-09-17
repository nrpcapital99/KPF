import { Suspense, lazy } from "react";
import VolunteerForm from "./form/VolunteerForm";

// The team page is only ever loaded by the team, so volunteers never download
// the sign-in code or the full Firestore SDK.
const AdminApp = lazy(() => import("./admin/AdminApp"));

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export default function App() {
  if (isAdminPath(window.location.pathname)) {
    return (
      <Suspense
        fallback={
          <div className="page-loading" role="status">
            <span className="spinner" aria-hidden />
            <span className="sr-only">Loading…</span>
          </div>
        }
      >
        <AdminApp />
      </Suspense>
    );
  }

  return <VolunteerForm />;
}
