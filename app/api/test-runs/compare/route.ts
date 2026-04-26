import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'
import { resolveAvailableModel } from '@/lib/model-fallback'

export const dynamic = 'force-dynamic'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || ''

const JUDGE_SYSTEM_PROMPT = `You are an expert prompt evaluator. Compare two LLM responses (Version A and Version B) to the same prompt input.

Evaluate on these dimensions (1-5 scale):
1. CLARITY: How clear, readable, and well-structured is the response?
2. COMPLETENESS: How thoroughly does it address the prompt?
3. ACCURACY: How factually correct and reliable does it appear?
4. TONE: How appropriate is the tone/style for the intended purpose?
5. HELPFULNESS: How actionable and useful is the response?

Respond ONLY with a JSON object in this exact format:
{
  "winner": "A" | "B" | "tie",
  "scores": {
    "A": { "clarity": N, "completeness": N, "accuracy": N, "tone": N, "helpfulness": N },
    "B": { "clarity": N, "completeness": N, "accuracy": N, "tone": N, "helpfulness": N }
  },
  "explanation": "2-3 sentences explaining why one is better or why they tied"
}
`

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let userId: string
    try {
      const decoded = verifyAccessToken(token)
      userId = decoded.userId
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { test_run_a_id, test_run_b_id } = body
    if (!test_run_a_id || !test_run_b_id) {
      return NextResponse.json({ error: 'test_run_a_id and test_run_b_id required' }, { status: 400 })
    }

    // Fetch both test runs
    const [runA, runB] = await Promise.all([
      prisma.testRun.findUnique({
        where: { id: test_run_a_id },
        include: { prompt_version: { include: { prompt: true } } },
      }),
      prisma.testRun.findUnique({
        where: { id: test_run_b_id },
        include: { prompt_version: { include: { prompt: true } } },
      }),
    ])

    if (!runA || !runB) {
      return NextResponse.json({ error: 'One or both test runs not found' }, { status: 404 })
    }

    // Verify ownership
    const workspace = await prisma.workspace.findFirst({
      where: { id: runA.workspace_id, user_id: userId },
      select: { id: true },
    })
    if (!workspace) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const judgePrompt = `${JUDGE_SYSTEM_PROMPT}\n\n---\nPROMPT INPUT:\n${runA.test_case_input}\n\n---\nVERSION A (${runA.model || 'unknown'}):\n${runA.output || '(no output)'}\n\n---\nVERSION B (${runB.model || 'unknown'}):\n${runB.output || '(no output)'}\n\n---\nYOUR EVALUATION (JSON only):`

    const judgeModel = await resolveAvailableModel()

    // Call Ollama Cloud for judge
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (OLLAMA_API_KEY) headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`

    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: judgeModel,
        prompt: judgePrompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.3,
          num_predict: 1024,
        },
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Judge model failed', detail: await res.text() }, { status: 502 })
    }

    const judgeData = await res.json()
    let result: any = null
    try {
      result = JSON.parse(judgeData.response)
    } catch {
      // Try extracting JSON from markdown
      const jsonMatch = judgeData.response.match(/\{[\s\S]*\}/)
      if (jsonMatch) result = JSON.parse(jsonMatch[0])
    }

    if (!result || !result.winner) {
      return NextResponse.json({ error: 'Judge returned invalid format', raw: judgeData.response }, { status: 500 })
    }

    // Persist comparison
    const winnerId = result.winner === 'A' ? runA.id : result.winner === 'B' ? runB.id : null
    const comparison = await prisma.testComparison.create({
      data: {
        workspace_id: workspace.id,
        test_run_a_id: runA.id,
        test_run_b_id: runB.id,
        winner_id: winnerId,
        judge_result: result.scores || null,
        judge_notes: result.explanation || null,
      },
    })

    return NextResponse.json({
      comparison: {
        id: comparison.id,
        winner: result.winner,
        winner_id: winnerId,
        scores: result.scores,
        explanation: result.explanation,
      },
    }, { status: 200 })
  } catch (error: any) {
    console.error('Judge comparison error:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}
