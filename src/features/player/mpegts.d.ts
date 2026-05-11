import type {
  MpegtsPlayer,
  MpegtsPlayerConfig,
  MpegtsPlayerOptions,
} from "./types";

declare global {
  interface Window {
    mpegts: {
      isSupported: () => boolean;
      createPlayer: (
        config: MpegtsPlayerConfig,
        options?: MpegtsPlayerOptions,
      ) => MpegtsPlayer;
      Events: {
        LOADING_COMPLETE: string;
        METADATA_ARRIVED: string;
        ERROR: string;
      };
    };
  }
}

export {};
