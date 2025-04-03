import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from "crypto";

// Get the directory name using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use the correct path to the data file
const DATA_FILE = path.join(__dirname, "../../data/links.json");

export const loadLinks = async () => {
    try {
        console.log('Loading links from:', DATA_FILE);
        const data = await readFile(DATA_FILE, "utf-8");
        console.log('Raw data:', data);

        if (!data.trim()) {
            console.log('Empty data, returning empty object');
            return {};
        }

        const parsedData = JSON.parse(data);
        console.log('Parsed data:', parsedData);
        return parsedData;
    } catch (error) {
        console.error(`Error loading links: ${error}`);
        if (error.code === "ENOENT") {
            console.log('File not found, creating empty file');
            await writeFile(DATA_FILE, JSON.stringify({}));
            return {};
        }
        throw error;
    }
};

export const saveLinks = async (links) => {
    try {
        await writeFile(DATA_FILE, JSON.stringify(links));
    } catch (error) {
        console.error(`Error saving links: ${error}`);
        throw error;
    }
};

export const generateShortCode = (customCode = null) => {
    return customCode || crypto.randomBytes(4).toString("hex");
}; 