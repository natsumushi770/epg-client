import type { IconProps } from "./types";

export const ExitFullscreenIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9.5 4v5.5H4M4 9.5 9.5 4" />
    <path d="M14.5 4v5.5H20M20 9.5 14.5 4" />
    <path d="M9.5 20v-5.5H4M4 14.5 9.5 20" />
    <path d="M14.5 20v-5.5H20M20 14.5 14.5 20" />
  </svg>
);
