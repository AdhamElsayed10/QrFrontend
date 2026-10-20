/**
 * Robust cross-browser clipboard copy helper
 * Works in both secure contexts (HTTPS/localhost) and non-secure contexts (HTTP/IPs)
 */
export async function copyToClipboard(text) {
  if (!text) return false;

  // 1. Try modern navigator.clipboard if available
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('[Clipboard] navigator.clipboard.writeText failed, attempting fallback:', err);
    }
  }

  // 2. Reliable textarea fallback using document.execCommand('copy')
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (successful) return true;
  } catch (err) {
    console.error('[Clipboard] Textarea fallback failed:', err);
  }

  // 3. Selection range fallback (specifically for iOS Safari)
  try {
    const range = document.createRange();
    const span = document.createElement('span');
    span.textContent = text;
    span.style.position = 'fixed';
    span.style.left = '-9999px';
    span.style.top = '-9999px';
    span.style.opacity = '0';

    document.body.appendChild(span);
    range.selectNode(span);

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
      const successful = document.execCommand('copy');
      selection.removeAllRanges();
      document.body.removeChild(span);
      if (successful) return true;
    }
  } catch (err) {
    console.error('[Clipboard] Selection range fallback failed:', err);
  }

  return false;
}
