import { NextRequest, NextResponse } from "next/server";

const isPrivateIP = (ip: string) => {
  // Simple check for localhost and common private networks
  if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1') return true;
  // 10.x.x.x
  if (ip.startsWith('10.')) return true;
  // 172.16.x.x - 172.31.x.x
  if (ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) return true;
  // 192.168.x.x
  if (ip.startsWith('192.168.')) return true;
  return false;
};

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const urlStr = searchParams.get('url');

    if (!urlStr) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlStr);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // SSRF Protection: Only allow HTTP/HTTPS
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: "Protocol not allowed" }, { status: 400 });
    }

    // SSRF Protection: Prevent querying private IPs / localhost
    if (isPrivateIP(parsedUrl.hostname)) {
      return NextResponse.json({ error: "Host not allowed" }, { status: 400 });
    }

    // Fetch HTML
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 SkillBuddyPreviewBot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      // Timeout via AbortSignal to prevent hanging requests
      signal: AbortSignal.timeout(5000), 
      // Do not follow more than a few redirects (handled automatically by node fetch up to 20, but we just need basic)
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch URL" }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ error: "Not an HTML page" }, { status: 400 });
    }

    // Stream text in case of huge files (limit to first 50KB to prevent memory exhaustion)
    const text = await response.text();
    const html = text.substring(0, 50000); // 50KB is more than enough for <head>

    // Regex extraction
    const extractContent = (pattern: RegExp) => {
      const match = html.match(pattern);
      return match && match[1] ? match[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim() : null;
    };

    // OpenGraph
    const ogTitle = extractContent(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) 
                 || extractContent(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["'][^>]*>/i);
    const ogImage = extractContent(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i)
                 || extractContent(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i);
    const ogDesc = extractContent(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
                || extractContent(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["'][^>]*>/i);
    const ogSiteName = extractContent(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["'][^>]*>/i)
                    || extractContent(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["'][^>]*>/i);

    // Standard Fallbacks
    const title = extractContent(/<title[^>]*>([^<]+)<\/title>/i);
    const desc = extractContent(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
              || extractContent(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
    
    // Favicon
    let favicon = extractContent(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*>/i)
               || extractContent(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i);
    
    // Resolve relative URLs for images/favicons
    const resolveUrl = (targetUrl: string | null) => {
      if (!targetUrl) return null;
      if (targetUrl.startsWith('http')) return targetUrl;
      try {
        return new URL(targetUrl, parsedUrl.origin).toString();
      } catch {
        return null;
      }
    };

    if (!favicon) {
      favicon = `${parsedUrl.origin}/favicon.ico`;
    } else {
      favicon = resolveUrl(favicon);
    }

    const finalImage = resolveUrl(ogImage);

    return NextResponse.json({
      title: ogTitle || title,
      description: ogDesc || desc,
      image: finalImage,
      siteName: ogSiteName,
      favicon: favicon,
      url: urlStr
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
      }
    });

  } catch (error) {
    console.error('Link preview error:', error);
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}
