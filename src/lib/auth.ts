import { db } from "@/db";
import { teacherSettings } from "@/db/schema";

export async function verifyTeacherAuth(
  request: Request,
  explicitPasscode?: string | null
): Promise<boolean> {
  try {
    const settings = await db.select().from(teacherSettings).limit(1);
    const validPasscode = (settings.length > 0 ? settings[0].passcode : "teacher123").trim();

    // 1. Explicit passcode (passed directly from body or caller)
    if (explicitPasscode && typeof explicitPasscode === "string" && explicitPasscode.trim()) {
      if (explicitPasscode.trim() === validPasscode) {
        return true;
      }
    }

    // 2. Custom header: x-teacher-passcode
    const rawHeader = request.headers.get("x-teacher-passcode");
    if (
      rawHeader &&
      rawHeader.trim() &&
      rawHeader !== "null" &&
      rawHeader !== "undefined"
    ) {
      if (rawHeader.trim() === validPasscode) {
        return true;
      }
    }

    // 3. Authorization header: Bearer <passcode>
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (token && token !== "null" && token !== "undefined") {
        if (token === validPasscode) {
          return true;
        }
      }
    }

    // 4. URL Search Params: ?passcode=<passcode> or ?teacher_passcode=<passcode>
    try {
      const url = new URL(request.url);
      const queryPasscode =
        url.searchParams.get("passcode") ||
        url.searchParams.get("teacher_passcode");
      if (queryPasscode && queryPasscode.trim()) {
        if (queryPasscode.trim() === validPasscode) {
          return true;
        }
      }
    } catch {}

    // 5. Cookie: teacher_passcode
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/teacher_passcode=([^;]+)/);
      if (match) {
        const cookiePasscode = decodeURIComponent(match[1]).trim();
        if (cookiePasscode && cookiePasscode === validPasscode) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Auth verification error:", error);
    return false;
  }
}
