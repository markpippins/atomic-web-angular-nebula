
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Normalized Schema Suggestion
// Flatten the nested array structure to make updates atomic and efficient.
export default defineSchema({
  // Systems (Top Level)
  systems: defineTable({
    name: v.string(),
    description: v.string(),
    readme: v.optional(v.string()),
    createdAt: v.number(),
  }),

  // Subsystems (Child of System)
  subsystems: defineTable({
    systemId: v.id("systems"),
    name: v.string(),
    description: v.string(),
    readme: v.optional(v.string()),
    color: v.string(), // Hex code
    createdAt: v.number(),
  }).index("by_system", ["systemId"]),

  // Features (Child of Subsystem)
  features: defineTable({
    subsystemId: v.id("subsystems"),
    name: v.string(),
    description: v.string(),
    readme: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_subsystem", ["subsystemId"]),

  // Requirements (Child of Feature OR System/Subsystem if flexible)
  requirements: defineTable({
    systemId: v.id("systems"),       // Denormalized for easy filtering
    subsystemId: v.id("subsystems"), // Denormalized
    featureId: v.optional(v.id("features")), 
    
    title: v.string(),
    description: v.string(),
    status: v.string(), // 'Backlog' | 'ToDo' | 'InProgress' | 'Done'
    priority: v.string(), // 'Low' | 'Medium' | 'High'
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_system", ["systemId"])
  .index("by_subsystem", ["subsystemId"])
  .index("by_feature", ["featureId"]),

  // Work Sessions (AI History)
  workSessions: defineTable({
    parentId: v.string(), // Can be ID of system/subsystem/feature
    parentType: v.string(),
    parentName: v.string(),
    context: v.string(),
    platform: v.string(),
    model: v.string(),
    outcome: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
});
