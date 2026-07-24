-- DropTable
-- The AI Knowledge / Assistant feature (Gemini-powered chat widget + its
-- admin content CRUD) has been removed from the product entirely. Nothing
-- else in the schema references this table (Tenant.aiKnowledge relation
-- removed in the same change), so it's safe to drop outright rather than
-- soft-deprecate.
DROP TABLE "ai_knowledge";
