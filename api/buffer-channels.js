export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.BUFFER_API_KEY;
  const expiryDate = process.env.BUFFER_API_KEY_EXPIRY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Buffer API key not configured' });
  }

  // Check expiry warning
  let expiryWarning = null;
  if (expiryDate) {
    const daysUntilExpiry = Math.floor((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 30) {
      expiryWarning = `Buffer API key expires in ${daysUntilExpiry} days — please contact Rowan to renew.`;
    }
  }

  const query = `
    query GetChannels {
      channels(input: {}) {
        id
        name
        displayName
        service
        isLocked
      }
    }
  `;

  try {
    const response = await fetch('https://api.buffer.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('Buffer API errors:', JSON.stringify(data.errors));
      return res.status(500).json({ error: data.errors[0]?.message || 'Failed to fetch channels' });
    }

    const channels = (data.data?.channels || [])
      .filter(ch => !ch.isLocked)
      .map(ch => ({
        id: ch.id,
        name: ch.displayName || ch.name,
        service: ch.service,
      }));

    return res.status(200).json({ channels, expiryWarning });
  } catch (error) {
    console.error('Buffer channels error:', error.message);
    return res.status(500).json({ error: 'Failed to connect to Buffer: ' + error.message });
  }
}
