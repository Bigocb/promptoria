import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'

async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findFirst({ where: { user_id: userId } })
}

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
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await getWorkspaceForUser(userId)
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const body = await request.json()
    const { template_body, test_input, model_config } = body

    const issues = []
    const warnings = []
    const info = []

    // Check template body
    if (!template_body || typeof template_body !== 'string') {
      issues.push('template_body is required and must be a string')
    } else {
      // Check for required placeholder
      if (!template_body.includes('{input}')) {
        warnings.push('Template does not contain {input} placeholder - will not accept user input')
      }

      // Check for double braces (common mistake)
      if (template_body.includes('{{') || template_body.includes('}}')) {
        warnings.push('Template contains double braces - did you mean {input}?')
      }

      // Check template length
      if (template_body.length > 10000) {
        warnings.push('Template is very long (>10KB) - consider breaking into snippets')
      }

      if (template_body.length < 10) {
        warnings.push('Template is very short - ensure it provides clear instructions')
      }

      info.push(`Template length: ${template_body.length} characters`)
      info.push(`Template lines: ${template_body.split('\n').length}`)
    }

    // Check model config
    if (model_config) {
      if (model_config.temperature !== undefined) {
        if (model_config.temperature < 0 || model_config.temperature > 2) {
          issues.push('temperature must be between 0 and 2')
        }
        if (model_config.temperature > 1) {
          info.push('High temperature (>1) will increase creativity but reduce consistency')
        }
      }

      if (model_config.maxTokens !== undefined) {
        if (model_config.maxTokens < 1 || model_config.maxTokens > 4096) {
          issues.push('maxTokens must be between 1 and 4096')
        }
        if (model_config.maxTokens < 100) {
          warnings.push('Low max_tokens may cause incomplete responses')
        }
      }

      if (model_config.topP !== undefined) {
        if (model_config.topP < 0 || model_config.topP > 1) {
          issues.push('topP must be between 0 and 1')
        }
      }
    }

    // Simulate with test input
    let simulatedOutput = ''
    if (template_body && test_input) {
      simulatedOutput = template_body.replace('{input}', test_input)
      info.push(`Simulated output length: ${simulatedOutput.length} characters`)

      if (simulatedOutput.length > 5000) {
        warnings.push('Simulated prompt is very long - Claude will handle it but may be slower')
      }
    }

    const isValid = issues.length === 0

    return NextResponse.json(
      {
        valid: isValid,
        issues,
        warnings,
        info,
        simulated_preview: simulatedOutput ? simulatedOutput.substring(0, 200) : null,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Validate prompt error:', error)
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    )
  }
}
