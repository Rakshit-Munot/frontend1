import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Extract filename from query string like ?filename=abc.pdf
  const filename = req.nextUrl.searchParams.get("filename");

  console.log("DEBUG — Incoming URL:", req.nextUrl.toString());
  console.log("DEBUG — Extracted filename:", filename);

  if (!filename) {
    return NextResponse.json(
      { error: "Filename is required in query string (?filename=...)" },
      { status: 400 }
    );
  }

  if (!/^[\w\-\.]+$/.test(filename)) {
    return NextResponse.json(
      { error: "Invalid filename format" },
      { status: 400 }
    );
  }

  try {
    const backendUrl = `https://backend-4-x6ud.onrender.com/api/get-signed-url/${encodeURIComponent(
      filename
    )}`;
    console.log("DEBUG — Fetching from backend:", backendUrl);

    const res = await fetch(backendUrl, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    console.log("DEBUG — Backend response:", data);

    if (!res.ok || !data.url) {
      return NextResponse.json(
        {
          error:
            data.error ||
            data.detail ||
            "Failed to get signed URL from backend",
        },
        { status: res.status || 500 }
      );
    }

    try {
      const urlObj = new URL(data.url);
      console.log("DEBUG — Redirecting to:", urlObj.toString());
      return NextResponse.redirect(urlObj.toString());
    } catch {
      return NextResponse.json(
        { error: "Invalid redirect URL received" },
        { status: 500 }
      );
    }
  } catch (error) {
    const err = error as Error;
    console.error("DEBUG — Error fetching signed URL:", err.message);
    return NextResponse.json(
      { error: "Server error while processing request" },
      { status: 500 }
    );
  }
}
