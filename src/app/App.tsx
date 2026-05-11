import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { ChannelList } from "../features/channels/ChannelList";
import { NowPlaying } from "../features/player/NowPlaying";
import { useMpegtsPlayer } from "../features/player/useMpegtsPlayer";
import { usePlayerVolume } from "../features/player/usePlayerVolume";
import { VideoPlayer } from "../features/player/VideoPlayer";
import { fetchSchedules } from "../shared/api/tauri";
import { useCurrentTime } from "../shared/hooks/useCurrentTime";
import type { StatusType } from "../features/player/types";
import type { ScheduleItem } from "../features/schedules/types";
import "./App.css";

const App = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [channels, setChannels] = useState<ScheduleItem[]>([]);
  const [, setChannelName] = useState("Loading...");
  const [, setStatus] = useState("Ready");
  const [, setStatusType] = useState<StatusType>("");
  const [controlsVisible, setControlsVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const currentTime = useCurrentTime();

  const updateStatus = useCallback((message: string, type: StatusType = "") => {
    setStatus(message);
    setStatusType(type);
  }, []);

  const { currentChannelId, startStream } = useMpegtsPlayer({
    videoRef,
    onStatusChange: updateStatus,
  });

  const { volume, isMuted, handleVolumeChange, handleMuteToggle } =
    usePlayerVolume(videoRef);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);

    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);

    hideControlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  }, []);

  const hideControls = useCallback(() => {
    setControlsVisible(false);

    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
  }, []);

  const switchChannel = useCallback(
    (channelId: number, name: string) => {
      setChannelName(name);
      document.title = `EPG Player - ${name}`;
      startStream(channelId);
    },
    [startStream],
  );

  const handleFullscreenToggle = useCallback(async () => {
    const wrapper = videoWrapperRef.current;

    if (!document.fullscreenElement && wrapper?.requestFullscreen) {
      try {
        await wrapper.requestFullscreen();
        return;
      } catch (err) {
        console.warn(
          "requestFullscreen failed, falling back to Tauri window fullscreen:",
          err,
        );
      }
    }

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        return;
      } catch (err) {
        console.warn(
          "exitFullscreen failed, falling back to Tauri window fullscreen:",
          err,
        );
      }
    }

    try {
      const appWindow = getCurrentWindow();
      const next = !(await appWindow.isFullscreen());
      await appWindow.setFullscreen(next);
      setIsFullscreen(next);
    } catch (err) {
      console.error("Failed to toggle fullscreen:", err);
      updateStatus("Failed to toggle fullscreen", "error");
    }
  }, [updateStatus]);

  const loadChannels = useCallback(async () => {
    try {
      const schedules = await fetchSchedules();
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

    return () => clearInterval(interval);
  }, [loadChannels]);

  const currentChannel = channels.find((item) => item.channel.id === currentChannelId);
  const currentProgram = currentChannel?.programs[0];

  return (
    <div className="player-container">
      <div className="sidebar">
        <ChannelList
          channels={channels}
          currentChannelId={currentChannelId}
          currentTime={currentTime}
          onSelectChannel={switchChannel}
        />
      </div>

      <div className="main-content">
        <VideoPlayer
          videoRef={videoRef}
          wrapperRef={videoWrapperRef}
          controlsVisible={controlsVisible}
          isMuted={isMuted}
          volume={volume}
          isFullscreen={isFullscreen}
          onMouseMove={showControlsTemporarily}
          onMouseLeave={hideControls}
          onFullscreenToggle={handleFullscreenToggle}
          onMuteToggle={handleMuteToggle}
          onVolumeChange={handleVolumeChange}
        />

        {currentChannel && currentProgram && (
          <NowPlaying
            channel={currentChannel.channel}
            program={currentProgram}
            currentTime={currentTime}
          />
        )}
      </div>
    </div>
  );
};

export default App;
