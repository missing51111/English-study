"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  buildStudyFallbackImagePath,
  buildStudyImagePath,
  getStudyImageStatus,
  type StudyImageKind,
} from "@/lib/studyImages";

type StudyItemImageProps = {
  id: string;
  kind: StudyImageKind;
  alt: string;
  imageName?: string | null;
  imageStatus?: string | null;
  className?: string;
  sizes?: string;
  showFallbackWhenMissing?: boolean;
};

export default function StudyItemImage({
  id,
  kind,
  alt,
  imageName,
  imageStatus,
  className = "",
  sizes = "(max-width: 768px) 100vw, 320px",
  showFallbackWhenMissing = true,
}: StudyItemImageProps) {
  const fallbackSrc = useMemo(() => buildStudyFallbackImagePath(kind), [kind]);
  const preferredSrc = useMemo(
    () => buildStudyImagePath(kind, id, imageName),
    [id, imageName, kind]
  );
  const status = getStudyImageStatus(imageStatus);
  const [src, setSrc] = useState(
    showFallbackWhenMissing && status === "missing" ? fallbackSrc : preferredSrc
  );
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    setSrc(showFallbackWhenMissing && status === "missing" ? fallbackSrc : preferredSrc);
    setIsHidden(false);
  }, [fallbackSrc, preferredSrc, showFallbackWhenMissing, status]);

  if (isHidden) return null;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-100 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        onError={() => {
          if (showFallbackWhenMissing && src !== fallbackSrc) {
            setSrc(fallbackSrc);
            return;
          }
          setIsHidden(true);
        }}
      />
    </div>
  );
}
