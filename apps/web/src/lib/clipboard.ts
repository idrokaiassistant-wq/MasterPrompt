export async function copyToClipboard(text: string): Promise<void> {
  if (typeof window === 'undefined') return;

  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!ok) throw new Error('copy_failed');
}

