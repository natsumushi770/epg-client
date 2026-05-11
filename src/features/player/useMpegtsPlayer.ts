import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { getStreamUrl } from "../../shared/api/tauri";
import type { MpegtsPlayer, StatusType } from "./types";

interface UseMpegtsPlayerOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  onStatusChange: (message: string, type?: StatusType) => void;
}

export const useMpegtsPlayer = ({
  videoRef,
  onStatusChange,
}: UseMpegtsPlayerOptions) => {
  const playerRef = useRef<MpegtsPlayer | null>(null);
  const [currentChannelId, setCurrentChannelId] = useState<number | null>(null);

  const destroyPlayer = useCallback(() => {
    if (!playerRef.current) return;

    playerRef.current.pause();
    playerRef.current.unload();
    playerRef.current.detachMediaElement();
    playerRef.current.destroy();
    playerRef.current = null;
  }, []);

  const startStream = useCallback(
    async (channelId: number) => {
      destroyPlayer();
      setCurrentChannelId(channelId);

      const streamUrl = await getStreamUrl(channelId);

      if (window.mpegts && window.mpegts.isSupported()) {
        const player = window.mpegts.createPlayer(
          {
            type: "mpegts",
            isLive: true,
            url: streamUrl,
          },
          {
            enableWorker: true,
            liveBufferLatencyChasing: true,
            liveBufferLatencyMaxLatency: 5,
            liveBufferLatencyMinRemain: 1,
            liveBufferLatencyChasingOnPaused: true,
            autoCleanupSourceBuffer: true,
            autoCleanupMaxBackwardDuration: 30,
            autoCleanupMinBackwardDuration: 15,
          },
        );

        playerRef.current = player;

        if (videoRef.current) {
          player.attachMediaElement(videoRef.current);
          player.load();

          player.on(window.mpegts.Events.LOADING_COMPLETE, () => {
            onStatusChange("Stream loaded", "success");
          });

          player.on(window.mpegts.Events.METADATA_ARRIVED, () => {
            onStatusChange("Playing stream", "success");
            videoRef.current?.play().catch(() => {
              onStatusChange("Autoplay blocked. Click play button.", "error");
            });
          });

          player.on(window.mpegts.Events.ERROR, (_type: unknown, detail: unknown) => {
            console.log("MPEGTS Error:", detail);
            onStatusChange(`Error: ${detail}`, "error");
          });

          onStatusChange("Connecting to stream...", "");

          videoRef.current.play().catch(() => {
            console.log("Waiting for autoplay...");
          });
        }
      } else {
        onStatusChange("MPEG-TS playback not supported", "error");
      }
    },
    [destroyPlayer, onStatusChange, videoRef],
  );

  useEffect(() => destroyPlayer, [destroyPlayer]);

  return {
    currentChannelId,
    startStream,
  };
};
