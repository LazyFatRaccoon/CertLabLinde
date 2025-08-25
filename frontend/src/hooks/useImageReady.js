import { useEffect, useState } from "react";

export function useImageReady(src) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!src) {
      setReady(true);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.src = src;

    const done = () => {
      if (!cancelled) setReady(true);
    };

    if (img.decode) {
      img.decode().then(done).catch(done); // навіть при помилці даємо пройти
    } else {
      img.onload = done;
      img.onerror = done;
    }
    return () => {
      cancelled = true;
    };
  }, [src]);

  return ready;
}
