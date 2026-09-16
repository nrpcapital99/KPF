import type { ReactNode } from "react";
import { AlertIcon, CheckIcon, InfoIcon, Logo } from "./icons";

/** Centred, sidebar-free frame for the signed-out screens. */
export default function AuthShell({
  title,
  lede,
  wide,
  children,
  footer,
}: {
  title: string;
  lede?: ReactNode;
  wide?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth">
      <div className="auth__brand">
        <Logo />
        <div>
          <div className="auth__wordmark">KANAK PARAKH</div>
          <div className="auth__sub">FOUNDATION</div>
        </div>
      </div>

      <div className={`card auth__card${wide ? " auth__card--wide" : ""}`}>
        <h1 className="auth__title">{title}</h1>
        {lede && <p className="auth__lede">{lede}</p>}
        {children}
      </div>

      {footer && <div className="auth__foot">{footer}</div>}
    </div>
  );
}

export function Notice({
  kind = "info",
  children,
}: {
  kind?: "info" | "warn" | "error" | "ok";
  children: ReactNode;
}) {
  const Icon = kind === "ok" ? CheckIcon : kind === "info" ? InfoIcon : AlertIcon;
  return (
    <div className={`notice notice--${kind}`} role={kind === "error" ? "alert" : undefined}>
      <Icon />
      <span>{children}</span>
    </div>
  );
}
