/**
 * ADD THESE MODELS TO prisma/schema.prisma
 * 
 * These extend the existing schema to support comprehensive library management
 * for storing and organizing completed prompts, skills, and instructions.
 */

// ============================================================================
// LIBRARY ITEM MODEL
// ============================================================================
// Stores any type of reusable content: prompts, skills, instructions, templates

model LibraryItem {
  id              String   @id @default(cuid())
  workspace_id    String
  
  // Type: prompt, skill, instruction, template, snippet
  type            String   // "prompt" | "skill" | "instruction" | "template" | "snippet"
  
  // Core content
  name            String   // e.g., "E-commerce Product Description"
  description     String?  // Brief description of what this does
  category        String   // e.g., "marketing", "technical", "content", "code", "seo"
  subcategory     String?  // e.g., "product-descriptions", "email-templates"
  
  // Full content
  content         String   // The actual prompt/skill/instruction text
  instructions    String?  // How to use this item (Markdown)
  example_output  String?  // Example of what this produces
  
  // Organization
  tags            String[] // e.g., ["ecommerce", "seo", "marketing"]
  difficulty      String   // "beginner" | "intermediate" | "advanced"
  
  // Usage tracking
  use_count       Int      @default(0)
  last_used       DateTime?
  avg_latency     Float?   // Average execution time in ms
  avg_cost        Float?   // Average cost in USD
  success_rate    Float?   // Success rate 0-1
  
  // Quality
  rating          Float?   // 0-5 stars (calculated from comments)
  
  // Status & visibility
  is_public       Boolean  @default(false) // Share with team/workspace
  is_archived     Boolean  @default(false) // Soft delete
  is_template     Boolean  @default(false) // Can be forked
  
  // Versioning
  version_number  Int      @default(1)
  changelog       String?  // What changed in this version
  parent_id       String?  // If forked from another item
  related_ids     String[] // IDs of related items
  
  // Metadata
  created_by      String   // User who created this
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  // Relations
  workspace       Workspace @relation(fields: [workspace_id], references: [id], onDelete: Cascade)
  comments        LibraryComment[]
  
  @@index([workspace_id])
  @@index([type])
  @@index([category])
  @@index([is_archived])
  @@unique([workspace_id, name, is_archived])
}

// ============================================================================
// LIBRARY COMMENT MODEL
// ============================================================================
// Feedback, ratings, and discussions on library items

model LibraryComment {
  id              String   @id @default(cuid())
  library_item_id String
  
  author          String   // User who left comment
  comment         String   // Comment text (Markdown support)
  rating          Int?     // 1-5 star rating
  
  created_at      DateTime @default(now())
  
  // Relations
  library_item    LibraryItem @relation(fields: [library_item_id], references: [id], onDelete: Cascade)
  
  @@index([library_item_id])
}

// ============================================================================
// LIBRARY FORK MODEL
// ============================================================================
// Track when items are forked/duplicated

model LibraryFork {
  id              String   @id @default(cuid())
  
  source_id       String   // Original item ID
  fork_id         String   // New item ID (the fork)
  forked_by       String   // User who created the fork
  
  created_at      DateTime @default(now())
  
  @@index([source_id])
  @@index([fork_id])
}

// ============================================================================
// LIBRARY COLLECTION MODEL (Optional)
// ============================================================================
// Group related items (e.g., "Email Marketing Suite", "Product Copy Library")

model LibraryCollection {
  id              String   @id @default(cuid())
  workspace_id    String
  
  name            String
  description     String?
  item_ids        String[] // IDs of items in this collection
  
  created_by      String
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  // Relations
  workspace       Workspace @relation(fields: [workspace_id], references: [id], onDelete: Cascade)
  
  @@index([workspace_id])
}

// ============================================================================
// UPDATE EXISTING WORKSPACE MODEL
// ============================================================================
// Add relation to Workspace model:
// 
// model Workspace {
//   ...existing fields...
//   
//   library_items    LibraryItem[]
//   library_collections LibraryCollection[]
// }
