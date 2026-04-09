import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  bookmarks: defineTable({
    userId: v.id("users"),
    articleId: v.string(),
    title: v.string(),
    authors: v.string(),
    year: v.optional(v.string()),
    journal: v.optional(v.string()),
    url: v.optional(v.string()),
    source: v.string(),
    abstract: v.optional(v.string()),
    citations: v.optional(v.number()),
    isTrial: v.optional(v.boolean()),
    bookmarkedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_article", ["userId", "articleId"]),

  searches: defineTable({
    userId: v.id("users"),
    domain: v.optional(v.string()),
    domainLabel: v.string(),
    age: v.string(),
    evLevel: v.string(),
    query: v.string(),
    articleCount: v.number(),
    synthesis: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  cases: defineTable({
    userId: v.id("users"),
    name: v.string(),
    dob: v.optional(v.string()),
    primaryDomain: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  templates: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    content: v.string(),
    domain: v.optional(v.string()),
    age: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"]),
});
