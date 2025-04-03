const crypto = require('crypto');
const faunadb = require('faunadb');
const q = faunadb.query;

// Initialize the FaunaDB client
const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { url, shortCode } = JSON.parse(event.body);

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' })
      };
    }

    // Generate short code if not provided
    const finalShortCode = shortCode || crypto.randomBytes(4).toString('hex');

    // Check if short code already exists
    try {
      const existingDoc = await client.query(
        q.Get(q.Match(q.Index('urls_by_code'), finalShortCode))
      );
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Short code already exists' })
      };
    } catch (err) {
      // If document doesn't exist, proceed with creation
      if (err.name === 'NotFound') {
        const result = await client.query(
          q.Create(q.Collection('urls'), {
            data: {
              url: url,
              code: finalShortCode,
              createdAt: Date.now()
            }
          })
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            shortCode: finalShortCode
          })
        };
      }
      throw err;
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 