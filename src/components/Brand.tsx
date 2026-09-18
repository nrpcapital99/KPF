import logoUrl from "../assets/kpf-logo.png";
import { FOUNDATION } from "../config";

/** The foundation's logo. Sits on light surfaces only — the wordmark is black. */
export default function Brand({
  size = "md",
  href,
}: {
  size?: "sm" | "md" | "lg";
  href?: string;
}) {
  const image = (
    <img
      className={`brand__img brand__img--${size}`}
      src={logoUrl}
      width={700}
      height={111}
      alt={FOUNDATION.name}
    />
  );

  return href ? (
    <a className="brand" href={href}>
      {image}
    </a>
  ) : (
    <span className="brand">{image}</span>
  );
}
