import type { IconProps } from "./types";

export const EnterFullscreenIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8.5 4H4v4.5M4 4l6 6" />
    <path d="M15.5 4H20v4.5M20 4l-6 6" />
    <path d="M8.5 20H4v-4.5M4 20l6-6" />
    <path d="M15.5 20H20v-4.5M20 20l-6-6" />
  </svg>
);
