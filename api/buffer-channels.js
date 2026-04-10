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

  try {
    const response = await fetch('https://api.bufferapp.com/1/profiles.json', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Failed to fetch Buffer channels' });
    }

    const channels = data.map(profile => ({
      id: profile.id,
      name: profile.formatted_username,
      service: profile.service,
      avatar: profile.avatar_https,
    }));

    return res.status(200).json({ channels, expiryWarning });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to connect to Buffer: ' + error.message });
  }
}
