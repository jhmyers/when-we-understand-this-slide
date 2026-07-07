// ============================================================================
// Deployment configuration — the only file you should need to touch to go live.
// ============================================================================

// Google Form share link for "Redline the Map" (e.g. 'https://forms.gle/XXXX'
// or the full docs.google.com/forms/d/e/.../viewform URL).
// Leave empty to fall back to GitHub issues everywhere.
export const FORM_URL = '';

// The entry ID for the "Which part of the map?" short-answer question,
// taken from a pre-filled link (looks like 'entry.123456789').
// Leave empty to skip node-name pre-filling.
export const FORM_NODE_ENTRY = '';

// Google Form share link for the "Follow the Draft" signup (email + how
// involved). Leave empty to fall back to GitHub watch.
export const NOTIFY_URL = '';

// The nerd path — pre-filled GitHub issue on the public repo.
export const REPO_URL = 'https://github.com/jhmyers/when-we-understand-this-slide';

/** URL for the "notify me" ask. */
export function notifyUrl() {
  return NOTIFY_URL || `${REPO_URL}/subscription`;
}

/** Build the redline URL for a given node (or null for a general redline). */
export function redlineUrl(node) {
  if (FORM_URL) {
    if (node && FORM_NODE_ENTRY) {
      const base = FORM_URL.includes('viewform') ? FORM_URL : FORM_URL.replace(/\/?$/, '');
      const sep = base.includes('?') ? '&' : '?';
      return `${base}${sep}usp=pp_url&${FORM_NODE_ENTRY}=${encodeURIComponent(node.label)}`;
    }
    return FORM_URL;
  }
  // Fallback: GitHub issue
  if (node) {
    const title = encodeURIComponent(`Redline: ${node.label}`);
    const body = encodeURIComponent(
      `**Node:** ${node.label} (\`${node.id}\`)\n**Its 2009 counterpart:** ${node.coin}\n\n**What's wrong / missing:**\n\n`);
    return `${REPO_URL}/issues/new?title=${title}&body=${body}`;
  }
  const body = encodeURIComponent(
    `**Which node or arrow:**\n\n**What it should say instead:**\n\n**The loop you live in that we haven't named (optional):**\n\n`);
  return `${REPO_URL}/issues/new?title=${encodeURIComponent('Redline: the map')}&body=${body}`;
}
