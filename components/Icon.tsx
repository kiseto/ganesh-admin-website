import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "activity" | "arrow-left" | "building" | "calendar" | "check"
  | "chevron-down" | "clock" | "dashboard" | "edit" | "eye" | "eye-off"
  | "facebook" | "file" | "heart" | "help" | "home" | "image"
  | "layers" | "link" | "lock" | "logout" | "mail" | "map"
  | "menu" | "monitor" | "package" | "paint" | "phone" | "ruler"
  | "save" | "settings" | "smartphone" | "tablet" | "upload"
  | "user" | "x";

const paths: Record<IconName, ReactNode> = {
  activity: <path d="M3 12h4l2-7 4 14 2-7h6" />,
  "arrow-left": <path d="m15 18-6-6 6-6" />,
  building: <path d="M4 21h16M6 21V4h9v17M15 9h3l1 12M9 8h2M9 12h2M9 16h2" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
  "eye-off": <><path d="m3 3 18 18"/><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a17.2 17.2 0 0 1-3 3.7M6.2 6.2C3.5 7.9 2 12 2 12s3.5 6 10 6c1.1 0 2.1-.2 3-.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>,
  facebook: <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v5h4v-5h3l1-4h-4V9c0-.7.3-1 1-1Z"/>,
  file: <><path d="M6 2h9l5 5v15H6Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 4.5 1.5c-.8.8-2.1 1.2-2.1 2.5M12 17h.01"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-6h6v6"/></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 15-5-5L5 20"/></>,
  layers: <><path d="m12 2 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></>,
  link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"/></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h7v18h-7"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  map: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  monitor: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>,
  package: <><path d="m12 2 9 5-9 5-9-5Z"/><path d="m3 7 9 5 9-5v10l-9 5-9-5ZM12 12v10"/></>,
  paint: <><circle cx="12" cy="12" r="9"/><circle cx="8" cy="9" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16" cy="10" r="1"/><path d="M13 17c0 1.7-2 2-3 1s0-3 1.5-4.5"/></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.7 19.7 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.7 19.7 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>,
  ruler: <><path d="m3 17 14-14 4 4L7 21H3Z"/><path d="m14 6 4 4M11 9l2 2M8 12l2 2M5 15l2 2"/></>,
  save: <><path d="M5 3h12l3 3v15H4V3Z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19 15.5l2 1.5-3 4-2-1.5a8 8 0 0 1-3 1V23H8v-2.5a8 8 0 0 1-3-1L3 21l-3-4 2-1.5a8 8 0 0 1 0-3L0 11l3-4 2 1.5a8 8 0 0 1 3-1V5h5v2.5a8 8 0 0 1 3 1L18 7l3 4-2 1.5a8 8 0 0 1 0 3Z"/></>,
  smartphone: <><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></>,
  tablet: <><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 18h2"/></>,
  upload: <><path d="M12 16V3M7 8l5-5 5 5"/><path d="M5 13v8h14v-8"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  x: <path d="M6 6l12 12M18 6 6 18"/>,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" {...props}>
      {paths[name]}
    </svg>
  );
}
