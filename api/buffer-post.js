export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { caption, imageDataUrl, channelIds } = req.body;

  if (!channelIds || channelIds.length === 0) {
    return res.status(400).json({ error: 'At least one channel is required' });
  }

  const apiKey = process.env.BUFFER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Buffer API key not configured' });
  }

  const results = [];

  for (const channelId of channelIds) {
    try {
      // Build assets array if image provided
      let assetsBlock = '';
      if (imageDataUrl) {
        const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
        // Upload image first
        const uploadQuery = `
          mutation UploadMedia($input: UploadMediaInput!) {
            uploadMedia(input: $input) {
              ... on UploadMediaSuccess {
                mediaId
              }
              ... on MutationError {
                message
              }
            }
          }
        `;

        const uploadRes = await fetch('https://api.buffer.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            query: uploadQuery,
            variables: {
              input: {
                base64: base64Data,
                mimeType: 'image/png',
                fileName: 'garden-express-post.png',
              }
            }
          }),
        });

        const uploadData = await uploadRes.json();
        const mediaId = uploadData.data?.uploadMedia?.mediaId;
        if (mediaId) {
          assetsBlock = `mediaFileIds: ["${mediaId}"]`;
        }
      }

      // Create the post
      const mutation = `
        mutation CreatePost {
          createPost(input: {
            text: ${JSON.stringify(caption || '')},
            channelId: "${channelId}",
            schedulingType: automatic,
            mode: addToQueue
            ${assetsBlock ? `, ${assetsBlock}` : ''}
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ query: mutation }),
      });

      const postData = await postRes.json();

      if (postData.errors) {
        results.push({ channelId, success: false, error: postData.errors[0]?.message });
      } else if (postData.data?.createPost?.message) {
        results.push({ channelId, success: false, error: postData.data.createPost.message });
      } else {
        results.push({ channelId, success: true });
      }
    } catch (error) {
      results.push({ channelId, success: false, error: error.message });
    }
  }

  const allSuccess = results.every(r => r.success);
  const anySuccess = results.some(r => r.success);

  return res.status(200).json({
    success: allSuccess,
    partial: anySuccess && !allSuccess,
    message: allSuccess
      ? 'Added to Buffer queue ✓'
      : anySuccess
        ? 'Some posts added to Buffer — check results'
        : 'Failed to send to Buffer',
    results,
  });
}
