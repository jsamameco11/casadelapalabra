import type { SVGProps } from "react";

// Kept local to the Impostor Bíblico feature (not in the shared icon set)
// to avoid touching src/components/icons/line-art.tsx while another session
// is actively editing it.

export function IconMask(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        className="line-art"
        d="M3 9c2-2 5-3 9-3s7 1 9 3c0 6-3 10-9 10S3 15 3 9Z"
      />
      <circle className="line-art" cx="8.5" cy="10.5" r="1.4" />
      <circle className="line-art" cx="15.5" cy="10.5" r="1.4" />
      <path className="line-art" d="M9 15c1.5 1 4.5 1 6 0" />
    </svg>
  );
}

export function IconPhone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <rect className="line-art" x="7" y="2" width="10" height="20" rx="2" />
      <path className="line-art" d="M11 19h2" />
    </svg>
  );
}

export function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <circle className="line-art" cx="9" cy="8" r="3" />
      <path className="line-art" d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle className="line-art" cx="17" cy="9" r="2.4" />
      <path className="line-art" d="M15.5 14.2c2.6.4 4.5 2.6 4.5 5.3" />
    </svg>
  );
}
