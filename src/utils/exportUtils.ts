import { toPng } from 'html-to-image';

let cachedFontCSS: string | null = null;

export async function getEmbeddedFontCSS(): Promise<string> {
  if (cachedFontCSS) return cachedFontCSS;

  try {
    const fontCssUrl =
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap';

    const response = await fetch(fontCssUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) throw new Error(`Font fetch status ${response.status}`);
    let cssText = await response.text();

    // Extract all gstatic font URLs and fetch/convert them to base64 data URLs
    const fontUrls = Array.from(
      cssText.matchAll(/url\((['"]?)(https:\/\/fonts\.gstatic\.com\/[^'"]+)\1\)/g)
    );

    for (const match of fontUrls) {
      const fullUrl = match[2];
      try {
        const fontRes = await fetch(fullUrl);
        if (fontRes.ok) {
          const blob = await fontRes.blob();
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          cssText = cssText.split(fullUrl).join(base64Data);
        }
      } catch (e) {
        console.warn('Could not base64 encode font file:', fullUrl, e);
      }
    }

    cachedFontCSS =
      cssText +
      `
      body, div, span, p, h1, h2, h3, h4, button {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
      }
      .font-oswald, h1, h2, h3, h4 {
        font-family: 'Oswald', 'Trebuchet MS', sans-serif !important;
        text-transform: uppercase;
      }
      .font-mono, .label, .badge {
        font-family: 'JetBrains Mono', monospace !important;
      }
      .font-sans {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
      }
    `;
    return cachedFontCSS;
  } catch (err) {
    console.warn('Dynamic font embed failed, falling back to basic CSS:', err);
    return `
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
      .font-oswald { font-family: 'Oswald', sans-serif !important; }
      .font-mono { font-family: 'JetBrains Mono', monospace !important; }
      .font-sans { font-family: 'Plus Jakarta Sans', sans-serif !important; }
    `;
  }
}

export async function waitForContainerImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  const promises = images.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };
      img.onload = done;
      img.onerror = done;
      setTimeout(done, 2000);
    });
  });
  await Promise.all(promises);
}

export async function exportElementToPng(
  element: HTMLElement,
  filename: string,
  backgroundColor = '#F8F7F4'
): Promise<void> {
  // Wait for document fonts and container images
  if (document.fonts) {
    await document.fonts.ready.catch(() => {});
  }
  await waitForContainerImages(element);

  const fontEmbedCSS = await getEmbeddedFontCSS();

  // Compute exact element dimensions without clipping
  const rect = element.getBoundingClientRect();
  const width = Math.max(Math.ceil(rect.width), element.scrollWidth, element.offsetWidth, 1200);
  const height = Math.max(Math.ceil(rect.height), element.scrollHeight, element.offsetHeight, 800);

  const dataUrl = await toPng(element, {
    cacheBust: true,
    quality: 0.98,
    backgroundColor,
    width,
    height,
    canvasWidth: width * 2,
    canvasHeight: height * 2,
    fontEmbedCSS,
    style: {
      transform: 'none',
      left: '0',
      top: '0',
    },
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
