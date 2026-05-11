export type StatusType = "" | "error" | "success";

export interface MpegtsPlayerConfig {
  type: string;
  isLive: boolean;
  url: string;
}

export interface MpegtsPlayerOptions {
  enableWorker?: boolean;
  liveBufferLatencyChasing?: boolean;
  liveBufferLatencyMaxLatency?: number;
  liveBufferLatencyMinRemain?: number;
  liveBufferLatencyChasingOnPaused?: boolean;
  autoCleanupSourceBuffer?: boolean;
  autoCleanupMaxBackwardDuration?: number;
  autoCleanupMinBackwardDuration?: number;
}

export interface MpegtsPlayer {
  attachMediaElement: (element: HTMLVideoElement) => void;
  load: () => void;
  play: () => Promise<void>;
  pause: () => void;
  unload: () => void;
  detachMediaElement: () => void;
  destroy: () => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
}
