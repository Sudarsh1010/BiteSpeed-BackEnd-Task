import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const contactTable = sqliteTable("contact", {
  id: integer("id", { mode: "number" }).primaryKey(),
  created_at: integer("created_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  deleted_at: integer("updated_at", { mode: "timestamp" }),
  phone_number: text("phone_number"),
  email: text("email"),
  linked_id: integer("linked_id"),
  link_precedence: text("link_precedence", { enum: ["primary", "secondary"] })
    .default("primary")
    .notNull(),
});
