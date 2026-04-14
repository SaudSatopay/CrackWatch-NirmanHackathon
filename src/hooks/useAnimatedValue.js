import { useState, useEffect, useRef } from 'react';

export function useAnimatedValue(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const startRef = useRef(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    startRef.current = value;
    startTimeRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(startRef.current + (target - startRef.current) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}

export function useLiveValue(baseValue, variance = 0.02, interval = 2000) {
  const [value, setValue] = useState(baseValue);
  useEffect(() => {
    const id = setInterval(() => {
      setValue(baseValue + (Math.random() - 0.5) * 2 * variance * baseValue);
    }, interval);
    return () => clearInterval(id);
  }, [baseValue, variance, interval]);
  return value;
}

export function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}
