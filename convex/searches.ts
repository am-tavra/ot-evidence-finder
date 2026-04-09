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
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];
    return ctx.db
      .query("searches")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

export const save = mutation({
  args: {
    domain: v.optional(v.string()),
    domainLabel: v.string(),
    age: v.string(),
    evLevel: v.string(),
    query: v.string(),
    articleCount: v.number(),
    synthesis: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("searches", {
      userId: user._id,
      createdAt: Date.now(),
      ...args,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("searches") },
  handler: async (ctx, { id }) => {
    const user = await requireUser(ctx);
    const search = await ctx.db.get(id);
    if (!search || search.userId !== user._id) throw new Error("Not found");
    await ctx.db.delete(id);
  },
});
