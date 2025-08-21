import React, { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';

interface ActivityMonitorProps {
  timeoutMinutes: number;
  onInactivity: () => void;
}

const ActivityMonitor: React.FC<ActivityMonitorProps> = ({ timeoutMinutes, onInactivity }) => {
  const [timeLeft, setTimeLeft] = useState(timeoutMinutes * 60);
  const [isActive, setIsActive] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    setTimeLeft(timeoutMinutes * 60);
    setIsActive(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onInactivity();
    }, timeoutMinutes * 60 * 1000);
  };

  const handleActivity = () => {
    resetTimer();
  };

  useEffect(() => {
    // Activity event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the timer
    resetTimer();

    // Countdown interval
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setIsActive(false);
        }
        return Math.max(0, newTime);
      });
    }, 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeoutMinutes]);

  // Update timer when timeout changes
  useEffect(() => {
    resetTimer();
  }, [timeoutMinutes]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWarningLevel = () => {
    const percentage = (timeLeft / (timeoutMinutes * 60)) * 100;
    if (percentage <= 10) return 'critical';
    if (percentage <= 25) return 'warning';
    return 'normal';
  };

  const warningLevel = getWarningLevel();

  return (
    <div className="fixed top-4 right-4 z-40">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg bg-card/90 backdrop-blur-sm border shadow-lg
        transition-all duration-300
        ${warningLevel === 'critical' ? 'border-destructive bg-destructive/10 animate-pulse-glow' :
          warningLevel === 'warning' ? 'border-warning bg-warning/10' :
          'border-border'}
      `}>
        <Clock className={`w-4 h-4 ${
          warningLevel === 'critical' ? 'text-destructive' :
          warningLevel === 'warning' ? 'text-warning' :
          'text-muted-foreground'
        }`} />
        <span className={`text-sm font-mono ${
          warningLevel === 'critical' ? 'text-destructive font-bold' :
          warningLevel === 'warning' ? 'text-warning font-medium' :
          'text-muted-foreground'
        }`}>
          {formatTime(timeLeft)}
        </span>
        {warningLevel !== 'normal' && (
          <span className="text-xs text-muted-foreground">
            until lock
          </span>
        )}
      </div>
      
      {warningLevel === 'critical' && (
        <div className="mt-2 p-2 rounded bg-destructive/20 border border-destructive/30 animate-slide-up">
          <p className="text-xs text-destructive font-medium text-center">
            Locking soon!
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivityMonitor;