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
      .query("cases")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    dob: v.optional(v.string()),
    primaryDomain: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("cases", {
      userId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...args,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("cases"),
    name: v.optional(v.string()),
    dob: v.optional(v.string()),
    primaryDomain: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const user = await requireUser(ctx);
    const c = await ctx.db.get(id);
    if (!c || c.userId !== user._id) throw new Error("Not found");
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("cases") },
  handler: async (ctx, { id }) => {
    const user = await requireUser(ctx);
    const c = await ctx.db.get(id);
    if (!c || c.userId !== user._id) throw new Error("Not found");
    await ctx.db.delete(id);
  },
});
