import { Hono } from 'hono';
import type { Env } from '../index';
import { requireAuth } from './middleware';

export const parseRoutes = new Hono<{ Bindings: Env }>();

parseRoutes.use('/parse', requireAuth);

parseRoutes.post('/parse', async (c) => {
  const body = await c.req.json<{ text?: string }>();
  if (!body.text?.trim()) {
    return c.json({ error: 'text is required' }, 400);
  }

  const prompt = `Extract the recipe from the following text and return this exact JSON shape:

{
  "ingredients": [
    { "amount": number, "unit": "g|kg|ml|l|tbsp|tsp|cup|piece|null", "name": "string", "remark": "string|null" }
  ],
  "procedure": ["step 1", "step 2"]
}

Rules:
- unit must be one of: g, kg, ml, l, tbsp, tsp, cup, piece — or null for countable items (onion, clove, slice)
- Map German units: EL → tbsp, TL → tsp, g → g, kg → kg, ml → ml, l → l
- For range amounts (e.g. "350 bis 400 g", "1-2") use the higher value
- Split compound lines ("2 tsp A and 2 tsp B") into separate ingredient objects; if the parenthetical at the end applies to all split items, copy it to each
- Extract preparation notes like "(gerieben)", "(abgetropft und abgespült)" into the remark field; remove them from name
- Discard parentheticals that only clarify weight or volume (e.g. "(800 g mit Flüssigkeit)") — these contain numbers and are not useful for preparation
- If multiple qualifying parentheticals remain, join them with "; "
- Omit the remark field entirely when there is no preparation note
- Omit the unit field entirely when null
- Ignore any non-recipe content (navigation links, article teasers, author names)
- Procedure: split at logical action boundaries; each step is a complete sentence or short group of related sentences

Text:
${body.text}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': c.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: 'You are a recipe parser. Extract structured data from recipe text and return ONLY valid JSON — no markdown, no explanation.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    return c.json({ error: 'Parse service unavailable' }, 502);
  }

  const data = await response.json() as { content: Array<{ text: string }> };
  const rawText = data.content?.[0]?.text ?? '';

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return c.json({ error: 'Failed to parse recipe structure' }, 422);
  }

  const result = parsed as { ingredients?: unknown[]; procedure?: unknown[] };
  if (!Array.isArray(result.ingredients) || !Array.isArray(result.procedure)) {
    return c.json({ error: 'Invalid recipe structure returned' }, 422);
  }

  return c.json(result);
});
