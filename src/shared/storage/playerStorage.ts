const PLAYER_MUTED_KEY = "epg-player-muted";
const PLAYER_VOLUME_KEY = "epg-player-volume";

export const readSavedVolume = () => {
  const saved = localStorage.getItem(PLAYER_VOLUME_KEY);
  return saved !== null ? parseFloat(saved) : 1;
};

export const saveVolume = (volume: number) => {
  localStorage.setItem(PLAYER_VOLUME_KEY, String(volume));
};

export const readSavedMuted = () => localStorage.getItem(PLAYER_MUTED_KEY) === "true";

export const saveMuted = (isMuted: boolean) => {
  localStorage.setItem(PLAYER_MUTED_KEY, String(isMuted));
};
