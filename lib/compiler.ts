/**
 * Logic Engine: Prompt Compiler
 * 
 * This module provides the core compilation logic for PromptArchitect.
 * It fetches a prompt version, retrieves all linked snippets, and compiles
 * them into a final prompt with variable substitution.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Variable pattern matcher - identifies {{variable_name}} in text
 */
export const VARIABLE_PATTERN = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

/**
 * Validation: Check for unclosed or malformed curly braces
 * @param text - Text to validate
 * @returns true if valid, false if malformed
 */
export function validateBraces(text: string): boolean {
  // Track all braces to detect unclosed ones
  const openBraces = (text.match(/\{\{/g) || []).length;
  const closeBraces = (text.match(/\}\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    return false;
  }
  
  // Ensure {{ always comes before }}
  let depth = 0;
  for (let i = 0; i < text.length - 1; i++) {
    if (text[i] === '{' && text[i + 1] === '{') {
      depth++;
      i++; // Skip next character
    } else if (text[i] === '}' && text[i + 1] === '}') {
      depth--;
      if (depth < 0) return false; // Closing without opening
      i++; // Skip next character
    }
  }
  
  return depth === 0;
}

/**
 * Extract variable names from template text
 * @param text - Template text containing variables
 * @returns Set of variable names found in the text
 */
export function extractVariables(text: string): Set<string> {
  const variables = new Set<string>();
  const matches = text.matchAll(VARIABLE_PATTERN);
  
  for (const match of matches) {
    variables.add(match[1]);
  }
  
  return variables;
}

/**
 * Main compilation function
 * 
 * Fetches a PromptVersion, retrieves all linked Snippets (ordered by rank),
 * concatenates them with the template_body, and returns the compiled prompt.
 * 
 * @param versionId - The PromptVersion ID to compile
 * @returns Object containing compiled prompt, variables, and metadata
 */
export async function compilePrompt(versionId: string) {
  try {
    // Fetch the prompt version
    const promptVersion = await prisma.promptVersion.findUnique({
      where: { id: versionId },
      include: {
        snippets: {
          include: {
            snippet: true,
          },
          orderBy: {
            rank: 'asc',
          },
        },
      },
    });

    if (!promptVersion) {
      throw new Error(`PromptVersion not found: ${versionId}`);
    }

    // Validate template_body for malformed braces
    if (!validateBraces(promptVersion.template_body)) {
      throw new Error('Template contains unclosed or malformed curly braces');
    }

    // Compile: Start with template, then prepend/append snippets
    let compiled = promptVersion.template_body;

    // Add snippets in order
    const snippetTexts = promptVersion.snippets.map((pc) => pc.snippet.content);
    
    // Prepend all snippets before the template
    const allSnippets = snippetTexts.join('\n\n');
    if (allSnippets) {
      compiled = `${allSnippets}\n\n${compiled}`;
    }

    // Extract all variables from the final compiled prompt
    const variables = extractVariables(compiled);

    return {
      versionId,
      promptId: promptVersion.promptId,
      compiled,
      variables: Array.from(variables),
      model_config: promptVersion.model_config,
      changeLog: promptVersion.changeLog,
    };
  } catch (error) {
    throw new Error(`Failed to compile prompt: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Substitute variables in a compiled prompt
 * 
 * @param prompt - The compiled prompt text
 * @param variables - Object mapping variable names to values
 * @returns Prompt with variables substituted
 */
export function substituteVariables(
  prompt: string,
  variables: Record<string, string | number | boolean>
): { result: string; missingVariables: string[] } {
  const missingVariables: string[] = [];
  let result = prompt;

  result = result.replace(VARIABLE_PATTERN, (match, varName: string) => {
    if (varName in variables) {
      return String(variables[varName]);
    }
    missingVariables.push(varName);
    return match; // Return original if not found
  });

  return { result, missingVariables };
}

/**
 * Full execution: Compile + Substitute
 * 
 * @param versionId - The PromptVersion ID
 * @param variables - Variables to substitute
 * @returns Final prompt ready for API call
 */
export async function executePreparedPrompt(
  versionId: string,
  variables: Record<string, string | number | boolean> = {}
) {
  const compiled = await compilePrompt(versionId);
  const { result, missingVariables } = substituteVariables(compiled.compiled, variables);

  if (missingVariables.length > 0) {
    console.warn(`Missing variables: ${missingVariables.join(', ')}`);
  }

  return {
    ...compiled,
    finalPrompt: result,
    missingVariables,
  };
}

/**
 * Get all required variables for a prompt version
 * Useful for form generation in the UI
 */
export async function getRequiredVariables(versionId: string): Promise<string[]> {
  const compiled = await compilePrompt(versionId);
  return compiled.variables;
}
