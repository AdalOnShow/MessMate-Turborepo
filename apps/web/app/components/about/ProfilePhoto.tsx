"use client";

import { useEffect, useRef, useState } from "react";

/** The author's photo, falling back to initials if the file is missing. */
export function ProfilePhoto({
  src,
  alt,
  initials,
}: {
  src: string;
  alt: string;
  initials: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // The server-rendered <img> can fail before React attaches onError, so
  // check once on mount as well.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        className="flex size-28 shrink-0 items-center justify-center rounded-full border border-border bg-primary/15 font-heading text-3xl font-bold text-primary sm:size-32"
      >
        {initials}
      </span>
    );
  }

  return (
    // A static file in /public; next/image adds nothing for one small photo.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      width={128}
      height={128}
      onError={() => setFailed(true)}
      className="size-28 shrink-0 rounded-full border border-border object-cover sm:size-32"
    />
  );
}
