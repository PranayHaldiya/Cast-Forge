import { pgTable, serial, text, integer, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const episodesTable = pgTable("episodes", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  format: text("format").notNull(),
  hosts: jsonb("hosts").notNull().$type<Array<{ name: string; description: string; voiceId: string | null }>>(),
  audioUrl: text("audio_url"),
  scriptText: text("script_text"),
  duration: integer("duration"),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  userId: varchar("user_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEpisodeSchema = createInsertSchema(episodesTable).omit({ id: true, createdAt: true });
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Episode = typeof episodesTable.$inferSelect;
