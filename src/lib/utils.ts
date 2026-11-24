export { cn } from "cn";

/**
 * Copies text to the clipboard with automatic fallback for non-secure contexts (e.g. HTTP over LAN IP).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try modern Clipboard API (works on HTTPS and localhost)
  if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to execCommand fallback
    }
  }

  // 2. Legacy execCommand fallback (works over plain HTTP on LAN IPs)
  if (typeof document !== "undefined") {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error("execCommand copy failed:", err);
      return false;
    }
  }

  return false;
}
