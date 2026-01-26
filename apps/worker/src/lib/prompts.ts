/**
 * AI Prompt Templates for LiveCanvas AI
 *
 * These prompts are used by the AI routes to generate, analyze,
 * refactor, and fix Mermaid diagrams.
 */

export const SYSTEM_PROMPT = `You are an expert software architect and Mermaid diagram specialist.
You help users create, analyze, and improve architecture diagrams.
Always provide clear, actionable advice.`;

export const ANALYZE_PROMPT = `You are an expert software architect analyzing a Mermaid diagram.

Analyze the following diagram and explain:
1. The overall architecture pattern being used
2. The components and their responsibilities
3. The data flow between components
4. Potential strengths of this design
5. Areas that might need attention or improvement

Diagram:
\`\`\`mermaid
{{MERMAID}}
\`\`\`

Provide a clear, structured analysis that helps the user understand their architecture better.`;

export const REFACTOR_PROMPT = `You are an expert software architect. Analyze this Mermaid diagram and suggest improvements.

Current diagram:
\`\`\`mermaid
{{MERMAID}}
\`\`\`

Provide:
1. Analysis of current design issues or areas for improvement
2. Specific improvement recommendations
3. A refactored Mermaid diagram that addresses the issues

Format your response as:

## Analysis
[Your analysis of the current design]

## Recommendations
[Your specific recommendations for improvement]

## Refactored Diagram
\`\`\`mermaid
[Your improved Mermaid code]
\`\`\`

Ensure the refactored diagram is syntactically valid Mermaid code.`;

export const GENERATE_PROMPT = `You are an expert software architect. Generate a Mermaid diagram based on this description:

{{PROMPT}}

Requirements:
- Use the most appropriate Mermaid diagram type (flowchart, sequence, class, etc.)
- Include clear, descriptive node labels
- Show relationships and data flow between components
- Keep the diagram readable and well-organized
- Use proper Mermaid syntax

Respond with ONLY the Mermaid code, no explanations or markdown code blocks.
Start directly with the diagram type (e.g., "graph TD", "sequenceDiagram", "classDiagram").`;

export const FIX_SYNTAX_PROMPT = `Fix the syntax errors in this Mermaid diagram.
Return ONLY the corrected Mermaid code, no explanations.
Start directly with the diagram type (e.g., "graph TD", "sequenceDiagram").

Invalid diagram:
\`\`\`mermaid
{{MERMAID}}
\`\`\`

Corrected diagram:`;

export const MODIFY_PROMPT = `You are an expert software architect. Modify the following Mermaid diagram based on the user's instructions.

Current diagram:
\`\`\`mermaid
{{MERMAID}}
\`\`\`

User's instructions:
{{INSTRUCTIONS}}

Requirements:
- Apply the user's requested changes to the existing diagram
- Maintain the same diagram type unless the user explicitly asks to change it
- Keep existing nodes and relationships that aren't affected by the changes
- Ensure the result is syntactically valid Mermaid code
- Preserve the overall structure and style of the original diagram

Respond with ONLY the modified Mermaid code, no explanations or markdown code blocks.
Start directly with the diagram type (e.g., "graph TD", "sequenceDiagram", "classDiagram").`;

/**
 * Replace placeholders in prompts
 */
export function buildPrompt(
  template: string,
  replacements: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}
