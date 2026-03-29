# PromptArchitect Library System 📚

## Overview

The Library System is a **comprehensive storage and management solution** for all your completed prompts, skills, instructions, and reusable templates. It serves as a **discoverable, searchable, and versioned knowledge base** for your team.

---

## Features

### 📦 Storage & Organization
- ✅ **5 Content Types**:
  - **Prompts**: Complete, tested, production-ready prompts
  - **Skills**: Specialized techniques and patterns
  - **Instructions**: Step-by-step guides
  - **Templates**: Reusable template structures
  - **Snippets**: Small reusable text blocks

- ✅ **Categories & Tags**: Organize by domain (marketing, technical, content, etc.)
- ✅ **Difficulty Levels**: Beginner, Intermediate, Advanced
- ✅ **Collections**: Group related items together

### 🔍 Discovery
- ✅ **Full-Text Search**: Find by name, description, or tags
- ✅ **Advanced Filtering**: Category, type, difficulty, tags
- ✅ **Smart Sorting**: By popularity, ratings, or recent usage
- ✅ **Recommendations**: Based on ratings and usage

### ⭐ Quality & Feedback
- ✅ **Star Ratings**: 1-5 star user ratings (calculated from comments)
- ✅ **Comments**: Team feedback and discussion
- ✅ **Usage Tracking**: How many times each item is used
- ✅ **Performance Metrics**: Average latency, cost, success rate

### 🔄 Version Management
- ✅ **Version Tracking**: Track changes with changelogs
- ✅ **Forking**: Duplicate items as starting points
- ✅ **Parent/Child Tracking**: Know relationships between items

### 📤 Import/Export
- ✅ **Export to JSON**: Back up or share items
- ✅ **Import from JSON**: Build from templates or team libraries
- ✅ **Bulk Operations**: Import/export multiple items at once

---

## Content Types Explained

### 🎯 Prompts
**Best for**: Complete, tested LLM prompts ready to execute

**Example**: "E-commerce Product Description Generator"
```
Generates compelling product descriptions for e-commerce
- Used 247 times
- 4.8 ⭐ rating
- Takes 2-3 seconds
- Costs ~$0.01 per execution
```

**When to use**: Production-ready prompts that have been tested and validated

---

### 💡 Skills
**Best for**: Specialized techniques, patterns, or best practices

**Example**: "Brand Voice Consistency"
```
Maintain consistent brand voice across all content
- Core principle: Use unified tone and style
- Key techniques: voice guidelines, examples
```

**When to use**: Techniques you use across multiple prompts

---

### 📝 Instructions
**Best for**: Step-by-step guides for specific tasks

**Example**: "SEO-Optimized Content Guidelines"
```
1. Keyword research
2. Natural inclusion
3. Meta descriptions
4. Header structure
5. Internal linking
```

**When to use**: Processes or workflows your team follows

---

### 📋 Templates
**Best for**: Reusable template structures with variables

**Example**: "Email Marketing Template"
```
Subject: {{subject}}

Hi {{first_name}},

{{body}}

Best regards,
{{company_name}}
```

**When to use**: Structures you use repeatedly with different content

---

### 🧩 Snippets
**Best for**: Small reusable text blocks

**Example**: "Professional Greeting"
```
Hello {{name}}, thank you for reaching out.
```

**When to use**: Phrases, sentences, or small blocks you reuse

---

## Database Schema

### LibraryItem Table

```sql
id                  -- Unique identifier
workspace_id        -- Which workspace this belongs to
type                -- prompt | skill | instruction | template | snippet
name                -- e.g., "E-commerce Product Description"
description         -- Brief description
category            -- marketing | technical | content | seo | email | etc.
subcategory         -- Optional: more specific categorization
content             -- Full text of the item
instructions        -- How to use this item (Markdown)
example_output      -- Example of what this produces
tags                -- ["ecommerce", "seo", "marketing"]
difficulty          -- beginner | intermediate | advanced
use_count           -- How many times it's been used
last_used           -- When it was last accessed
avg_latency         -- Average execution time (ms)
avg_cost            -- Average cost per execution ($)
success_rate        -- Success percentage (0-1)
rating              -- Average star rating (0-5)
is_public           -- Share with team?
is_archived         -- Soft-deleted?
is_template         -- Can be forked/duplicated?
version_number      -- Current version
changelog           -- What changed in this version
parent_id           -- If forked from another item
related_ids         -- Other related items
created_by          -- User who created
created_at          -- Creation timestamp
updated_at          -- Last update timestamp
```

### LibraryComment Table
```sql
id
library_item_id
author              -- Who left the comment
comment             -- Comment text
rating              -- 1-5 star rating
created_at
```

### LibraryFork Table
```sql
id
source_id           -- Original item
fork_id             -- New item created from source
forked_by           -- Who created the fork
created_at
```

---

## API Endpoints

### GET /api/library
**Fetch library items with filtering**

Query Parameters:
```
action=list|get|stats|recommended
type=prompt|skill|instruction|template|snippet
category=marketing|technical|etc.
tags=tag1,tag2,tag3
search=search_term
difficulty=beginner|intermediate|advanced
workspace_id=workspace_id
include_archived=true|false
```

Examples:
```bash
# Get all prompts
GET /api/library?type=prompt

# Search for SEO-related items
GET /api/library?search=seo&category=marketing

# Get recommendations
GET /api/library?action=recommended&limit=10

# Get stats
GET /api/library?action=stats
```

### POST /api/library
**Create, fork, comment, import/export**

Actions:
```json
// Create new item
{
  "action": "create",
  "type": "prompt",
  "name": "My Prompt",
  "content": "...",
  "category": "marketing",
  "tags": ["seo", "ecommerce"],
  "difficulty": "intermediate",
  "created_by": "user@example.com"
}

// Fork an item
{
  "action": "fork",
  "source_id": "item_123",
  "name": "My Fork",
  "created_by": "user@example.com"
}

// Add comment/rating
{
  "action": "comment",
  "item_id": "item_123",
  "author": "user@example.com",
  "comment": "Great template!",
  "rating": 5
}

// Record usage
{
  "action": "usage",
  "item_id": "item_123",
  "latency": 2341,
  "cost": 0.0142,
  "success": true
}

// Import items
{
  "action": "import",
  "json_data": "{...}",
  "created_by": "user@example.com"
}

// Export items
{
  "action": "export",
  "item_ids": ["id1", "id2", "id3"]
}
```

### PUT /api/library/:id
**Update a library item**

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "content": "Updated content",
  "tags": ["new-tag"],
  "difficulty": "advanced",
  "changelog": "Updated description and tags"
}
```

### DELETE /api/library/:id
**Archive a library item (soft delete)**

---

## Usage Examples

### 1. Save a Tested Prompt to Library

```typescript
await fetch('/api/library', {
  method: 'POST',
  body: JSON.stringify({
    action: 'create',
    type: 'prompt',
    name: 'Product Description - Tested',
    description: 'Proven prompt for e-commerce descriptions',
    category: 'marketing',
    content: 'Write product description for {{product_name}}...',
    tags: ['ecommerce', 'sales'],
    difficulty: 'intermediate',
    example_output: 'Premium Wireless Headphones deliver...',
    instructions: 'Use with product name and features',
    created_by: 'john@example.com'
  })
})
```

### 2. Find Similar Items

```typescript
// Search for all e-commerce marketing prompts
const response = await fetch(
  '/api/library?category=marketing&tags=ecommerce&type=prompt'
)
const { items } = await response.json()
```

### 3. Fork an Existing Item

```typescript
await fetch('/api/library', {
  method: 'POST',
  body: JSON.stringify({
    action: 'fork',
    source_id: 'original_item_123',
    name: 'My Modified Version',
    created_by: 'jane@example.com'
  })
})
```

### 4. Track Performance Metrics

```typescript
// After using a library item
await fetch('/api/library', {
  method: 'POST',
  body: JSON.stringify({
    action: 'usage',
    item_id: 'item_123',
    latency: 2341,  // milliseconds
    cost: 0.0142,   // USD
    success: true
  })
})
```

### 5. Share Feedback

```typescript
await fetch('/api/library', {
  method: 'POST',
  body: JSON.stringify({
    action: 'comment',
    item_id: 'item_123',
    author: 'mike@example.com',
    comment: 'Works great for product descriptions!',
    rating: 5
  })
})
```

---

## UI Components

### Library Browser (`/library`)

The main interface for discovering and managing library items:

**Features:**
- 🔍 Search bar with autocomplete
- 🏷️ Filter by category, type, difficulty
- ⭐ Sort by popularity, ratings, or recent
- 📋 List view with metadata
- 📄 Detail panel with preview
- 🔗 Copy, fork, use in prompt buttons
- 📊 Usage stats and ratings

**Components:**
- Search Input
- Filter Controls
- Item List
- Detail Panel
- Action Buttons

---

## Best Practices

### ✅ DO

1. **Name items clearly**
   - ✅ "E-commerce Product Description"
   - ❌ "Prompt 1"

2. **Add comprehensive descriptions**
   - ✅ "Generates compelling e-commerce product descriptions with SEO optimization"
   - ❌ "A prompt"

3. **Include example outputs**
   - Shows what the item produces
   - Helps users decide if it's what they need

4. **Use consistent tags**
   - Improves discoverability
   - Makes filtering effective

5. **Keep content up-to-date**
   - Update based on performance feedback
   - Note changes in changelog

6. **Archive instead of delete**
   - Preserves history
   - Can always restore if needed

### ❌ DON'T

1. **Don't duplicate content**
   - Use fork feature instead
   - Tag as derived item

2. **Don't store sensitive data**
   - Remove API keys
   - Anonymize test data

3. **Don't create too many versions**
   - Archive old versions
   - Keep current version active

---

## Integration with Main System

### Connect Library to Test Runner

When you test a prompt from the library:

```typescript
// Test runner automatically:
1. Loads the item from library
2. Records execution metrics
3. Updates use_count, avg_latency, avg_cost
4. Updates last_used timestamp
5. Calculates success_rate
```

### Use Library Items in Prompts

When building a new prompt:

```typescript
// Can reference library items as snippets:
1. Select items from library
2. Compose into new prompt
3. Test combined prompt
4. Optionally save as new library item
```

---

## Statistics & Analytics

### Library Stats Endpoint

```bash
GET /api/library?action=stats&workspace_id=workspace_123
```

Returns:
```json
{
  "total_items": 156,
  "by_type": {
    "prompt": 45,
    "skill": 28,
    "instruction": 32,
    "template": 31,
    "snippet": 20
  },
  "by_difficulty": {
    "beginner": 45,
    "intermediate": 78,
    "advanced": 33
  },
  "most_used": [...],
  "highest_rated": [...],
  "total_uses": 4521,
  "avg_success_rate": 0.97
}
```

---

## Advanced Features

### Collections
Group related items (coming soon):
```
"Email Marketing Suite"
├── Email Template
├── Subject Line Skill
├── Body Content Prompt
└── CTA Instruction
```

### Sharing
Share items with team (coming soon):
- Set `is_public: true` to make public
- Share via URL or export
- Team can fork and customize

### Versioning
Full version history (coming soon):
- See all versions
- Compare changes
- Rollback to previous

---

## Migration from Snippets

If you have existing snippets, migrate them to the library:

```typescript
// All snippets automatically appear as library items
// with type: "snippet" and category: "snippets"

// Then can be:
// 1. Recategorized
// 2. Tagged better
// 3. Rated and commented on
// 4. Used in prompts
// 5. Exported as part of library
```

---

## Export/Import Format

### Export Structure

```json
{
  "exported_at": "2024-03-28T10:30:00Z",
  "version": "1.0",
  "items": [
    {
      "type": "prompt",
      "name": "Product Description",
      "description": "...",
      "category": "marketing",
      "content": "...",
      "tags": ["ecommerce"],
      "difficulty": "intermediate"
    }
  ]
}
```

### Use Cases
- **Backup**: Regularly export library
- **Share**: Send team a template library
- **Migrate**: Move items between workspaces
- **Version Control**: Keep in Git

---

## Roadmap

- [ ] Collections (group related items)
- [ ] Team sharing and permissions
- [ ] Advanced analytics dashboard
- [ ] Duplicate detection
- [ ] Collaborative editing
- [ ] Usage trends
- [ ] Cost optimization recommendations
- [ ] A/B testing prompts

---

## Summary

The **Library System** is your **central knowledge base** for all LLM prompts, skills, and instructions. It provides:

✅ **Organization**: By type, category, difficulty, tags
✅ **Discovery**: Search, filter, sort, recommendations
✅ **Quality**: Ratings, comments, feedback
✅ **Performance**: Usage stats, costs, success rates
✅ **Collaboration**: Sharing, forking, versioning
✅ **Portability**: Export/import as JSON

This transforms PromptArchitect from a **testing tool** into a complete **knowledge management system** for your team! 📚

