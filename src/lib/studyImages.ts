export type StudyImageKind = "words" | "questions";

export type StudyImageItem = {
  id: string;
  type: string;
  english_text: string;
  japanese_text: string;
  image_name?: string | null;
  image_status?: string | null;
};

function normalizeId(value: string): string {
  return String(value).trim();
}

export function buildStudyImagePath(
  kind: StudyImageKind,
  id: string,
  imageName?: string | null
): string {
  const normalizedName = imageName?.trim();
  if (normalizedName) {
    if (normalizedName.includes(".")) return `/images/${kind}/${normalizedName}`;
    return `/images/${kind}/${normalizedName}.png`;
  }

  return `/images/${kind}/${normalizeId(id)}.png`;
}

export function buildStudyFallbackImagePath(kind: StudyImageKind): string {
  return `/images/defaults/${kind}.svg`;
}

export function getStudyImageStatus(imageStatus?: string | null): "ready" | "missing" | "pending" {
  if (imageStatus === "ready") return "ready";
  if (imageStatus === "pending") return "pending";
  return "missing";
}
