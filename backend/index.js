import express from 'express';
import uniqid from 'uniqid';
import fs from 'fs';
import cors from 'cors';
import { GPTScript, RunEventType } from "@gptscript-ai/gptscript";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const g = new GPTScript({
  apiKey: process.env.GEMINI_API_KEY
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
app.use(cors());

app.get('/test', (req, res) => {
  return res.json('test ok');
});

app.get('/create-story', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  const dir = uniqid();
  const path = './stories/' + dir;
  fs.mkdirSync(path, { recursive: true });
  console.log({ url });

  try {
    console.log('about to generate content using Gemini API');
    const prompt = `Browse to ${url} and read the page contents. Create a tldr text version of it for an Instagram reel or a TikTok video. No emojis, max 100 words. Split the created text into 3 parts.`;
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    const parts = content.split('\n').filter(part => part.trim() !== '');
    const part1 = parts.slice(0, 1).join(' ');
    const part2 = parts.slice(1, 2).join(' ');
    const part3 = parts.slice(2).join(' ');

    fs.writeFileSync(`${path}/story-1.txt`, part1);
    fs.writeFileSync(`${path}/story-2.txt`, part2);
    fs.writeFileSync(`${path}/story-3.txt`, part3);

    return res.json({ status: 'ok', message: 'Content generated and saved successfully' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to generate content using Gemini API', details: e.message });
  }
});

app.get('/generate-haiku', async (req, res) => {
  try {
    const prompt = "write a haiku about ai";
    const result = await model.generateContent(prompt);
    return res.json(result.response.text());
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to generate haiku', details: e.message });
  }
});

app.listen(8080, () => console.log('Listening on port 8080'));