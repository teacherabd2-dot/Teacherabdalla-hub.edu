import { NextResponse } from "next/server";
import { db } from "@/db";
import { teacherSettings } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { passcode } = body;

    if (!passcode || typeof passcode !== "string" || !passcode.trim()) {
      return NextResponse.json({ authenticated: false, error: "Passcode required" }, { status: 400 });
    }

    const settings = await db.select().from(teacherSettings).limit(1);
    const validPasscode = (settings.length > 0 ? settings[0].passcode : "teacher123").trim();

    if (passcode.trim() === validPasscode) {
      const response = NextResponse.json({
        authenticated: true,
        message: "Welcome Teacher!",
        passcode: validPasscode,
      });

      // Set cookie for browser sessions
      response.cookies.set("teacher_passcode", validPasscode, {
        httpOnly: false, // Allows client to read and sync if needed
        secure: false, // Allows working in preview proxies and iframes
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { authenticated: false, error: "Incorrect teacher passcode. Please try again!" },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("Auth error:", error);
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false, message: "Signed out from Teacher Mode" });
  response.cookies.delete("teacher_passcode");
  return response;
}
