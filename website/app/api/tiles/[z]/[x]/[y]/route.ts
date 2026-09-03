import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params;
  
  // We use the server-side environment variable to keep it secure
  const apiKey = process.env.CARTO_API_KEY;

  if (!apiKey) {
    return new NextResponse("CARTO API key not configured on server", { status: 500 });
  }

  // Construct the CARTO Voyager URL
  // Leaflet requests `{z}/{x}/{y}.png`, but y might not have `.png` in the params depending on routing.
  // Next.js params stringify the exact path segment. Leaflet will request `/api/tiles/12/1000/2000.png`.
  // Wait, if the file is named `[y]/route.ts`, the `y` param will be `2000.png`. 
  
  const targetUrl = `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}?key=${apiKey}`;

  try {
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return new NextResponse(`Failed to fetch tile: ${response.statusText}`, { status: response.status });
    }

    // Stream the image back to the client
    const arrayBuffer = await response.arrayBuffer();
    
    // Pass along caching headers
    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("Content-Type") || "image/png");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(arrayBuffer, { headers });
  } catch (error) {
    console.error("Tile proxy error:", error);
    return new NextResponse("Failed to proxy tile request", { status: 500 });
  }
}
