import { useCallback, useEffect, useState, type ChangeEvent, type RefObject } from "react";

import {
  readSavedMuted,
  readSavedVolume,
  saveMuted,
  saveVolume,
} from "../../shared/storage/playerStorage";

export const usePlayerVolume = (videoRef: RefObject<HTMLVideoElement | null>) => {
  const [volume, setVolume] = useState(readSavedVolume);
  const [isMuted, setIsMuted] = useState(readSavedMuted);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, videoRef, volume]);

  const handleVolumeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextVolume = parseFloat(event.target.value);
    setVolume(nextVolume);
    setIsMuted(false);
    saveVolume(nextVolume);
    saveMuted(false);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted((previous) => {
      const next = !previous;
      saveMuted(next);
      return next;
    });
  }, []);

  return {
    volume,
    isMuted,
    handleVolumeChange,
    handleMuteToggle,
  };
};
