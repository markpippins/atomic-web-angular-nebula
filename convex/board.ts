
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// --- Queries (Get Data) ---

export const getFullBoard = query({
  args: {},
  handler: async (ctx) => {
    // In a real app, you might query these individually per component
    // But for a full sync, fetching all is okay for small-medium projects.
    const systems = await ctx.db.query("systems").collect();
    const subsystems = await ctx.db.query("subsystems").collect();
    const features = await ctx.db.query("features").collect();
    const requirements = await ctx.db.query("requirements").collect();

    return { systems, subsystems, features, requirements };
  },
});

// --- Mutations (Modify Data) ---

export const createSystem = mutation({
  args: { name: v.string(), description: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("systems", {
      name: args.name,
      description: args.description,
      createdAt: Date.now(),
    });
  },
});

export const createSubsystem = mutation({
  args: { systemId: v.id("systems"), name: v.string(), description: v.string(), color: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subsystems", {
      systemId: args.systemId,
      name: args.name,
      description: args.description,
      color: args.color,
      createdAt: Date.now(),
    });
  },
});

export const moveSubsystem = mutation({
  args: { subsystemId: v.id("subsystems"), targetSystemId: v.id("systems") },
  handler: async (ctx, args) => {
    // Atomic update of parent reference
    await ctx.db.patch(args.subsystemId, { systemId: args.targetSystemId });
    
    // Also update requirements associated with this subsystem
    const reqs = await ctx.db
      .query("requirements")
      .withIndex("by_subsystem", (q) => q.eq("subsystemId", args.subsystemId))
      .collect();
      
    for (const req of reqs) {
        await ctx.db.patch(req._id, { systemId: args.targetSystemId });
    }
  },
});

export const updateRequirementStatus = mutation({
  args: { requirementId: v.id("requirements"), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requirementId, { 
        status: args.status, 
        updatedAt: Date.now() 
    });
  },
});
