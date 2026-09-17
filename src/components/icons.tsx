/**
 * Inline icon set, kept local so there's no icon library in the bundle.
 * All icons are decorative (aria-hidden); the surrounding text carries meaning.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

/** The foundation's leaf mark. */
export const LogoMark = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable={false} {...p}>
    <path d="M12 2c-1.6 3.2-4.4 5.1-4.4 8.6 0 2 1 3.6 2.5 4.6L12 12l1.9 3.2c1.5-1 2.5-2.6 2.5-4.6C16.4 7.1 13.6 5.2 12 2z" />
    <path d="M11.4 15.6h1.2V22h-1.2z" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const AlertIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5" />
    <path d="M12 16.5h.01" />
  </svg>
);

export const LockIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
  </svg>
);

export const PhoneIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6.6 3.5h2.8l1.5 3.9-1.9 1.4a11.5 11.5 0 0 0 5.9 5.9l1.4-1.9 3.9 1.5v2.8a2 2 0 0 1-2.2 2A16.2 16.2 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" />
  </svg>
);

export const MailIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.2" />
    <path d="m3.8 6.8 8.2 6 8.2-6" />
  </svg>
);

export const ChatIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5 5 16.2a8.4 8.4 0 1 1 15.5-4.6z" />
  </svg>
);

export const MapPinIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M19.5 10.3c0 5.3-7.5 11.2-7.5 11.2s-7.5-5.9-7.5-11.2a7.5 7.5 0 0 1 15 0z" />
    <circle cx="12" cy="10.2" r="2.6" />
  </svg>
);

export const ClockIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.3 2" />
  </svg>
);

export const CalendarIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
    <path d="M3.5 10h17" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.8" />
    <path d="m20 20-4-4" />
  </svg>
);

export const DownloadIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 4v11" />
    <path d="m7 10.5 5 5 5-5" />
    <path d="M4.5 19.5h15" />
  </svg>
);

export const LogOutIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9.5 20H6.2A2.2 2.2 0 0 1 4 17.8V6.2A2.2 2.2 0 0 1 6.2 4h3.3" />
    <path d="m15.5 16.5 4.5-4.5-4.5-4.5" />
    <path d="M20 12H9.5" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.5 7h15" />
    <path d="M9.5 7V4.8h5V7" />
    <path d="M6.5 7l.9 12.2a1.8 1.8 0 0 0 1.8 1.6h5.6a1.8 1.8 0 0 0 1.8-1.6L17.5 7" />
  </svg>
);

export const NoteIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.5 19.5h4l10.3-10.3a2.1 2.1 0 0 0-3-3L5.5 16.5z" />
    <path d="m13.8 8.2 3 3" />
  </svg>
);

export const EyeIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const EyeOffIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8" />
    <path d="M6.3 7.3A15.6 15.6 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.3-1.1" />
    <path d="M9.9 9.9a2.8 2.8 0 0 0 4 4" />
    <path d="m3.5 3.5 17 17" />
  </svg>
);

export const LinkIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M10 14a4.2 4.2 0 0 0 6 0l3-3a4.2 4.2 0 0 0-6-6l-1 1" />
    <path d="M14 10a4.2 4.2 0 0 0-6 0l-3 3a4.2 4.2 0 0 0 6 6l1-1" />
  </svg>
);

export const ArrowUpRightIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 17 17 7" />
    <path d="M8.5 7H17v8.5" />
  </svg>
);

export const InboxIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.5 13h4.2l1.6 3h5.4l1.6-3h4.2" />
    <path d="M5.6 5.6 3.5 13v5.3a2.2 2.2 0 0 0 2.2 2.2h12.6a2.2 2.2 0 0 0 2.2-2.2V13l-2.1-7.4A2.2 2.2 0 0 0 16.3 4H7.7a2.2 2.2 0 0 0-2.1 1.6z" />
  </svg>
);
