import AuthShell, { Notice } from "../../components/AuthShell";
import { signOut } from "../../data/api";
import type { AccountRequest } from "../../types";

export default function PendingAccount({ request }: { request: AccountRequest | null }) {
  const rejected = request?.status === "REJECTED";

  return (
    <AuthShell
      title={rejected ? "Request declined" : "Approval pending"}
      lede={
        rejected
          ? "Your request was reviewed but could not be approved."
          : "Your Firebase account is ready. A foundation administrator still needs to approve your volunteer profile."
      }
      footer={
        <button className="btn btn--text" onClick={() => void signOut()}>
          Sign out
        </button>
      }
    >
      <Notice kind={rejected ? "error" : "warn"}>
        {rejected
          ? request?.decisionNote ||
            "Please contact the foundation if you think this decision should be reviewed."
          : request
            ? `Your request from ${request.email} is waiting for review.`
            : "No approved participant profile is linked to this account. Please contact an administrator."}
      </Notice>
    </AuthShell>
  );
}
