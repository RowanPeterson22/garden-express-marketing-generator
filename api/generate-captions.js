export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { product, price, wasPrice, description, postType, includePrices, stock } = req.body;

  if (!product) {
    return res.status(400).json({ error: 'Product is required' });
  }

  const typePrompts = {
    product: 'Write 3 engaging social media captions featuring this product.',
    sale: 'Write 3 promotional captions highlighting this as a sale or special offer.',
    new: 'Write 3 captions announcing this as an exciting new arrival.',
    seasonal: 'Write 3 seasonal captions tying this product to the current season (consider Australian seasons).',
  };

  const priceInfo = includePrices !== false
    ? `Price: ${price || ''}${wasPrice ? `\nWas: ${wasPrice} (this is a special/sale price — mention the saving)` : ''}`
    : `Price: Do not mention the price in the caption.`;

  const stockInfo = stock !== undefined
    ? stock <= 20
      ? `Stock: Only ${stock} remaining — mention urgency naturally (e.g. "limited stock", "don't miss out", "selling fast")`
      : stock <= 50
        ? `Stock: Low stock (${stock} left) — you may subtly hint at availability if appropriate`
        : `Stock: Good availability — no need to mention stock`
    : '';

  const prompt = `You are a social media copywriter for Garden Express Australia, a premium home and garden nursery.

Brand tone of voice: Warm, knowledgeable and passionate about plants and gardening. Conversational and inspiring — never corporate. Celebrate the joy of gardening, the beauty of plants, and the transformation a great garden brings to people's lives.

Task: ${typePrompts[postType] || typePrompts.product}

Product: ${product}
${priceInfo}
${stockInfo}
Description: ${description || ''}

Rules:
- Each caption is 2-4 sentences
- Include 4-6 relevant hashtags at the end
- End with a gentle call to action
- Reflect Australian gardening seasons and lifestyle where relevant
- Never use exclamation marks excessively — one per caption maximum
- Never use the word "cheap"
- Always use 2-3 emojis per caption, placed naturally inline within the text — not just at the start or end. Choose plant 🌿, garden 🌱, flower 🌸, weather ☀️, food 🍓, or lifestyle emojis that match the product. For elegant or premium products use more refined emojis (🌿🌸🍃) rather than playful ones.

Respond with ONLY a JSON object — no markdown, no explanation, no backticks:
{"captions":["caption one","caption two","caption three"]}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate captions: ' + error.message });
  }
}
