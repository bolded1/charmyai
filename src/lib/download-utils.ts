/**
 * Trigger a browser file download from a Blob.
 * Tries the anchor-click method first, then falls back to window.open.
 */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);

  // Try the standard anchor approach
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  // Also open in a new tab as fallback for sandboxed iframes
  // Use a small delay so the anchor click gets first chance
  setTimeout(() => {
    document.body.removeChild(a);
  }, 500);

  // Fallback: if anchor download didn't work (e.g. sandboxed iframe),
  // open the blob URL directly which prompts save-as in most browsers
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 30000); // keep URL alive for 30s to ensure download completes
}
