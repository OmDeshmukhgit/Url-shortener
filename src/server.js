import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { loadLinks, saveLinks, generateShortCode } from './services/urlService.js';

// Get the directory name using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3002;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Handle shortened URLs
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const links = await loadLinks();
    
    if (links[shortCode]) {
      // Redirect to the original URL
      return res.redirect(links[shortCode]);
    } else {
      // Handle 404 for non-existent short codes
      res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
    }
  } catch (error) {
    console.error(`Error handling redirect: ${error}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/links', async (req, res) => {
  try {
    console.log('Fetching links...');
    const links = await loadLinks();
    console.log('Links loaded:', links);
    res.json(links);
  } catch (error) {
    console.error(`Error handling /links request: ${error}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/shorten', async (req, res) => {
  try {
    const { url, shortCode } = req.body;

    if (!url) {
      return res.status(400).send('URL is required');
    }

    const links = await loadLinks();
    const finalShortCode = generateShortCode(shortCode);

    if (links[finalShortCode]) {
      return res.status(400).send('Short code already exists, please choose another');
    }

    links[finalShortCode] = url;
    await saveLinks(links);

    res.json({ success: true, shortCode: finalShortCode });
  } catch (error) {
    console.error(`Error handling /shorten request: ${error}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 