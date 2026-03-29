/**
 * API Route: /api/library
 * 
 * Comprehensive library management endpoint
 * Handles: CRUD, search, filtering, import/export, stats
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  createLibraryItem,
  getLibraryItems,
  getLibraryItem,
  updateLibraryItem,
  archiveLibraryItem,
  forkLibraryItem,
  recordLibraryItemUsage,
  addLibraryComment,
  exportLibraryItems,
  importLibraryItems,
  getLibraryStats,
  getRecommendedItems,
} from '@/lib/library-manager'

/**
 * GET /api/library
 * 
 * Query parameters:
 * - action: "list" | "search" | "stats" | "recommended"
 * - type: "prompt" | "skill" | "instruction"
 * - category: category name
 * - tags: comma-separated tags
 * - search: search term
 * - workspace_id: workspace ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'list'
    const workspaceId = searchParams.get('workspace_id') || 'workspace_default'

    // GET SINGLE ITEM
    if (action === 'get') {
      const itemId = searchParams.get('item_id')
      if (!itemId) {
        return NextResponse.json({ error: 'Missing item_id' }, { status: 400 })
      }

      const item = await getLibraryItem(itemId)
      return NextResponse.json({ item }, { status: 200 })
    }

    // GET STATS
    if (action === 'stats') {
      const stats = await getLibraryStats(workspaceId)
      return NextResponse.json({ stats }, { status: 200 })
    }

    // GET RECOMMENDATIONS
    if (action === 'recommended') {
      const limit = parseInt(searchParams.get('limit') || '10')
      const items = await getRecommendedItems(workspaceId, limit)
      return NextResponse.json({ items }, { status: 200 })
    }

    // LIST & SEARCH (default)
    const filters = {
      workspace_id: workspaceId,
      type: searchParams.get('type') || undefined,
      category: searchParams.get('category') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      is_template: searchParams.get('is_template') === 'true' || undefined,
      search: searchParams.get('search') || undefined,
      include_archived: searchParams.get('include_archived') === 'true' || false,
    }

    const items = await getLibraryItems(filters)
    return NextResponse.json({ items, count: items.length }, { status: 200 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch library items',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

interface CreateLibraryRequest {
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
  workspace_id?: string
}

/**
 * POST /api/library
 * 
 * Actions:
 * - create: Create new library item
 * - fork: Duplicate an existing item
 * - comment: Add comment/rating
 * - usage: Record usage stats
 * - import: Import items from JSON
 * - export: Export items to JSON
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, workspace_id = 'workspace_default' } = body

    // CREATE NEW ITEM
    if (action === 'create') {
      const { type, name, description, category, subcategory, content, instructions, example_output, tags, difficulty, is_template, created_by } = body as CreateLibraryRequest

      if (!type || !name || !content || !category) {
        return NextResponse.json(
          { error: 'Missing required fields: type, name, content, category' },
          { status: 400 }
        )
      }

      const item = await createLibraryItem({
        workspace_id,
        type,
        name,
        description,
        category,
        subcategory,
        content,
        instructions,
        example_output,
        tags,
        difficulty,
        is_template,
        created_by,
      })

      return NextResponse.json({ item }, { status: 201 })
    }

    // FORK ITEM
    if (action === 'fork') {
      const { source_id, name, created_by } = body

      if (!source_id || !name || !created_by) {
        return NextResponse.json(
          { error: 'Missing required fields: source_id, name, created_by' },
          { status: 400 }
        )
      }

      const fork = await forkLibraryItem(source_id, {
        workspace_id,
        name,
        created_by,
      })

      return NextResponse.json({ fork }, { status: 201 })
    }

    // ADD COMMENT/RATING
    if (action === 'comment') {
      const { item_id, author, comment, rating } = body

      if (!item_id || !author || !comment) {
        return NextResponse.json(
          { error: 'Missing required fields: item_id, author, comment' },
          { status: 400 }
        )
      }

      const newComment = await addLibraryComment({
        library_item_id: item_id,
        author,
        comment,
        rating,
      })

      return NextResponse.json({ comment: newComment }, { status: 201 })
    }

    // RECORD USAGE
    if (action === 'usage') {
      const { item_id, latency, cost, success } = body

      if (!item_id || latency === undefined || cost === undefined) {
        return NextResponse.json(
          { error: 'Missing required fields: item_id, latency, cost' },
          { status: 400 }
        )
      }

      const updated = await recordLibraryItemUsage(item_id, {
        latency,
        cost,
        success: success || false,
      })

      return NextResponse.json({ item: updated }, { status: 200 })
    }

    // IMPORT
    if (action === 'import') {
      const { json_data, created_by } = body

      if (!json_data || !created_by) {
        return NextResponse.json(
          { error: 'Missing required fields: json_data, created_by' },
          { status: 400 }
        )
      }

      const imported = await importLibraryItems(workspace_id, json_data, created_by)

      return NextResponse.json({ imported, count: imported.length }, { status: 201 })
    }

    // EXPORT
    if (action === 'export') {
      const { item_ids } = body

      if (!item_ids || item_ids.length === 0) {
        return NextResponse.json(
          { error: 'Missing required fields: item_ids (array)' },
          { status: 400 }
        )
      }

      // Fetch items
      const items = await Promise.all(
        item_ids.map((id: string) => getLibraryItem(id))
      )

      const json = exportLibraryItems(items)

      return NextResponse.json({ json, filename: `library-export-${Date.now()}.json` }, { status: 200 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/library/:id
 * 
 * Update a library item
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const itemId = params.id
    const body = await request.json()

    const { name, description, content, instructions, example_output, tags, difficulty, rating, changelog } =
      body

    const updated = await updateLibraryItem(itemId, {
      name,
      description,
      content,
      instructions,
      example_output,
      tags,
      difficulty,
      rating,
      changelog,
    })

    return NextResponse.json({ item: updated }, { status: 200 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update item',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/library/:id
 * 
 * Archive a library item (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const itemId = params.id

    const archived = await archiveLibraryItem(itemId)

    return NextResponse.json({ item: archived }, { status: 200 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to archive item',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
