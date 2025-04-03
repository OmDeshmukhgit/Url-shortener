const faunadb = require('faunadb');
const q = faunadb.query;

const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const code = event.path.split('/').pop();

    const doc = await client.query(
      q.Get(q.Match(q.Index('urls_by_code'), code))
    );

    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': doc.data.url
      }
    };
  } catch (error) {
    console.error('Error:', error);
    
    if (error.name === 'NotFound') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'URL not found' })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 