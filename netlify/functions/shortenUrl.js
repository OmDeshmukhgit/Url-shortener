const crypto = require('crypto');
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

        const db = await connectToDatabase();
        const collection = db.collection(COLLECTION_NAME);

        // Generate short code if not provided
        const finalShortCode = shortCode || crypto.randomBytes(4).toString('hex');

        // Check if short code already exists
        const existing = await collection.findOne({ shortCode: finalShortCode });
        if (existing) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Short code already exists' })
            };
        }

        // Save the new URL
        await collection.insertOne({
            url,
            shortCode: finalShortCode,
            createdAt: new Date()
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                shortCode: finalShortCode
            })
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