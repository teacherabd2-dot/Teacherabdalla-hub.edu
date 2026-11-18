import { NextResponse } from "next/server";
import { db } from "@/db";
import { items } from "@/db/schema";
import { verifyTeacherAuth } from "@/lib/auth";
import { sanitizeGameHtml } from "@/lib/gameSanitize";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const found = await db.select().from(items).where(eq(items.id, itemId)).limit(1);
    if (found.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item: found[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Unauthorized. Only teacher can edit activities." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const updateFields: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateFields.title = title.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (itemType !== undefined) updateFields.itemType = itemType;
    if (category !== undefined) updateFields.category = category;
    if (grade !== undefined) updateFields.grade = grade;
    if (content !== undefined) {
      updateFields.content =
        (itemType ?? undefined) === "html_game" || /<html|<body|<script|<div/i.test(content ?? "")
          ? sanitizeGameHtml(content)
          : content;
    }
    if (fileType !== undefined) updateFields.fileType = fileType;
    if (fileName !== undefined) updateFields.fileName = fileName;
    if (fileSize !== undefined) updateFields.fileSize = fileSize;
    if (fileData !== undefined) updateFields.fileData = fileData;
    if (icon !== undefined) updateFields.icon = icon;
    if (badge !== undefined) updateFields.badge = badge;
    if (isPinned !== undefined) updateFields.isPinned = Boolean(isPinned);

    const updated = await db
      .update(items)
      .set(updateFields)
      .where(eq(items.id, itemId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated[0] });
  } catch (error: any) {
    console.error("Update item error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isTeacher = await verifyTeacherAuth(request);
    if (!isTeacher) {
      return NextResponse.json(
        { error: "Unauthorized. Only teacher can delete activities." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const deleted = await db.delete(items).where(eq(items.id, itemId)).returning();
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Item deleted successfully" });
  } catch (error: any) {
    console.error("Delete item error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
