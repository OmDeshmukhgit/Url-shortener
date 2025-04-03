const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'url-shortener';
const COLLECTION_NAME = 'urls';

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    cachedDb = db;
    return db;
}

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
        const shortCode = event.path.split('/').pop();
        const db = await connectToDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const urlDoc = await collection.findOne({ shortCode });

        if (!urlDoc) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'URL not found' })
            };
        }

        return {
            statusCode: 302,
            headers: {
                ...headers,
                'Location': urlDoc.url
            }
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}; 