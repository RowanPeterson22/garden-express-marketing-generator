export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { caption, imageDataUrl, channelIds } = req.body;

  if (!caption || !channelIds || channelIds.length === 0) {
    return res.status(400).json({ error: 'Caption and at least one channel are required' });
  }

  const apiKey = process.env.BUFFER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Buffer API key not configured' });
  }

  try {
    // If we have an image, upload it to Buffer first
    let mediaIds = [];
    if (imageDataUrl) {
      // Convert base64 data URL to buffer
      const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Upload image to Buffer media endpoint
      const uploadRes = await fetch('https://api.bufferapp.com/1/media/upload.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream',
          'X-File-Name': 'garden-express-post.png',
        },
        body: imageBuffer,
      });

      const uploadData = await uploadRes.json();
      if (uploadData.id) {
        mediaIds.push(uploadData.id);
      }
    }

    // Create the post
    const postBody = new URLSearchParams();
    postBody.append('text', caption);
    channelIds.forEach(id => postBody.append('profile_ids[]', id));
    if (mediaIds.length > 0) {
      mediaIds.forEach(id => postBody.append('media[photo_ids][]', id));
    }

    const postRes = await fetch('https://api.bufferapp.com/1/updates/create.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postBody.toString(),
    });

    const postData = await postRes.json();

    if (!postRes.ok || postData.error) {
      return res.status(postRes.status).json({ error: postData.error || 'Failed to send to Buffer' });
    }

    return res.status(200).json({ success: true, message: 'Post added to Buffer queue' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send to Buffer: ' + error.message });
  }
}
