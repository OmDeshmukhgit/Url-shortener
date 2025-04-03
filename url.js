import { readFile, writeFile } from "fs/promises";
import { createServer } from "http";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3002;
const DATA_FILE = path.join(__dirname, "data", "links.json");

const readFileHandler = async (filePath, res, contentType) => {
    try {
        const data = await readFile(filePath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    } catch (error) {
        console.error(`Error reading file: ${error}`);
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end('404 page not found');
    }
};

const loadlinks = async () => {
    try {
        const data = await readFile(DATA_FILE, "utf-8");

        if (!data.trim()) {
            return {};
        }

        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {
            await writeFile(DATA_FILE, JSON.stringify({}));
            return {};
        }
        console.error(`Error loading links: ${error}`);
        throw error;
    }
};

const savelinks = async (links) => {
    try {
        await writeFile(DATA_FILE, JSON.stringify(links));
    } catch (error) {
        console.error(`Error saving links: ${error}`);
        throw error;
    }
};

const server = createServer(async (req, res) => {
    if (req.method === "GET") {
        if (req.url === "/") {
            await readFileHandler(path.join(__dirname, "public", 'index.html'), res, "text/html");
        } else if (req.url === "/index.css") {
            await readFileHandler(path.join(__dirname, "public", 'index.css'), res, "text/css");
        } else if (req.url === "/links") {
            try {
                const links = await loadlinks();
                res.writeHead(200, { "Content-Type": "application/json" });
                return res.end(JSON.stringify(links));
            } catch (error) {
                console.error(`Error handling /links request: ${error}`);
                res.writeHead(500, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Internal Server Error" }));
            }
        } else {
            // Handle redirects
            try {
                const shortCode = req.url.slice(1); // Remove leading slash
                const links = await loadlinks();
                const longUrl = links[shortCode];

                if (longUrl) {
                    res.writeHead(302, { Location: longUrl });
                    res.end();
                } else {
                    res.writeHead(404, { "Content-Type": "text/html" });
                    res.end('404 - URL not found');
                }
            } catch (error) {
                console.error(`Error handling redirect: ${error}`);
                res.writeHead(500, { "Content-Type": "text/html" });
                res.end('500 - Internal Server Error');
            }
        }
    }

    if (req.method === "POST" && req.url === "/shorten") {
        try {
            const links = await loadlinks();
            let body = '';

            req.on("data", (chunk) => (body += chunk));

            req.on("end", async () => {
                const { url, shortCode } = JSON.parse(body);

                if (!url) {
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    return res.end('URL is required');
                }

                const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

                if (links[finalShortCode]) {
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    return res.end('Short code already exists, please choose another');
                }

                links[finalShortCode] = url;
                await savelinks(links);

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, shortCode: finalShortCode }));
            });
        } catch (error) {
            console.error(`Error handling /shorten request: ${error}`);
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Internal Server Error" }));
        }
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 