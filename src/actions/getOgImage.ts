"use server";

async function extractOgImage(url: string): Promise<string | null> {
  const response = await fetch(url, {
    next: { revalidate: 86400 },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
  });

  if (!response.ok) return null;

  const html = await response.text();

  const getAbsoluteUrl = (imgUrl: string) => {
    try {
      return new URL(imgUrl, url).toString();
    } catch {
      return imgUrl;
    }
  };

  const patterns = [
    /<meta[^>]*property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image(?::secure_url)?["'][^>]*>/i,
    /<meta[^>]*name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return getAbsoluteUrl(match[1]);
  }

  return null;
}

async function fetchSiteScreenshot(url: string): Promise<string | null> {
  try {
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false`;
    const response = await fetch(apiUrl, { next: { revalidate: 86400 } });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      data?: { screenshot?: { url?: string } };
    };
    return data.data?.screenshot?.url ?? null;
  } catch (error) {
    console.error("Failed to fetch site screenshot for:", url, error);
    return null;
  }
}

export type PreviewType = "site" | "github";

export async function getOgImage(
  url: string,
  fallbackUrl?: string
): Promise<string | null> {
  if (!url) return null;

  try {
    const result = await extractOgImage(url);
    if (result) return result;
  } catch (error) {
    console.error("Failed to fetch OG image for:", url, error);
  }

  if (fallbackUrl && fallbackUrl !== url) {
    try {
      const result = await extractOgImage(fallbackUrl);
      if (result) return result;
    } catch (err) {
      console.error("Failed to fetch OG image from fallback:", fallbackUrl, err);
    }
  }

  return null;
}

export async function getProjectPreview(options: {
  previewType: PreviewType;
  siteUrl?: string;
  githubUrl?: string;
  staticImage?: string;
}): Promise<string | null> {
  const { previewType, siteUrl, githubUrl, staticImage } = options;

  if (staticImage) return staticImage;

  if (previewType === "github") {
    if (!githubUrl) return null;
    return getOgImage(githubUrl);
  }

  if (!siteUrl) return null;

  try {
    const ogImage = await extractOgImage(siteUrl);
    if (ogImage) return ogImage;
  } catch (error) {
    console.error("Failed to fetch site OG image for:", siteUrl, error);
  }

  return fetchSiteScreenshot(siteUrl);
}
