import { NextResponse } from "next/server";
import { db, isDatabaseConfigured, MISSING_DB_MESSAGE } from "@/db";
import { items } from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { verifyTeacherAuth } from "@/lib/auth";
import { sanitizeGameHtml } from "@/lib/gameSanitize";
import { desc, asc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { items: [], needsSetup: true, error: MISSING_DB_MESSAGE },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade");
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    let allItems = await db
      .select()
      .from(items)
      .orderBy(desc(items.isPinned), asc(items.sortOrder), desc(items.createdAt));

    if (allItems.length === 0) {
      await seedDatabase();
      allItems = await db
        .select()
        .from(items)
        .orderBy(desc(items.isPinned), asc(items.sortOrder), desc(items.createdAt));
    }

    let filtered = allItems;

    if (grade && grade !== "all") {
      filtered = filtered.filter(
        (item) =>
          item.grade === grade ||
          item.grade === "all" ||
          (grade === "grade1" && item.grade === "primary") ||
          (grade === "grade3" && item.grade === "primary")
      );
    }

    if (category && category !== "all") {
      filtered = filtered.filter((item) => item.category === category);
    }

    if (type && type !== "all") {
      filtered = filtered.filter((item) => item.itemType === type);
    }

    if (search && search.trim().length > 0) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.badge && item.badge.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ items: filtered, total: filtered.length });
  } catch (error: any) {
    console.error("Get items error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      itemType,
      category,
      grade,
      content,
      fileType,
      fileName,
      fileSize,
      fileData,
      icon,
      badge,
      isPinned,
      passcode,
      teacherPasscode,
    } = body;

    const isTeacher = await verifyTeacherAuth(request, passcode || teacherPasscode);
    if (!isTeacher) {
      return NextResponse.json(
        { error: "Unauthorized. Only teacher can add activities." },
        { status: 403 }
      );
    }

    if (!title || !itemType) {
      return NextResponse.json({ error: "Title and item type are required" }, { status: 400 });
    }

    const inserted = await db
      .insert(items)
      .values({
        title: title.trim(),
        description: description?.trim() ?? "",
        itemType,
        category: category ?? "general",
        grade: grade ?? "all",
        content:
          itemType === "html_game" ? sanitizeGameHtml(content ?? "") : content ?? "",
        fileType: fileType ?? null,
        fileName: fileName ?? null,
        fileSize: fileSize ?? null,
        fileData: fileData ?? null,
        icon: icon ?? "🎮",
        badge: badge ?? null,
        isPinned: Boolean(isPinned),
        sortOrder: 0,
      })
      .returning();

    return NextResponse.json({ success: true, item: inserted[0] });
  } catch (error: any) {
    console.error("Create item error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
