/**
 * Library Management System
 * 
 * Extends PromptArchitect with a comprehensive library for storing:
 * - Completed, tested, production-ready prompts
 * - Skills (specialized techniques, patterns)
 * - Instructions (step-by-step guides)
 * - Reusable components (snippets, templates)
 * 
 * Features:
 * - Full CRUD operations
 * - Tagging and categorization
 * - Search and filtering
 * - Version history per item
 * - Usage stats (how many times used)
 * - Quality ratings
 * - Markdown support for documentation
 * - Export/import functionality
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// DATABASE SCHEMA ADDITIONS
// ============================================================================

/**
 * Add these models to prisma/schema.prisma
 * 
 * model LibraryItem {
 *   id              String   @id @default(cuid())
 *   workspace_id    String
 *   type            String   // "prompt" | "skill" | "instruction" | "template" | "snippet"
 *   name            String   // e.g., "Product Description - E-commerce"
 *   description     String?  // Brief description
 *   category        String   // e.g., "marketing", "technical", "content", "code"
 *   subcategory     String?  // e.g., "product-descriptions", "email-templates"
 *   
 *   // Content
 *   content         String   // Full prompt/skill/instruction text
 *   instructions    String?  // How to use this
 *   example_output  String?  // Example of what this produces
 *   
 *   // Metadata
 *   tags            String[] // ["ecommerce", "seo", "marketing"]
 *   difficulty      String   // "beginner" | "intermediate" | "advanced"
 *   use_count       Int      @default(0)
 *   rating          Float?   // 0-5 stars
 *   
 *   // Status
 *   is_public       Boolean  @default(false) // Share with team?
 *   is_archived     Boolean  @default(false)
 *   is_template     Boolean  @default(false) // Can be used as base for others
 *   
 *   // Versions
 *   version_number  Int      @default(1)
 *   changelog       String?
 *   
 *   // Linked items
 *   parent_id       String?  // If this is derived from another item
 *   related_ids     String[] // Other related library items
 *   
 *   // Performance
 *   avg_latency     Float?   // Average execution time
 *   avg_cost        Float?   // Average cost per execution
 *   success_rate    Float?   // % of successful executions
 *   
 *   // Metadata
 *   created_by      String
 *   created_at      DateTime @default(now())
 *   updated_at      DateTime @updatedAt
 *   last_used       DateTime?
 * }
 * 
 * model LibraryComment {
 *   id              String   @id @default(cuid())
 *   library_item_id String
 *   author          String
 *   comment         String
 *   rating          Int?     // 1-5
 *   created_at      DateTime @default(now())
 * }
 * 
 * model LibraryFork {
 *   id              String   @id @default(cuid())
 *   source_id       String   // Original item
 *   fork_id         String   // New item created from source
 *   forked_by       String
 *   created_at      DateTime @default(now())
 * }
 */

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Create a new library item
 */
export async function createLibraryItem(data: {
  workspace_id: string
  type: 'prompt' | 'skill' | 'instruction' | 'template' | 'snippet'
  name: string
  description?: string
  category: string
  subcategory?: string
  content: string
  instructions?: string
  example_output?: string
  tags?: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  is_template?: boolean
  created_by: string
}) {
  try {
    // Validate required fields
    if (!data.name || !data.content || !data.workspace_id) {
      throw new Error('Missing required fields: name, content, workspace_id')
    }

    // Check for duplicate names in workspace
    const existing = await prisma.libraryItem?.findFirst({
      where: {
        workspace_id: data.workspace_id,
        name: data.name,
        is_archived: false,
      },
    })

    if (existing) {
      throw new Error(`Library item "${data.name}" already exists`)
    }

    const item = await prisma.libraryItem?.create({
      data: {
        workspace_id: data.workspace_id,
        type: data.type,
        name: data.name,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        content: data.content,
        instructions: data.instructions,
        example_output: data.example_output,
        tags: data.tags || [],
        difficulty: data.difficulty || 'intermediate',
        is_template: data.is_template || false,
        created_by: data.created_by,
      },
    })

    return item
  } catch (error) {
    throw new Error(`Failed to create library item: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Get all library items with filters
 */
export async function getLibraryItems(filters: {
  workspace_id: string
  type?: string // "prompt" | "skill" | "instruction"
  category?: string
  tags?: string[]
  difficulty?: string
  is_template?: boolean
  search?: string // Search in name and description
  include_archived?: boolean
}) {
  try {
    const where: any = {
      workspace_id: filters.workspace_id,
    }

    if (filters.type) where.type = filters.type
    if (filters.category) where.category = filters.category
    if (filters.difficulty) where.difficulty = filters.difficulty
    if (filters.is_template !== undefined) where.is_template = filters.is_template
    if (!filters.include_archived) where.is_archived = false

    // Tag filtering
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags }
    }

    // Search
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const items = await prisma.libraryItem?.findMany({
      where,
      orderBy: { last_used: 'desc' },
    })

    return items || []
  } catch (error) {
    throw new Error(`Failed to fetch library items: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Get a specific library item with full details
 */
export async function getLibraryItem(itemId: string) {
  try {
    const item = await prisma.libraryItem?.findUnique({
      where: { id: itemId },
      include: {
        comments: {
          orderBy: { created_at: 'desc' },
        },
        related: {
          take: 5,
        },
      },
    })

    return item
  } catch (error) {
    throw new Error(`Failed to fetch library item: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Update a library item (creates new version)
 */
export async function updateLibraryItem(
  itemId: string,
  updates: {
    name?: string
    description?: string
    content?: string
    instructions?: string
    example_output?: string
    tags?: string[]
    difficulty?: string
    rating?: number
    changelog?: string
  }
) {
  try {
    // Fetch current item
    const current = await prisma.libraryItem?.findUnique({
      where: { id: itemId },
    })

    if (!current) {
      throw new Error('Library item not found')
    }

    // Update the item
    const updated = await prisma.libraryItem?.update({
      where: { id: itemId },
      data: {
        ...updates,
        version_number: current.version_number + 1,
        updated_at: new Date(),
      },
    })

    return updated
  } catch (error) {
    throw new Error(`Failed to update library item: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Archive a library item (soft delete)
 */
export async function archiveLibraryItem(itemId: string) {
  try {
    const archived = await prisma.libraryItem?.update({
      where: { id: itemId },
      data: { is_archived: true },
    })

    return archived
  } catch (error) {
    throw new Error(`Failed to archive item: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Fork (duplicate) a library item
 */
export async function forkLibraryItem(
  sourceId: string,
  data: {
    workspace_id: string
    name: string
    created_by: string
  }
) {
  try {
    // Get source item
    const source = await prisma.libraryItem?.findUnique({
      where: { id: sourceId },
    })

    if (!source) {
      throw new Error('Source item not found')
    }

    // Create fork
    const fork = await prisma.libraryItem?.create({
      data: {
        workspace_id: data.workspace_id,
        type: source.type,
        name: data.name,
        description: `Fork of: ${source.name}`,
        category: source.category,
        subcategory: source.subcategory,
        content: source.content,
        instructions: source.instructions,
        example_output: source.example_output,
        tags: source.tags,
        difficulty: source.difficulty,
        parent_id: sourceId,
        created_by: data.created_by,
      },
    })

    // Log the fork
    await prisma.libraryFork?.create({
      data: {
        source_id: sourceId,
        fork_id: fork.id,
        forked_by: data.created_by,
      },
    })

    return fork
  } catch (error) {
    throw new Error(`Failed to fork item: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Record usage of a library item
 */
export async function recordLibraryItemUsage(
  itemId: string,
  stats: {
    latency: number
    cost: number
    success: boolean
  }
) {
  try {
    const item = await prisma.libraryItem?.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      throw new Error('Library item not found')
    }

    // Calculate new averages
    const newUseCount = item.use_count + 1
    const newLatency = item.avg_latency 
      ? (item.avg_latency * item.use_count + stats.latency) / newUseCount
      : stats.latency
    const newCost = item.avg_cost 
      ? (item.avg_cost * item.use_count + stats.cost) / newUseCount
      : stats.cost
    const newSuccessRate = item.success_rate
      ? (item.success_rate * item.use_count + (stats.success ? 1 : 0)) / newUseCount
      : stats.success ? 1 : 0

    // Update item
    const updated = await prisma.libraryItem?.update({
      where: { id: itemId },
      data: {
        use_count: newUseCount,
        avg_latency: newLatency,
        avg_cost: newCost,
        success_rate: newSuccessRate,
        last_used: new Date(),
      },
    })

    return updated
  } catch (error) {
    throw new Error(`Failed to record usage: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Add a comment/rating to a library item
 */
export async function addLibraryComment(data: {
  library_item_id: string
  author: string
  comment: string
  rating?: number
}) {
  try {
    const comment = await prisma.libraryComment?.create({
      data: {
        library_item_id: data.library_item_id,
        author: data.author,
        comment: data.comment,
        rating: data.rating,
      },
    })

    // Update item rating
    const comments = await prisma.libraryComment?.findMany({
      where: { library_item_id: data.library_item_id },
    })

    const avgRating = comments
      .filter((c) => c.rating !== null)
      .reduce((sum, c) => sum + (c.rating || 0), 0) / (comments.filter((c) => c.rating).length || 1)

    await prisma.libraryItem?.update({
      where: { id: data.library_item_id },
      data: { rating: avgRating },
    })

    return comment
  } catch (error) {
    throw new Error(`Failed to add comment: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Export library items as JSON
 */
export function exportLibraryItems(items: any[]) {
  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      version: '1.0',
      items: items.map((item) => ({
        type: item.type,
        name: item.name,
        description: item.description,
        category: item.category,
        subcategory: item.subcategory,
        content: item.content,
        instructions: item.instructions,
        example_output: item.example_output,
        tags: item.tags,
        difficulty: item.difficulty,
      })),
    },
    null,
    2
  )
}

/**
 * Import library items from JSON
 */
export async function importLibraryItems(
  workspaceId: string,
  jsonData: string,
  createdBy: string
) {
  try {
    const data = JSON.parse(jsonData)
    const imported: any[] = []

    for (const item of data.items) {
      const created = await createLibraryItem({
        workspace_id: workspaceId,
        type: item.type,
        name: item.name,
        description: item.description,
        category: item.category,
        subcategory: item.subcategory,
        content: item.content,
        instructions: item.instructions,
        example_output: item.example_output,
        tags: item.tags,
        difficulty: item.difficulty,
        created_by: createdBy,
      })
      imported.push(created)
    }

    return imported
  } catch (error) {
    throw new Error(`Failed to import items: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Get library statistics
 */
export async function getLibraryStats(workspaceId: string) {
  try {
    const items = await prisma.libraryItem?.findMany({
      where: {
        workspace_id: workspaceId,
        is_archived: false,
      },
    })

    const stats = {
      total_items: items?.length || 0,
      by_type: {
        prompt: items?.filter((i) => i.type === 'prompt').length || 0,
        skill: items?.filter((i) => i.type === 'skill').length || 0,
        instruction: items?.filter((i) => i.type === 'instruction').length || 0,
        template: items?.filter((i) => i.type === 'template').length || 0,
        snippet: items?.filter((i) => i.type === 'snippet').length || 0,
      },
      by_difficulty: {
        beginner: items?.filter((i) => i.difficulty === 'beginner').length || 0,
        intermediate: items?.filter((i) => i.difficulty === 'intermediate').length || 0,
        advanced: items?.filter((i) => i.difficulty === 'advanced').length || 0,
      },
      most_used: items?.sort((a, b) => b.use_count - a.use_count).slice(0, 5) || [],
      highest_rated: items?.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5) || [],
      total_uses: items?.reduce((sum, i) => sum + i.use_count, 0) || 0,
      avg_success_rate: items?.filter((i) => i.success_rate).reduce((sum, i) => sum + (i.success_rate || 0), 0) / (items?.filter((i) => i.success_rate).length || 1) || 0,
    }

    return stats
  } catch (error) {
    throw new Error(`Failed to get stats: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Get recommended items (popular + high-rated)
 */
export async function getRecommendedItems(workspaceId: string, limit = 10) {
  try {
    const items = await prisma.libraryItem?.findMany({
      where: {
        workspace_id: workspaceId,
        is_archived: false,
      },
      orderBy: [
        { use_count: 'desc' },
        { rating: 'desc' },
      ],
      take: limit,
    })

    return items || []
  } catch (error) {
    throw new Error(`Failed to get recommendations: ${error instanceof Error ? error.message : String(error)}`)
  }
}
