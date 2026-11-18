import { NextResponse } from "next/server";
import { pool, isDatabaseConfigured, MISSING_DB_MESSAGE } from "@/db";
import { seedDatabase } from "@/db/seed";

/**
 * One-click database bootstrap for a fresh deployment (Vercel Drop / Vercel CLI / Render).
 * Visit /api/setup in a browser after setting DATABASE_URL: it creates the tables and
 * loads the starter English activities (only into empty tables, never overwriting your work).
 */
async function runSetup() {
  if (!isDatabaseConfigured()) {
    return {
      ok: false as const,
      title: "Database key missing",
      message: MISSING_DB_MESSAGE,
    };
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id serial PRIMARY KEY,
      title text NOT NULL,
      description text DEFAULT '',
      item_type text NOT NULL,
      category text NOT NULL DEFAULT 'general',
      grade text NOT NULL DEFAULT 'all',
      content text NOT NULL DEFAULT '',
      file_type text,
      file_name text,
      file_size text,
      file_data text,
      thumbnail_url text,
      icon text DEFAULT '🎮',
      badge text,
      is_pinned boolean DEFAULT false,
      play_count integer DEFAULT 0,
      likes_count integer DEFAULT 0,
      sort_order integer DEFAULT 0,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS teacher_settings (
      id serial PRIMARY KEY,
      teacher_name text NOT NULL DEFAULT 'Teacher''s Classroom',
      class_title text NOT NULL DEFAULT 'Grade 1 & Grade 3 English Wonderland',
      welcome_message text NOT NULL DEFAULT 'Welcome English super learners! 🌟',
      passcode text NOT NULL DEFAULT 'teacher123',
      avatar_emoji text NOT NULL DEFAULT '👩‍🏫',
      theme text NOT NULL DEFAULT 'playful',
      announcement text DEFAULT '',
      public_url text DEFAULT '',
      updated_at timestamp DEFAULT now()
    );

    ALTER TABLE teacher_settings ADD COLUMN IF NOT EXISTS public_url text DEFAULT '';
  `);

  await seedDatabase();

  return {
    ok: true as const,
    title: "Your classroom database is ready",
    message:
      "Tables were created and the starter English activities were loaded (your existing work is never overwritten).",
  };
}

function htmlPage(opts: {
  ok: boolean;
  title: string;
  message: string;
}): Response {
  const accent = opts.ok ? "#059669" : "#d97706";
  const icon = opts.ok ? "✅" : "⚠️";
  const nextSteps = opts.ok
    ? `<ol style="text-align:left;line-height:1.9;margin:0;padding-left:22px">
         <li>Open the <a href="/" style="color:#4f46e5;font-weight:700">classroom home page</a>.</li>
         <li>Click <strong>Teacher Sign In</strong> (top-right).</li>
         <li>Enter the default passcode <code style="background:#eef2ff;padding:2px 6px;border-radius:6px;font-weight:700">teacher123</code>.</li>
         <li>Open <strong>Settings</strong> and change it to your own secret passcode.</li>
         <li>You can now add, edit, publish and delete activities from any device.</li>
       </ol>`
    : `<ol style="text-align:left;line-height:1.9;margin:0;padding-left:22px">
         <li>Go to your hosting dashboard → your project → <strong>Settings</strong> → <strong>Environment Variables</strong>.</li>
         <li>Add <code style="background:#eef2ff;padding:2px 6px;border-radius:6px;font-weight:700">DATABASE_URL</code> with your PostgreSQL connection string.</li>
         <li>Redeploy (Deployments → ⋯ → <strong>Redeploy</strong>).</li>
         <li>Come back to this address and reload it.</li>
       </ol>`;

  return new Response(
    `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Classroom setup</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;padding:20px">
  <div style="max-width:560px;width:100%;background:#fff;border-radius:24px;padding:32px;box-shadow:0 18px 40px rgba(15,23,42,.12);border-top:8px solid ${accent}">
    <div style="font-size:44px;line-height:1">${icon}</div>
    <h1 style="font-size:22px;margin:12px 0 8px;color:#0f172a">${opts.title}</h1>
    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 20px">${opts.message}</p>
    ${nextSteps}
    <div style="margin-top:24px">
      <a href="/" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;font-weight:800;padding:12px 22px;border-radius:14px">Go to my classroom →</a>
    </div>
    <p style="font-size:11px;color:#94a3b8;margin-top:22px">Safe to open this address again at any time — it never deletes your activities.</p>
  </div>
</body></html>`,
    {
      status: opts.ok ? 200 : 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

export async function GET() {
  try {
    const result = await runSetup();
    return htmlPage(result);
  } catch (error: any) {
    console.error("Setup error:", error);
    return htmlPage({
      ok: false,
      title: "Setup could not finish",
      message: `The app reached your database but something failed: ${error.message}. Check that the DATABASE_URL string is complete (it should end with ?sslmode=require) and that the database is accepting connections.`,
    });
  }
}

export async function POST() {
  try {
    const result = await runSetup();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
