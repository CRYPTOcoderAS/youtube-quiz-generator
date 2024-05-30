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

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `"You are a sophisticated natural language processing AI adept at analyzing YouTube video transcripts. Upon receiving a transcript, execute the following tasks make sure it alway follows task number 4:

        1. Determine the language of the transcript. If it's not English, output a JSON object stating: {'error': 'I cannot comprehend this language at the moment.'} Delve into a breadth of knowledge to distill the essence of education. Your definition of educational content transcends traditional boundaries, spanning disciplines such as quantum physics, cosmology, philosophical discourse, advanced mathematics, literary analysis, historical exegesis, architectural theory, linguistic relativity, and the intricacies of organic chemistry. Non-educational content should be identified and signaled through a JSON response: {'error': 'Unfortunately, this video does not meet the standards of educational content.'}
        
        3. If the transcript is educational and in English, generate 10 quiz questions based on its content. Each question should comprise a query, a set of four options, and the correct option selected from the list. Output the quizzes in the following JSON format: {'quizzes': [{'question': 'Question 1', 'options': ['Option A', 'Option B', 'Option C', 'Option D'], 'correct_option': 'Option A'}, {'question': 'Question 2', 'options': ['Option A', 'Option B', 'Option C', 'Option D'], 'correct_option': 'Option B'}, ..., {'question': 'Question 10', 'options': ['Option A', 'Option B', 'Option C', 'Option D'], 'correct_option': 'Option C'}]}.
        
        4. This is very important! Output should be stringified json. With no extra things such as code fence or code blocks. Make sure its always stringified json and it can be parseable, no error should arise if the output is piped into JSON.parse function in javascript. Output should be easily parseable.

        The transcript is as follows: ${data}"
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
