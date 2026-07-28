/**
 * Utility to proxy external images through our local server endpoint
 * to prevent CORS restrictions and canvas tainting during html-to-image PNG exports.
 */
export function getProxiedImageUrl(url: string | undefined): string {
  if (!url) return '';
  // If it's already a base64 data URL, return as-is
  if (url.startsWith('data:')) return url;

  let targetUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    targetUrl = '/' + url;
  }

  // External HTTP/HTTPS URL -> route through Express proxy
  if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
    if (!targetUrl.includes('/api/proxy-image')) {
      targetUrl = `/api/proxy-image?url=${encodeURIComponent(targetUrl)}`;
    }
  }

  // Ensure relative path starting with '/' is prepended with window.location.origin
  // for html-to-image SVG foreignObject compatibility
  if (targetUrl.startsWith('/') && typeof window !== 'undefined') {
    return `${window.location.origin}${targetUrl}`;
  }

  return targetUrl;
}
