import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) throw new Error("User not found");
  return user;
}

export const list = query({
  args: { type: v.optional(v.string()) },
  handler: async (ctx, { type }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];
    const q = type
      ? ctx.db.query("templates").withIndex("by_user_type", (q) => q.eq("userId", user._id).eq("type", type))
      : ctx.db.query("templates").withIndex("by_user", (q) => q.eq("userId", user._id));
    return q.order("desc").collect();
  },
});

export const save = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    content: v.string(),
    domain: v.optional(v.string()),
    age: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("templates", {
      userId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...args,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, { id }) => {
    const user = await requireUser(ctx);
    const t = await ctx.db.get(id);
    if (!t || t.userId !== user._id) throw new Error("Not found");
    await ctx.db.delete(id);
  },
});
