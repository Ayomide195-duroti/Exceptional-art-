exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Must be a logged-in Identity user
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Not authorized' }) };
  }

  let publicId;
  try {
    const body = JSON.parse(event.body || '{}');
    publicId = body.public_id;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }
  if (!publicId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing public_id' }) };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const auth = Buffer.from(apiKey + ':' + apiSecret).toString('base64');
  const url = 'https://api.cloudinary.com/v1_1/' + cloudName + '/resources/image/upload?public_ids[]=' + encodeURIComponent(publicId);

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': 'Basic ' + auth }
    });
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Cloudinary delete failed', detail: data }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true, result: data }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
