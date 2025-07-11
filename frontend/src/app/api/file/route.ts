import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get("filename");
  
  // Validate filename
  if (!filename) {
    return NextResponse.json(
      { error: "Filename is required" }, 
      { status: 400 }
    );
  }

  // Additional filename validation if needed
  if (!/^[\w\-\.]+$/.test(filename)) {
    return NextResponse.json(
      { error: "Invalid filename format" },
      { status: 400 }
    );
  }

  try {
    const backendUrl = `https://backend-4-x6ud.onrender.com/api/get-signed-url/${encodeURIComponent(filename)}`;
    const res = await fetch(backendUrl, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await res.json();

    if (!res.ok || !data.url) {
      return NextResponse.json(
        { 
          error: data.error || data.message || "Failed to get signed URL" 
        },
        { status: res.status || 500 }
      );
    }

    // Validate the returned URL
    try {
      new URL(data.url);
      return NextResponse.redirect(data.url);
    } catch {
      return NextResponse.json(
        { error: "Invalid redirect URL received" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching signed URL:", error);
    return NextResponse.json(
      { error: "Server error while processing request" },
      { status: 500 }
    );
  }
}