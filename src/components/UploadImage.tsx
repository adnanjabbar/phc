"use client";

import { useState } from "react";
import { getUploadUrl } from "@/lib/upload";
import { ImageOff } from "lucide-react";

interface UploadImageProps {
  filePath: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  /** Use for list thumbnails; detail view can use larger sizes */
  size?: "thumb" | "medium" | "large";
}

export function UploadImage({ filePath, alt = "Upload", className = "", size = "medium" }: UploadImageProps) {
  const [error, setError] = useState(false);
  const src = getUploadUrl(filePath);

  const sizes = {
    thumb: { w: 64, h: 64 },
    medium: { w: 320, h: 160 },
    large: { w: 480, h: 320 },
  };
  const { w, h } = sizes[size];

  if (error || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg border ${className}`}
        style={{ minWidth: w, minHeight: h }}
      >
        <ImageOff className="w-8 h-8" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={w}
      height={h}
      className={className}
      onError={() => setError(true)}
    />
  );
}
