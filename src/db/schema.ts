import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Profiles - extends Supabase auth.users
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // matches auth.users.id
  name: text("name").notNull(),
  phone: text("phone").unique().notNull(),
  avatarUrl: text("avatar_url"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Votes
export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  voterId: uuid("voter_id")
    .references(() => profiles.id)
    .notNull(),
  candidateId: uuid("candidate_id")
    .references(() => profiles.id)
    .notNull(),
  comment: text("comment"), // Optional comment explaining the vote
  year: integer("year")
    .default(sql`EXTRACT(YEAR FROM now())::integer`)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Past winners archive
export const winners = pgTable("winners", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => profiles.id)
    .notNull(),
  year: integer("year").notNull(),
  totalVotes: integer("total_votes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invite codes
export const inviteCodes = pgTable("invite_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique().notNull(),
  usedBy: uuid("used_by").references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  votesGiven: many(votes, { relationName: "voter" }),
  votesReceived: many(votes, { relationName: "candidate" }),
  inviteCodeUsed: many(inviteCodes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  voter: one(profiles, {
    fields: [votes.voterId],
    references: [profiles.id],
    relationName: "voter",
  }),
  candidate: one(profiles, {
    fields: [votes.candidateId],
    references: [profiles.id],
    relationName: "candidate",
  }),
}));

export const winnersRelations = relations(winners, ({ one }) => ({
  user: one(profiles, {
    fields: [winners.userId],
    references: [profiles.id],
  }),
}));

// Types
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type Winner = typeof winners.$inferSelect;
export type InviteCode = typeof inviteCodes.$inferSelect;
