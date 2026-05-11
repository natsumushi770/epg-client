import { useEffect, useState } from "react";

import { getCurrentEpochMilliseconds } from "../lib/time";

export const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(getCurrentEpochMilliseconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentEpochMilliseconds());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return currentTime;
};
