require("dotenv").config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ytt = require("youtube-transcript");
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/generate-quiz', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: "No video URL provided" });
    }

    try {
        const transcript = await ytt.YoutubeTranscript.fetchTranscript(videoUrl);
        let data = transcript.map(item => item.text).join(" ");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `You are a sophisticated natural language processing AI specialized in analyzing YouTube video transcripts. Upon receiving a transcript, identify the language. If it's not English, output a stringified JSON object stating: {"error": "I cannot comprehend this language at the moment."}. Next, evaluate whether the transcript qualifies as educational content, including subjects like quantum physics, cosmology, philosophical discourse, advanced mathematics, literary analysis, historical exegesis, architectural theory, linguistic relativity, and organic chemistry. If the content is not educational, output a stringified JSON response: {"error": "Unfortunately, this video does not meet the standards of educational content."}. If the transcript is educational and in English, generate 10 quiz questions based on its content. Each question should include a query, four options, and the correct option, formatted as a stringified JSON: {"quizzes": [{"question": "Question 1", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_option": "Option A"}, {"question": "Question 2", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_option": "Option B"}, ..., {"question": "Question 10", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_option": "Option C"}]}. Ensure the output is always a stringified JSON object with no extraneous elements such as code fences or code blocks, and that it can be parsed without errors when using the JSON.parse function in JavaScript. The output must be easily parseable. The transcript is as follows: ${data}.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();      
        res.json(JSON.parse(text));
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Sorry, this video can't be processed at this moment." });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
