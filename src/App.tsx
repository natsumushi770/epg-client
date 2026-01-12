import { useEffect, useRef, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

declare global {
  interface Window {
    mpegts: {
      isSupported: () => boolean;
      createPlayer: (config: MpegtsPlayerConfig, options?: MpegtsPlayerOptions) => MpegtsPlayer;
      Events: {
        LOADING_COMPLETE: string;
        METADATA_ARRIVED: string;
        ERROR: string;
      };
    };
  }
}

interface MpegtsPlayerConfig {
  type: string;
  isLive: boolean;
  url: string;
}

interface MpegtsPlayerOptions {
  enableWorker?: boolean;
  liveBufferLatencyChasing?: boolean;
  liveBufferLatencyMaxLatency?: number;
  liveBufferLatencyMinRemain?: number;
}

interface MpegtsPlayer {
  attachMediaElement: (element: HTMLVideoElement) => void;
  load: () => void;
  play: () => Promise<void>;
  pause: () => void;
  unload: () => void;
  detachMediaElement: () => void;
  destroy: () => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
}

interface TvChannel {
  id: number;
  name: string;
  channelType: string;
  serviceId?: number;
  networkId?: number;
  hasLogoData?: boolean;
  remoteControlKeyId?: number;
}

interface Program {
  id: number;
  name: string;
  description?: string;
  startAt: number;
  endAt: number;
  channelId?: number;
  isFree?: boolean;
}

interface ScheduleItem {
  channel: TvChannel;
  programs: Program[];
}

type StatusType = "" | "error" | "success";

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<MpegtsPlayer | null>(null);
  const [channels, setChannels] = useState<ScheduleItem[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState<number | null>(null);
  const [channelName, setChannelName] = useState("Loading...");
  const [status, setStatus] = useState("Ready");
  const [statusType, setStatusType] = useState<StatusType>("");
  const [isMuted, setIsMuted] = useState(false);

  const updateStatus = useCallback((message: string, type: StatusType = "") => {
    setStatus(message);
    setStatusType(type);
  }, []);

  const startStream = useCallback(async (channelId: number) => {
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.unload();
      playerRef.current.detachMediaElement();
      playerRef.current.destroy();
      playerRef.current = null;
    }

    setCurrentChannelId(channelId);

    // Get stream URL from Rust backend
    const streamUrl: string = await invoke("get_stream_url", { channelId });

    if (window.mpegts && window.mpegts.isSupported()) {
      const player = window.mpegts.createPlayer({
        type: "mpegts",
        isLive: true,
        url: streamUrl,
      }, {
        enableWorker: true,
        liveBufferLatencyChasing: true,
        liveBufferLatencyMaxLatency: 1.5,
        liveBufferLatencyMinRemain: 0.3,
      });

      playerRef.current = player;

      if (videoRef.current) {
        player.attachMediaElement(videoRef.current);
        player.load();

        player.on(window.mpegts.Events.LOADING_COMPLETE, () => {
          updateStatus("Stream loaded", "success");
        });

        player.on(window.mpegts.Events.METADATA_ARRIVED, () => {
          updateStatus("Playing stream", "success");
          videoRef.current?.play().catch(() => {
            updateStatus("Autoplay blocked. Click play button.", "error");
          });
        });

        player.on(window.mpegts.Events.ERROR, (_type: unknown, detail: unknown) => {
          console.log("MPEGTS Error:", detail);
          updateStatus(`Error: ${detail}`, "error");
        });

        updateStatus("Connecting to stream...", "");

        videoRef.current.play().catch(() => {
          console.log("Waiting for autoplay...");
        });
      }
    } else {
      updateStatus("MPEG-TS playback not supported", "error");
    }
  }, [updateStatus]);

  const stopStream = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.unload();
      playerRef.current.detachMediaElement();
      playerRef.current.destroy();
      playerRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    updateStatus("Stopped", "");
  }, [updateStatus]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
      updateStatus(videoRef.current.muted ? "Muted" : "Unmuted", "");
    }
  }, [updateStatus]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen().catch(() => {
        updateStatus("Failed to enter fullscreen", "error");
      });
    } else {
      document.exitFullscreen();
    }
  }, [updateStatus]);

  const switchChannel = useCallback((channelId: number, name: string) => {
    setChannelName(name);
    document.title = `EPG Player - ${name}`;
    startStream(channelId);
  }, [startStream]);

  const loadChannels = useCallback(async () => {
    try {
      // Fetch schedules via Tauri IPC
      const schedules: ScheduleItem[] = await invoke("fetch_schedules");
      setChannels(schedules);

      if (schedules.length > 0 && currentChannelId === null) {
        const firstChannel = schedules[0].channel;
        setChannelName(firstChannel.name);
        document.title = `EPG Player - ${firstChannel.name}`;
        startStream(firstChannel.id);
      }
    } catch (err) {
      console.error("Failed to load channels:", err);
      updateStatus("Failed to load channel list", "error");
    }
  }, [currentChannelId, startStream, updateStatus]);

  useEffect(() => {
    loadChannels();

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="player-container">
      <div className="sidebar">
        <div className="channel-list-header">
          <span>Channels</span>
          <button className="refresh-btn" onClick={loadChannels}>
            Refresh
          </button>
        </div>
        <div className="channel-list">
          {channels.length === 0 ? (
            <div className="channel-item">Loading...</div>
          ) : (
            channels.map((item) => {
              const prog = item.programs[0];
              const isActive = currentChannelId === item.channel.id;

              return (
                <div
                  key={item.channel.id}
                  className={`channel-item ${isActive ? "active" : ""}`}
                  onClick={() => switchChannel(item.channel.id, item.channel.name)}
                >
                  <div className="channel-item-name">{item.channel.name}</div>
                  <div className="channel-item-program">
                    {prog ? prog.name : "No program info"}
                  </div>
                  {prog?.description && (
                    <div className="channel-item-desc">{prog.description}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="main-content">
        <div className="channel-info">
          <span className="live-badge">LIVE</span>
          <span className="channel-name">{channelName}</span>
        </div>

        <div className="video-wrapper">
          <video ref={videoRef} controls autoPlay />
        </div>

        <div className="controls">
          <button onClick={() => currentChannelId && startStream(currentChannelId)}>
            Play
          </button>
          <button onClick={stopStream}>Stop</button>
          <button onClick={toggleMute}>
            {isMuted ? "Unmute" : "Mute"}
          </button>
          <button onClick={toggleFullscreen}>Fullscreen</button>
        </div>

        <div className={`status ${statusType}`}>{status}</div>
      </div>
    </div>
  );
}

export default App;
