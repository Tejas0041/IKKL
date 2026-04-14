import { useState, useEffect } from "react";

// Simple module-level state with subscribers
let _fullscreen = false;
const listeners = new Set<() => void>();

export function setFullscreen(v: boolean) {
  _fullscreen = v;
  listeners.forEach(fn => fn());
}

export function useFullscreen() {
  const [val, setVal] = useState(_fullscreen);
  useEffect(() => {
    const fn = () => setVal(_fullscreen);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return val;
}
