export function extractYoutubeId(url: string): string {
  const trimmed = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) return m[1];
  }
  // Already looks like a bare 11-char video id.
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return "";
}
