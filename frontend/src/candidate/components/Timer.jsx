// components/Timer.jsx
import React, { useState, useEffect } from 'react';

export const Timer = ({ initialTime, onExpire }) => {
  const [time, setTime] = useState(initialTime || 0);

  useEffect(() => {
    if (time <= 0) {
      onExpire?.();
      return;
    }
    const interval = setInterval(() => setTime(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [time, onExpire]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isWarning = time < 300;

  return (
    <div className={`font-mono font-bold text-lg ${isWarning ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
      {formatTime(time)}
    </div>
  );
};