import { LogoMark } from "./icons";

export default function Brand({
  size = "md",
  href,
}: {
  size?: "sm" | "md";
  href?: string;
}) {
  const content = (
    <>
      <LogoMark className="brand__mark" />
      <span>
        <span className="brand__name">KANAK PARAKH</span>
        <span className="brand__sub">FOUNDATION</span>
      </span>
    </>
  );

  const className = `brand${size === "sm" ? " brand--sm" : ""}`;

  return href ? (
    <a className={className} href={href} aria-label="Kanak Parakh Foundation home">
      {content}
    </a>
  ) : (
    <span className={className}>{content}</span>
  );
}
