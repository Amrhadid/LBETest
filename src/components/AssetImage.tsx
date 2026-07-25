"use client";

/* eslint-disable @next/next/no-img-element -- public assets intentionally use the Cloudflare-safe img helper. */

import * as React from "react";

import { cn } from "@/lib/utils";

type AssetImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackClassName?: string;
};

/** Renders a public brand asset while preserving a stable, graceful fallback. */
export function AssetImage({
  alt,
  className,
  fallbackClassName,
  onError,
  ...props
}: AssetImageProps) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <span
        role="img"
        aria-label={alt || "Image unavailable"}
        className={cn(
          "flex h-full w-full items-center justify-center bg-ivory-deep text-center text-xs font-medium text-muted-foreground",
          fallbackClassName,
        )}
      >
        Image unavailable
      </span>
    );
  }

  // The source files are fixed public assets; using an img keeps the helper
  // compatible with Cloudflare's unoptimized image configuration.
  return (
    <img
      alt={alt}
      className={className}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}
