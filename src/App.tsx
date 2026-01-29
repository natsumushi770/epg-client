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
  liveBufferLatencyChasingOnPaused?: boolean;
  autoCleanupSourceBuffer?: boolean;
  autoCleanupMaxBackwardDuration?: number;
  autoCleanupMinBackwardDuration?: number;
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

const STORAGE_KEY_MUTED = "epg-player-muted";
const STORAGE_KEY_VOLUME = "epg-player-volume";

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<MpegtsPlayer | null>(null);
  const hasInitializedRef = useRef(false);
  const [channels, setChannels] = useState<ScheduleItem[]>([]);
  const [currentChannelId, setCurrentChannelId] = useState<number | null>(null);
  const [_channelName, setChannelName] = useState("Loading...");
  const [_status, setStatus] = useState("Ready");
  const [_statusType, setStatusType] = useState<StatusType>("");
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_MUTED) === "true";
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
    return saved ? parseFloat(saved) : 1;
  });
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getProgress = (prog: Program): number => {
    const total = prog.endAt - prog.startAt;
    if (total <= 0) return 0;
    const elapsed = currentTime - prog.startAt;
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDuration = (startAt: number, endAt: number): string => {
    const minutes = Math.round((endAt - startAt) / 60000);
    return `${minutes}分`;
  };

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
        liveBufferLatencyMaxLatency: 5,
        liveBufferLatencyMinRemain: 1,
        liveBufferLatencyChasingOnPaused: true,
        autoCleanupSourceBuffer: true,
        autoCleanupMaxBackwardDuration: 30,
        autoCleanupMinBackwardDuration: 15,
      });

      playerRef.current = player;

      if (videoRef.current) {
        videoRef.current.muted = isMuted;
        videoRef.current.volume = volume;

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
  }, [updateStatus, isMuted, volume]);

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

      if (schedules.length > 0 && !hasInitializedRef.current) {
        hasInitializedRef.current = true;
        const firstChannel = schedules[0].channel;
        setChannelName(firstChannel.name);
        document.title = `EPG Player - ${firstChannel.name}`;
        startStream(firstChannel.id);
      }
    } catch (err) {
      console.error("Failed to load channels:", err);
      updateStatus("Failed to load channel list", "error");
    }
  }, [startStream, updateStatus]);

  useEffect(() => {
    loadChannels();

    const interval = setInterval(() => {
      loadChannels();
    }, 5000);

    return () => {
      clearInterval(interval);
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
      localStorage.setItem(STORAGE_KEY_MUTED, String(video.muted));
      localStorage.setItem(STORAGE_KEY_VOLUME, String(video.volume));
    };

    video.addEventListener("volumechange", handleVolumeChange);
    return () => video.removeEventListener("volumechange", handleVolumeChange);
  }, []);

  return (
    <div className="player-container">
      <div className="sidebar">
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
                  {prog && (
                    <div className="channel-item-time">
                      {formatTime(prog.startAt)} - {formatTime(prog.endAt)} ({formatDuration(prog.startAt, prog.endAt)})
                    </div>
                  )}
                  {prog?.description && (
                    <div className="channel-item-desc">{prog.description}</div>
                  )}
                  {prog && (
                    <div className="channel-item-progress">
                      <div
                        className="channel-item-progress-bar"
                        style={{ width: `${getProgress(prog)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="main-content">
        <div className="video-wrapper">
          <video ref={videoRef} controls autoPlay />
        </div>

        <div className="controls">
          <input
            type="range"
            className="volume-slider"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            style={{
              background: `linear-gradient(to right, #5c6bc0 0%, #5c6bc0 ${volume * 100}%, #2a2a4a ${volume * 100}%, #2a2a4a 100%)`,
            }}
            onChange={(e) => {
              const newVolume = parseFloat(e.target.value);
              setVolume(newVolume);
              if (videoRef.current) {
                videoRef.current.volume = newVolume;
                videoRef.current.muted = newVolume === 0;
              }
              localStorage.setItem(STORAGE_KEY_VOLUME, String(newVolume));
            }}
          />
        </div>

        {(() => {
          const currentChannel = channels.find(c => c.channel.id === currentChannelId);
          const currentProg = currentChannel?.programs[0];
          if (!currentProg) return null;
          return (
            <div className="now-playing">
              <div className="now-playing-channel">{currentChannel?.channel.name}</div>
              <div className="now-playing-title">{currentProg.name}</div>
              <div className="now-playing-time">
                {formatTime(currentProg.startAt)} - {formatTime(currentProg.endAt)} ({formatDuration(currentProg.startAt, currentProg.endAt)})
              </div>
              {currentProg.description && (
                <div className="now-playing-desc">{currentProg.description}</div>
              )}
              <div className="now-playing-progress">
                <div
                  className="now-playing-progress-bar"
                  style={{ width: `${getProgress(currentProg)}%` }}
                />
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default App;
