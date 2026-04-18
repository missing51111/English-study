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
};

export default function StudyItemImage({
  id,
  kind,
  alt,
  imageName,
  imageStatus,
  className = "",
  sizes = "(max-width: 768px) 100vw, 320px",
}: StudyItemImageProps) {
  const fallbackSrc = useMemo(() => buildStudyFallbackImagePath(kind), [kind]);
  const preferredSrc = useMemo(
    () => buildStudyImagePath(kind, id, imageName),
    [id, imageName, kind]
  );
  const status = getStudyImageStatus(imageStatus);
  const [src, setSrc] = useState(status === "missing" ? fallbackSrc : preferredSrc);

  useEffect(() => {
    setSrc(status === "missing" ? fallbackSrc : preferredSrc);
  }, [fallbackSrc, preferredSrc, status]);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-100 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        onError={() => {
          if (src !== fallbackSrc) setSrc(fallbackSrc);
        }}
      />
    </div>
  );
}
