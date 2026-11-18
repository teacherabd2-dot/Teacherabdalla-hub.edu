import { NextResponse } from "next/server";
import { db, isDatabaseConfigured, MISSING_DB_MESSAGE } from "@/db";
import { teacherSettings } from "@/db/schema";
import { verifyTeacherAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { seedDatabase } from "@/db/seed";

export async function GET(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { needsSetup: true, error: MISSING_DB_MESSAGE },
        { status: 503 }
      );
    }

    let settings = await db.select().from(teacherSettings).limit(1);
    if (settings.length === 0) {
      await seedDatabase();
      settings = await db.select().from(teacherSettings).limit(1);
    }

    const isTeacher = await verifyTeacherAuth(request);
    const s = settings[0];

    return NextResponse.json({
      settings: {
        id: s?.id ?? 1,
        teacherName: s?.teacherName ?? "Teacher's Class",
        classTitle: s?.classTitle ?? "Grade 1 & Grade 3 English Wonderland",
        welcomeMessage: s?.welcomeMessage ?? "Welcome English super learners! Pick your grade, play phonics & reading games, and earn stars! 🌟",
        avatarEmoji: s?.avatarEmoji ?? "👩‍🏫",
        theme: s?.theme ?? "playful",
        announcement: s?.announcement ?? "",
        publicUrl: s?.publicUrl ?? "",
        updatedAt: s?.updatedAt,
      },
      isTeacher,
    });
  } catch (error: any) {
    console.error("Get settings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      teacherName,
      classTitle,
      welcomeMessage,
      avatarEmoji,
      theme,
      announcement,
      publicUrl,
      newPasscode,
      passcode,
      teacherPasscode,
    } = body;

    const isTeacher = await verifyTeacherAuth(request, passcode || teacherPasscode);
    if (!isTeacher) {
      return NextResponse.json(
        { error: "Unauthorized. Teacher passcode required." },
        { status: 403 }
      );
    }

    let existing = await db.select().from(teacherSettings).limit(1);
    if (existing.length === 0) {
      await seedDatabase();
      existing = await db.select().from(teacherSettings).limit(1);
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (teacherName !== undefined) updateData.teacherName = teacherName.trim();
    if (classTitle !== undefined) updateData.classTitle = classTitle.trim();
    if (welcomeMessage !== undefined) updateData.welcomeMessage = welcomeMessage.trim();
    if (avatarEmoji !== undefined) updateData.avatarEmoji = avatarEmoji;
    if (theme !== undefined) updateData.theme = theme;
    if (announcement !== undefined) updateData.announcement = announcement.trim();
    if (publicUrl !== undefined) updateData.publicUrl = publicUrl.trim();
    if (newPasscode !== undefined && newPasscode.trim().length >= 4) {
      updateData.passcode = newPasscode.trim();
    }

    const updated = await db
      .update(teacherSettings)
      .set(updateData)
      .where(eq(teacherSettings.id, existing[0].id))
      .returning();

    const res = NextResponse.json({
      success: true,
      settings: {
        id: updated[0].id,
        teacherName: updated[0].teacherName,
        classTitle: updated[0].classTitle,
        welcomeMessage: updated[0].welcomeMessage,
        avatarEmoji: updated[0].avatarEmoji,
        theme: updated[0].theme,
        announcement: updated[0].announcement,
        publicUrl: updated[0].publicUrl ?? "",
      },
      activePasscode: updateData.passcode || existing[0].passcode,
    });

    if (updateData.passcode) {
      res.cookies.set("teacher_passcode", updateData.passcode, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return res;
  } catch (error: any) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
