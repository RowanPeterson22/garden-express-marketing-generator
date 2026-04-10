export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { caption, channelIds } = req.body;

  if (!channelIds || channelIds.length === 0) {
    return res.status(400).json({ error: 'At least one channel is required' });
  }

  const apiKey = process.env.BUFFER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Buffer API key not configured' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  const results = [];

  for (const channelId of channelIds) {
    try {
      const mutation = `
        mutation CreatePost {
          createPost(input: {
            text: ${JSON.stringify(caption || '')},
            channelId: "${channelId}",
            schedulingType: automatic,
            mode: addToQueue
          }) {
            ... on PostActionSuccess {
              post {
                id
                text
                dueAt
              }
            }
            ... on MutationError {
              message
            }
          }
        }
      `;

      const postRes = await fetch('https://api.buffer.com', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: mutation }),
      });

      const postData = await postRes.json();
      console.log('Buffer post response:', JSON.stringify(postData));

      if (postData.errors) {
        results.push({ channelId, success: false, error: postData.errors[0]?.message });
      } else if (postData.data?.createPost?.message) {
        results.push({ channelId, success: false, error: postData.data.createPost.message });
      } else if (postData.data?.createPost?.post?.id) {
        results.push({ channelId, success: true });
      } else {
        results.push({ channelId, success: false, error: 'Unexpected response: ' + JSON.stringify(postData) });
      }
    } catch (error) {
      results.push({ channelId, success: false, error: error.message });
    }
  }

  const allSuccess = results.every(r => r.success);
  const anySuccess = results.some(r => r.success);
  const errorMessages = results.filter(r => !r.success).map(r => r.error).join(', ');

  return res.status(200).json({
    success: allSuccess,
    partial: anySuccess && !allSuccess,
    message: allSuccess
      ? 'Added to Buffer queue ✓'
      : anySuccess
        ? 'Some posts added — check Buffer'
        : 'Failed to send to Buffer: ' + errorMessages,
    results,
  });
}
