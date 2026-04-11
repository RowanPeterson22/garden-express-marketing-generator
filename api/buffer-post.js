import { put, del } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { caption, imageDataUrl, channelIds, channelServices, canvasLabel } = req.body;

  if (!channelIds || channelIds.length === 0) {
    return res.status(400).json({ error: 'At least one channel is required' });
  }

  if (!caption?.trim() && !imageDataUrl) {
    return res.status(400).json({ error: 'A caption or image is required to post to Buffer' });
  }

  const apiKey = process.env.BUFFER_API_KEY_VB || process.env.BUFFER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Buffer API key not configured' });
  }

  // Map canvas size to Buffer post type
  const postType = canvasLabel === 'Story 9:16' ? 'story' : 'post';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  // Upload image to Vercel Blob if provided
  let imageUrl = null;
  let blobUrl = null;

  if (imageDataUrl) {
    try {
      const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const filename = `ge-social-${Date.now()}.png`;

      const blob = await put(filename, imageBuffer, {
        access: 'public',
        contentType: 'image/png',
      });

      imageUrl = blob.url;
      blobUrl = blob.url;
      console.log('Uploaded to Vercel Blob:', imageUrl);
    } catch (e) {
      console.error('Blob upload failed:', e.message);
      return res.status(500).json({ error: 'Failed to upload image: ' + e.message });
    }
  }

  const results = [];

  for (let i = 0; i < channelIds.length; i++) {
    const channelId = channelIds[i];
    const service = channelServices?.[i] || 'instagram';

    try {
      // Build metadata block based on platform
      let metadataBlock = '';
      if (service === 'instagram') {
        metadataBlock = `metadata: { instagram: { type: ${postType}, shouldShareToFeed: true } }`;
      } else if (service === 'facebook') {
        metadataBlock = `metadata: { facebook: { type: ${postType} } }`;
      }

      const assetsBlock = imageUrl
        ? `assets: { images: [{ url: "${imageUrl}" }] }`
        : '';

      const mutation = `
        mutation CreatePost {
          createPost(input: {
            text: ${JSON.stringify((caption || '').trim())},
            channelId: "${channelId}",
            schedulingType: automatic,
            mode: addToQueue
            ${assetsBlock}
            ${metadataBlock}
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

  // Clean up blob after 30 seconds
  if (blobUrl) {
    setTimeout(async () => {
      try {
        await del(blobUrl);
        console.log('Cleaned up blob:', blobUrl);
      } catch (e) {
        console.error('Blob cleanup failed:', e.message);
      }
    }, 30000);
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
