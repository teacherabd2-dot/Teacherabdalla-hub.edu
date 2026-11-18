import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default(""),
  itemType: text("item_type").notNull(), // 'html_game' | 'canva_embed' | 'link' | 'file' | 'video'
  category: text("category").notNull().default("general"), // 'phonics' | 'reading' | 'spelling' | 'grammar' | 'general'
  grade: text("grade").notNull().default("all"), // 'grade1' | 'grade3' | 'primary' | 'all'
  content: text("content").notNull().default(""), // HTML code, embed URL, web link, or video URL
  fileType: text("file_type"), // 'pdf' | 'docx' | 'pptx' | 'other'
  fileName: text("file_name"),
  fileSize: text("file_size"),
  fileData: text("file_data"), // base64 data URL or text content for preview/download
  thumbnailUrl: text("thumbnail_url"),
  icon: text("icon").default("🎮"),
  badge: text("badge"), // 'Teacher Pick', 'Canva Story', 'Gemini Game', 'PDF Worksheet', etc.
  isPinned: boolean("is_pinned").default(false),
  playCount: integer("play_count").default(0),
  likesCount: integer("likes_count").default(0),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teacherSettings = pgTable("teacher_settings", {
  id: serial("id").primaryKey(),
  teacherName: text("teacher_name").notNull().default("Teacher's Classroom"),
  classTitle: text("class_title").notNull().default("Grade 1 & Grade 3 English Wonderland"),
  welcomeMessage: text("welcome_message").notNull().default("Welcome English super learners! Pick your grade, play phonics & reading games, explore stories, and collect stars! 🌟"),
  passcode: text("passcode").notNull().default("teacher123"),
  avatarEmoji: text("avatar_emoji").notNull().default("👩‍🏫"),
  theme: text("theme").notNull().default("playful"), // 'playful' | 'space' | 'safari' | 'ocean'
  announcement: text("announcement").default("✨ Welcome to our English Hub! Try the Phonics Pop games, Canva stories, and reading quests!"),
  publicUrl: text("public_url").default(""), // Custom public shareable URL (e.g. Vercel / Netlify / custom domain)
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type TeacherSettings = typeof teacherSettings.$inferSelect;
