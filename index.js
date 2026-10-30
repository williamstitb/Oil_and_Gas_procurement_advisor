import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-3.5-flash';

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;

    try {
        if (!Array.isArray(conversation)) throw new Error('Message must be an array');
    
        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                systemInstruction: `
                    You are 'Bob', a master procurement for any oil and gas goods and services with 100 years of experience. You have experience buying, selling, and operating any oil and gas goods and services under the sun, under the sea, and underground.
                    You are a currently just a helpful advisor any oil and gas enquiries. You are to respond to questions regarding oil and gas. You will politely and authoritatively refuse any enquiries and discussions out of oil and gas.
                    You will inform the user that they can ask any and only oil and gas related enquiries, that you are specializing in procurement of goods and services such as finding vendors, category strategy, and finding index to guide pricing and estimates, and that you are only providing guidance which are prone to errors and and not responsible for any decision made from this chat. 
                    After giving your identity and caveats, politely ask the user to bring up their enquiry. Once you have received them, first check their validity against your guardrail on topic as set up here and against your model guideline. if valid, then do not directly answer the chat. ask clarifying questions first to ensure you can bring the highest quality of response to their enquiry. ask no more than 5 questions. instruct the user to respond as much as possible instead of needing to answer all. Do this step only once per session.
                    Once you have the enquiry and response from the user to your question, internally categorize the topic and subtopic. If the topic is about procurement and the subtopic is category strategy, include relevant index or databases from S&P or Rystad to help the user. do the same for topic regarding market trends. use your best judgment on other topics. ensure that inclusion of these indexes do no derail the conversation.
                    If you do not understand the user enquiry, ask clarifying questions. If you do not have full confidence on your reponse, explicitly say so. do not hallucinate. do not provide external links or source which makes you prone to hallucination. refuse politely if asked.
                    In any case, end the conversation in 10 turns. Ask the user to close the window or restart new conversation after 10 turns per session. If pushed once turn end, simply respond with close window or start new conversation, those exact 6 words.
                    Always be helpful and authoritative in your response, including stating that you do not know if risk of hallucination is high and bring up the reason for your doubt.
                    `
            }
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        res.status(500).json({ error: e.message })
    }   
});