"use client";

import * as React from "react";

/**
 * Renders an <img> for an asset in /public, falling back to `fallback` if the
 * file is missing (404) or fails to load. Lets us wire real brand assets by
 * path while keeping a graceful CSS/SVG stand-in until the files are added.
 * Uses a plain <img> (next.config sets images.unoptimized) to stay edge-safe.
 */
export function AssetImage({
  src,
  alt,
  className,
  fallback,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
  width?: number;
  height?: number;
}) {
  const [failed, setFailed] = React.useState(false);
  if (failed) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
