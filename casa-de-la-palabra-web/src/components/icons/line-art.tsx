import type { SVGProps } from "react";

// A small shared set of line-art icons matching the brand's visual language:
// thin strokes, open contours, no fills. Add to this set rather than pulling
// in an icon library, so every icon on the site reads as one family.

export function IconCross(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path className="line-art" d="M12 3v18M6 9h12" />
    </svg>
  );
}

export function IconOpenBook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        className="line-art"
        d="M3 6.5c2.5-1.3 5-1.3 9 0v12c-4-1.3-6.5-1.3-9 0v-12ZM21 6.5c-2.5-1.3-5-1.3-9 0v12c4-1.3 6.5-1.3 9 0v-12Z"
      />
    </svg>
  );
}

export function IconDove(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        className="line-art"
        d="M3 12c3-3 6-3 8-1 1-3 4-6 10-7-3 3-4 6-3 9-2 2-5 2-7 0-1 2-4 3-8 3Z"
      />
      <circle className="line-art" cx="16.5" cy="8.5" r=".6" />
    </svg>
  );
}

export function IconMountainPath(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path className="line-art" d="M2 19 9 7l4 6 2-3 7 9H2Z" />
      <path className="line-art" d="M8 19c1.5-3 3-4 4-4s2.5 1 4 4" />
    </svg>
  );
}

export function IconFlame(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        className="line-art"
        d="M12 2c1 3-3 4-3 8a3 3 0 0 0 6 0c1 1 2 2.5 2 4.5A5 5 0 0 1 7 14.5C7 9 12 7 12 2Z"
      />
    </svg>
  );
}

export function IconTrophy(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        className="line-art"
        d="M7 4h10v4a5 5 0 0 1-10 0V4ZM7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M10 15v3h4v-3M8 21h8"
      />
    </svg>
  );
}

export function IconSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <circle className="line-art" cx="11" cy="11" r="6.5" />
      <path className="line-art" d="m20 20-4.3-4.3" />
    </svg>
  );
}

export function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path className="line-art" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconClose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path className="line-art" d="m5 5 14 14M19 5 5 19" />
    </svg>
  );
}

export function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path className="line-art" d="m6 9 6 6 6-6" />
    </svg>
  );
}

// Google's logo is reproduced in its official brand colors (not the site's
// line-art style) since "Sign in with Google" buttons must stay recognizable.
export function IconGoogle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4 3.11C6.22 6.87 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}
