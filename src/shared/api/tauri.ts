import { invoke } from "@tauri-apps/api/core";

import type { ScheduleItem } from "../../features/schedules/types";

export const fetchSchedules = () => invoke<ScheduleItem[]>("fetch_schedules");

export const getStreamUrl = (channelId: number) =>
  invoke<string>("get_stream_url", { channelId });
