# Promptoria User Guide

Welcome to **Promptoria Archive Scribe** — a version-controlled prompt management system for developers, researchers, and prompt engineers.

## 📚 The Workflow

Promptoria is designed around a simple workflow:

```
Create Snippets → Compose Prompts → Test & Refine → Version History
```

---

## 🎯 The Four Sections Explained

### 1. 📚 **Snippet Library**

**Purpose:** Store and organize reusable text blocks.

**What goes here?**
- **System prompts** - Instructions for how the AI should behave
  ```
  "You are an expert product designer. Think step-by-step and explain your reasoning clearly."
  ```
- **Few-shot examples** - Input/output pairs that teach the AI by example
  ```
  "Example: Input: 'cat', Output: 'A domestic feline animal...'"
  ```
- **Instructions** - Common instructions you use across many prompts
  ```
  "Always respond in under 150 words. Be concise and actionable."
  ```
- **Context blocks** - Background information for the AI
  ```
  "Our company sells premium software for designers..."
  ```
- **Response templates** - Frameworks for how you want responses formatted
  ```
  "Format your response as: [Summary] [Details] [Next Steps]"
  ```

**Why snippets?**
- Write once, use many times
- Easy to update (change the snippet, all prompts using it get updated)
- Build complex prompts from simple, tested pieces
- Track which prompts use which snippets

**Example Workflow:**
1. Create snippet: "Brand Voice" with your company's tone
2. Create snippet: "Output Format" with how you want responses structured
3. Later: Compose a new prompt using both snippets + a specific task

---

### 2. ⚡ **Prompt Workspace**

**Purpose:** Compose complete, executable prompts from your snippets.

**What is a Prompt?**
A prompt is a complete message you send to an LLM. It typically includes:

```
[System Prompt] + [Examples] + [Instructions] + [Your Actual Task] = Full Prompt
```

**How to Build One Here:**
1. Start with a base template (your main task)
2. Insert snippets (system prompt, examples, instructions)
3. Add variables like `{topic}` or `{style}` for dynamic content
4. Save it as a new version when ready
5. Test it in the Test Runner

**Example Prompt:**
```
{system_prompt}

Here are some examples:
{examples}

Now, please: Generate a product description for {product_name} in {tone} voice.

{instructions}
```

**Why separate from snippets?**
- A prompt is a snapshot in time (versioned)
- It combines multiple snippets + specific task + variables
- You can test it, refine it, and track all versions
- Same snippet can be used in many different prompts

---

### 3. 📊 **Version History**

**Purpose:** Track every change to your prompts, compare versions, and rollback if needed.

**What gets tracked?**
- Every time you save a prompt as a new version
- The full text of each version
- A changelog explaining what changed
- When it was created and by whom

**How to use it:**
1. **View history** - See all versions of a prompt in chronological order
2. **Compare versions** - Select any two versions to see exact changes
3. **Rollback** - Revert to an older version if needed
4. **Analyze evolution** - Understand how your prompts have improved over time

**Example:**
- **v1:** Basic prompt, got mediocre results
- **v2:** Added few-shot examples, improved results
- **v3:** Refined instructions, best results yet
- **v4:** Experimented with new tone, worse results
- **Action:** Rollback to v3, which was the best performer

---

### 4. ▶️ **Test Runner**

**Purpose:** Execute prompts against LLM APIs and see real-time responses.

**What you can do:**
1. **Set variables** - Fill in dynamic parts like `{topic}` or `{style}`
2. **Choose an API** - OpenAI, Claude, Cohere, etc.
3. **Configure parameters** - Temperature, max tokens, etc.
4. **Execute** - Get the response instantly
5. **Analyze** - See tokens used, cost, latency, etc.

**Why test here?**
- Quick iteration without context switching
- See exactly how your prompt performs with real APIs
- Compare different versions of the same prompt
- Track costs and performance over time
- Build a database of what works

**Typical Workflow:**
1. Create/refine prompt in Workspace
2. Fill in test variables
3. Execute against Claude/GPT API
4. Review output quality
5. If bad → go back to Workspace, refine, retry
6. If good → save a new version in Version History

---

## 🔄 The Complete Journey

### Example: Building a "Product Description Generator"

**Day 1 - Setup**
1. Create snippets:
   - "Brand Voice" - how your company sounds
   - "Output Format" - structure for descriptions
   - "Quality Guidelines" - what makes a good description

**Day 2 - Build**
2. Create prompt "Product Description v1":
   - Combine your 3 snippets
   - Add task: "Write a description for {product_name}"
   - Save

**Day 3 - Test & Refine**
3. Test Runner:
   - Test with "Premium Wireless Headphones"
   - Result: Too generic
   - Go back to Workspace
   - Refine prompt: Add more specific examples
   - Save as v2

4. Test again:
   - Much better! But tone is off
   - Update "Brand Voice" snippet
   - All prompts using it now benefit
   - Test again: Perfect!

**Day 4 - Document**
4. Version History:
   - See v1 → v2 evolution
   - Add changelog: "Added examples, improved tone"
   - Compare: See exactly what changed
   - Know why v2 is better than v1

**Day 30 - Scaling**
5. Archive Scribe Principle:
   - You have 30 days of iterations
   - Every version is preserved
   - You can see what worked and why
   - Reuse snippets in new prompts
   - Share version history with team

---

## 💡 Key Principles

### 1. **Snippets are atoms, Prompts are molecules**
- Snippets: Tiny, tested, reusable pieces
- Prompts: Complete, versioned, executable

### 2. **Every version tells a story**
- v1: "Basic attempt"
- v2: "Added examples"
- v3: "Optimized tone"
- v4: "Experimented with style"

This history is valuable. Don't lose it.

### 3. **Test before deploying**
- Test Runner is your lab
- Version History is your archive
- A/B test different prompts to find the best one

### 4. **Snippets are living documents**
- Change a snippet once, update all prompts using it
- No copy-paste duplication
- Single source of truth

---

## 🎯 Best Practices

### Snippet Organization
- Keep snippets focused: one concept per snippet
- Use clear names: "Brand Voice" not "BV1"
- Include a description: why does this snippet exist?
- Version snippets too (update date in description)

### Prompt Naming
- Use descriptive names: "Product Description Generator" not "Prompt 1"
- Include intent: "v1-basic" shows it's an early iteration
- Changelogs: explain why you changed something

### Testing
- Always test in Test Runner before deploying
- Try edge cases: what breaks your prompt?
- Compare versions: which one is actually better?
- Log results: build a database of what works

### Versioning
- One version per meaningful change
- Clear changelogs explaining why
- Don't worry about version explosion
- Archive Scribe principle: preserve everything

---

## 🚀 Quick Start

1. **Create a snippet** (📚 Snippet Library)
   - Your company's brand voice or tone

2. **Create a snippet** (📚 Snippet Library)
   - Output format or structure you want

3. **Compose a prompt** (⚡ Prompt Workspace)
   - Use your 2 snippets + your task

4. **Test it** (▶️ Test Runner)
   - See how it performs with real APIs

5. **Refine it** (⚡ Prompt Workspace)
   - If it's not good enough, go back and improve

6. **Version it** (📊 Version History)
   - Compare changes and track improvements

---

## ❓ FAQ

**Q: What if I just want to test a quick prompt?**
A: You can skip Snippets for now. Just create a Prompt directly. But you'll miss the reusability benefits.

**Q: How many versions should I keep?**
A: All of them! The Archive Scribe principle is to preserve everything. You might want to revert to an old version later.

**Q: Can I use the same snippet in multiple prompts?**
A: Yes! That's the whole point. Change the snippet once, all prompts using it improve.

**Q: What if a snippet should be different for different prompts?**
A: Create separate snippets. "Brand Voice - Casual" vs "Brand Voice - Professional". Keep them focused.

**Q: How do I share prompts with my team?**
A: Sharing and collaboration are coming soon. For now, export prompts as JSON/Markdown.

---

## 🎓 Mental Model

Think of Promptoria like **version control for prompts**:

- **Git** = Promptoria (both track versions)
- **Commits** = Prompt versions (snapshots in time)
- **Branches** = Prompt variants (different experiments)
- **Diffs** = Version History (see what changed)
- **Reusable functions** = Snippets (write once, use many times)

The Archive Scribe philosophy: **Every iteration matters. Preserve everything. Learn from history.**
