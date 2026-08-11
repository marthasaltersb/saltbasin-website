import { assertAgentLlmBudget, recordAgentLlmUsage } from './agentLlmUsage.js';

// Shared Anthropic tool-calling loop for interactive Agent Hub definitions.
// Route-specific tools and side effects stay outside this module; callers
// provide executeTool so public lead intake and authenticated career review
// can share orchestration without sharing authority or data context.
export async function runInteractiveAgentLoop({
  anthropic,
  agentDefinition,
  llmPolicy,
  systemPrompt,
  tools,
  messages,
  executeTool,
  onToolResult,
}) {
  const maxIterations = Math.max(1, Number(llmPolicy.maxToolIterations || 5));
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    await assertAgentLlmBudget(Number(agentDefinition.id), llmPolicy);
    const response = await anthropic.messages.create({
      model: llmPolicy.model,
      max_tokens: Math.max(256, Math.min(16384, Number(llmPolicy.maxOutputTokensPerResponse || 4096))),
      system: systemPrompt,
      tools,
      messages,
    });
    await recordAgentLlmUsage(Number(agentDefinition.id), llmPolicy, response.usage || {});

    const toolUses = (response.content || []).filter((block) => block.type === 'tool_use');
    if (response.stop_reason !== 'tool_use' || toolUses.length === 0) {
      const reply = (response.content || [])
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .trim();
      return { reply: reply || '…', exhausted: false };
    }

    messages.push({ role: 'assistant', content: response.content });
    const toolResults = [];
    for (const block of toolUses) {
      const result = await executeTool(block.name, block.input || {});
      await onToolResult?.({ block, result });
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
    }
    messages.push({ role: 'user', content: toolResults });
  }

  return { reply: null, exhausted: true };
}
