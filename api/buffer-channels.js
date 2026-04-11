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

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  try {
    // Step 1: Get the organisation ID
    const orgRes = await fetch('https://api.buffer.com', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `query { account { currentOrganization { id name } } }`,
      }),
    });

    const orgData = await orgRes.json();
    console.log('Buffer org response:', JSON.stringify(orgData));

    if (orgData.errors) {
      return res.status(500).json({ error: orgData.errors[0]?.message || 'Failed to fetch organisation' });
    }

    const orgId = orgData.data?.account?.currentOrganization?.id;
    if (!orgId) {
      return res.status(500).json({ error: 'Could not find Buffer organisation ID' });
    }

    // Step 2: Get channels for this organisation
    const channelsRes = await fetch('https://api.buffer.com', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `
          query GetChannels {
            channels(input: { organizationId: "${orgId}" }) {
              id
              name
              displayName
              service
              isLocked
            }
          }
        `,
      }),
    });

    const channelsData = await channelsRes.json();
    console.log('Buffer channels response:', JSON.stringify(channelsData));

    if (channelsData.errors) {
      return res.status(500).json({ error: channelsData.errors[0]?.message || 'Failed to fetch channels' });
    }

    const allowedIds = process.env.BUFFER_CHANNEL_IDS_VB
      ? process.env.BUFFER_CHANNEL_IDS_VB.split(',').map(id => id.trim())
      : null;

    const defaultBrand = process.env.BUFFER_DEFAULT_BRAND || 'garden_express';

    const channels = (channelsData.data?.channels || [])
      .filter(ch => !ch.isLocked)
      .filter(ch => !allowedIds || allowedIds.includes(ch.id))
      .filter(ch => ch.name.toLowerCase().includes(defaultBrand.toLowerCase()) || (ch.displayName || '').toLowerCase().includes(defaultBrand.toLowerCase()))
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
