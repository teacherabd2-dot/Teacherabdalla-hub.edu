import { NextResponse } from "next/server";
import { verifyTeacherAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const passcode = (formData.get("passcode") || formData.get("teacherPasscode")) as string | null;

    const isTeacher = await verifyTeacherAuth(request, passcode);
    if (!isTeacher) {
      return NextResponse.json({ error: "Unauthorized. Teacher passcode required." }, { status: 403 });
    }

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name;
    const fileBytes = await file.arrayBuffer();
    const buffer = Buffer.from(fileBytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "application/octet-stream";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Determine clean file type
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    let fileType = "other";
    if (ext === "pdf") fileType = "pdf";
    else if (["doc", "docx"].includes(ext)) fileType = "docx";
    else if (["ppt", "pptx"].includes(ext)) fileType = "pptx";

    // Format human readable size
    const sizeInKb = Math.round(file.size / 1024);
    const formattedSize = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

    return NextResponse.json({
      success: true,
      fileName,
      fileType,
      fileSize: formattedSize,
      fileData: dataUrl,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
