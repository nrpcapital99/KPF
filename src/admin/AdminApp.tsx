import { useEffect } from "react";
import Responses from "./Responses";
import SignIn from "./SignIn";
import { useAuth } from "./data";
import "./admin.css";

/** The team page: sign in, then the live list of responses. */
export default function AdminApp() {
  const auth = useAuth();

  useEffect(() => {
    document.title = "Volunteer responses · Kanak Parakh Foundation";
  }, []);

  if (auth.kind === "loading") {
    return (
      <div className="page-loading" role="status">
        <span className="spinner" aria-hidden />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  return auth.kind === "in" ? <Responses user={auth.user} /> : <SignIn />;
}
