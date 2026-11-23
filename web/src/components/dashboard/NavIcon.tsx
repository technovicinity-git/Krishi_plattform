import { cn } from "@/lib/cn";

/**
 * Line icons for dashboard navigation. Referenced by name so server layouts
 * can pass nav config (plain data) to the client sidebar.
 */
export type NavIconName =
  | "home"
  | "users"
  | "inbox"
  | "briefcase"
  | "wallet"
  | "receipt"
  | "user"
  | "shield"
  | "settings"
  | "clipboard"
  | "tag"
  | "map"
  | "leaf"
  | "chart"
  | "history"
  | "coins"
  | "logout"
  | "lock"
  | "bell"
  | "edit"
  | "eye"
  | "power"
  | "check"
  | "eyeOff";

const PATHS: Record<NavIconName, React.ReactNode> = {
  edit: (
    <>
      <path d="M12.5 4.5l3 3L7 16H4v-3l8.5-8.5z" />
      <path d="M11 6l3 3" />
    </>
  ),
  power: (
    <>
      <path d="M10 3v6" />
      <path d="M6 5.5a6 6 0 1 0 8 0" />
    </>
  ),
  check: <path d="M4.5 10.5l3.5 3.5 7.5-8" />,
  eyeOff: (
    <>
      <path d="M3 3l14 14" />
      <path d="M8.2 5.3A7.6 7.6 0 0 1 10 5c4.8 0 7.5 5 7.5 5a13.6 13.6 0 0 1-2.2 2.8" />
      <path d="M5.4 6.8C3.5 8.2 2.5 10 2.5 10s2.7 5 7.5 5c1.2 0 2.3-.3 3.2-.8" />
      <path d="M8.5 8.6a2.2 2.2 0 0 0 3 3" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 10s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5-7.5-5-7.5-5z" />
      <circle cx="10" cy="10" r="2.2" />
    </>
  ),
  home: (
    <>
      <path d="M3 9.5L10 4l7 5.5" />
      <path d="M5 8.5V16h10V8.5" />
      <path d="M8.5 16v-4h3v4" />
    </>
  ),
  users: (
    <>
      <circle cx="7.5" cy="7" r="2.5" />
      <path d="M3 16c0-2.5 2-4.5 4.5-4.5S12 13.5 12 16" />
      <circle cx="13.5" cy="7.5" r="2" />
      <path d="M13 11.6c2.2.1 4 1.9 4 4.4" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 11l2-6.5h10L17 11v4.5H3V11z" />
      <path d="M3 11h4l1 2h4l1-2h4" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="6.5" width="14" height="9.5" rx="1.5" />
      <path d="M7.5 6.5V5a1 1 0 011-1h3a1 1 0 011 1v1.5" />
      <path d="M3 10.5h14" />
    </>
  ),
  wallet: (
    <>
      <path d="M3.5 6.5h12a1 1 0 011 1v8a1 1 0 01-1 1h-11a1 1 0 01-1-1v-9z" />
      <path d="M3.5 6.5L13 4v2.5" />
      <circle cx="13.5" cy="11.5" r="0.75" fill="currentColor" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 3.5h10v13l-2-1.25-1.5 1.25L10 15.25 8.5 16.5 7 15.25 5 16.5v-13z" />
      <path d="M7.5 7h5M7.5 10h5" />
    </>
  ),
  user: (
    <>
      <circle cx="10" cy="7" r="3" />
      <path d="M4.5 16.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </>
  ),
  shield: (
    <>
      <path d="M10 3l6 2.25v4.5c0 3.4-2.5 6-6 7.25-3.5-1.25-6-3.85-6-7.25v-4.5L10 3z" />
      <path d="M7.5 10l1.75 1.75L12.75 8" />
    </>
  ),
  settings: (
    <>
      <circle cx="10" cy="10" r="2.25" />
      <path d="M10 3v1.75M10 15.25V17M17 10h-1.75M4.75 10H3M14.95 5.05l-1.24 1.24M6.29 13.71l-1.24 1.24M14.95 14.95l-1.24-1.24M6.29 6.29L5.05 5.05" />
    </>
  ),
  clipboard: (
    <>
      <rect x="4.5" y="4.5" width="11" height="12" rx="1.5" />
      <path d="M7.5 4.5V3.5h5v1" />
      <path d="M7.5 9h5M7.5 12h3.5" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 10.5V4.5a1 1 0 011-1h6l6 6-7 7-6-6z" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
    </>
  ),
  map: (
    <>
      <path d="M10 17s5-4.5 5-8.5a5 5 0 00-10 0c0 4 5 8.5 5 8.5z" />
      <circle cx="10" cy="8.5" r="1.75" />
    </>
  ),
  leaf: (
    <>
      <path d="M4.5 15.5C4 9 8 4.5 16 4c-.5 8-5 12-11.5 11.5z" />
      <path d="M4.5 15.5L11 9" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 16.5h13" />
      <path d="M6 13.5V10M10 13.5V6M14 13.5V8.5" />
    </>
  ),
  history: (
    <>
      <path d="M3.5 10a6.5 6.5 0 101.9-4.6" />
      <path d="M3.5 3.5v3h3" />
      <path d="M10 6.5V10l2.5 1.5" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="8" cy="6" rx="4.5" ry="2" />
      <path d="M3.5 6v3.5c0 1.1 2 2 4.5 2s4.5-.9 4.5-2V6" />
      <path d="M7.5 13.4c.2 1 2.1 1.6 4.5 1.6 2.5 0 4.5-.9 4.5-2V9.5c0-1-1.6-1.8-3.8-2" />
    </>
  ),
  logout: (
    <>
      <path d="M8 4H5a1 1 0 00-1 1v10a1 1 0 001 1h3" />
      <path d="M12 13.5L15.5 10 12 6.5M15.5 10H8" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="9" width="10" height="7.5" rx="1.25" />
      <path d="M7 9V6.75a3 3 0 016 0V9" />
    </>
  ),
  bell: (
    <>
      <path d="M5 13.5V9a5 5 0 0110 0v4.5l1.5 1.5h-13L5 13.5z" />
      <path d="M8.5 17a1.75 1.75 0 003 0" />
    </>
  ),
};

export function NavIcon({
  name,
  className,
}: {
  name: NavIconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-[18px] w-[18px] shrink-0", className)}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
