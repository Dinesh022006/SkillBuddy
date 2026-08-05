import { LinkifyIt } from 'linkify-it';
import tlds from 'tlds';

// Initialize LinkifyIt and populate with valid Top Level Domains
const linkify = new LinkifyIt()
  .tlds(tlds)
  .set({ fuzzyLink: true, fuzzyEmail: true, fuzzyIP: false });

export function parseUrls(text: string) {
  if (!text) return [];
  
  const matches = linkify.match(text);
  return matches || [];
}

export function isValidProtocol(url: string): boolean {
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol.toLowerCase();
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(protocol);
  } catch {
    return false;
  }
}

export { linkify };
