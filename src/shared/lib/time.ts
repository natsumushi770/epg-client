import { Temporal } from "temporal-polyfill";

import type { Program } from "../../features/schedules/types";

export const getCurrentEpochMilliseconds = () =>
  Temporal.Now.instant().epochMilliseconds;

export const formatTime = (timestamp: number): string => {
  const zdt = Temporal.Instant.fromEpochMilliseconds(timestamp).toZonedDateTimeISO(
    Temporal.Now.timeZoneId(),
  );

  return zdt.toLocaleString("ja-JP", { hour: "2-digit", minute: "2-digit" });
};

export const formatDuration = (startAt: number, endAt: number): string => {
  const minutes = Math.round((endAt - startAt) / 60000);
  return `${minutes}分`;
};

export const getProgramProgress = (
  program: Pick<Program, "startAt" | "endAt">,
  currentTime: number,
): number => {
  const total = program.endAt - program.startAt;
  if (total <= 0) return 0;

  const elapsed = currentTime - program.startAt;
  return Math.max(0, Math.min(100, (elapsed / total) * 100));
};
