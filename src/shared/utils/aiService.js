
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const AIService = {


    // --- GENERATE STUDY TIPS (With Fallback) ---
    generateStudyTips: async (weakTopics) => {
        if (!weakTopics || weakTopics.length === 0) return [];


        // 1. Prepare Data
        const limitedTopics = weakTopics.slice(0, 3);
        const topicsStr = limitedTopics.map(t => t.topic_name).join(", ");


        // 2. Strict Prompt
        const prompt = `
        Task: Provide 2 short study tips for these topics: ${topicsStr}.
        Output Format: Strictly a JSON Array of objects. No Markdown. No code blocks.
        Example: [{"topic": "Algebra", "tips": ["Review formulas", "Solve 5 problems"]}]
        `;


        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(prompt);
            const response = result.response;
            let text = response.text();


            // 3. Debug Log (Check your terminal to see what AI actually sent)
            console.log("AI Raw Response:", text);


            // 4. Clean & Extract JSON
            // Remove markdown code blocks if present
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();


            // Extract substring between first '[' and last ']'
            const firstBracket = text.indexOf('[');
            const lastBracket = text.lastIndexOf(']');


            if (firstBracket !== -1 && lastBracket !== -1) {
                const jsonStr = text.substring(firstBracket, lastBracket + 1);
                return JSON.parse(jsonStr);
            } else {
                throw new Error("No JSON array found in response");
            }


        } catch (error) {
            console.error("AI Tips Failed, using fallback. Reason:", error.message);


            // 5. FALLBACK: Generate generic tips so UI is never empty
            return limitedTopics.map(t => ({
                topic: t.topic_name,
                tips: [
                    `Review key concepts for ${t.topic_name}.`,
                    "Practice 5-10 questions daily to improve accuracy."
                ]
            }));
        }
    },


    // --- GENERATE DAILY CARD ---
    generateDailyRecommendation: async (weakestTopic) => {
        if (!weakestTopic) return "Great job! You have no weak areas today. Keep practicing.";


        const topic = weakestTopic.topic_name;


        // Simple prompt to reduce error chance
        const prompt = `Write one short sentence advising a student to study ${topic}.`;


        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            // Fallback if AI fails
            return `Focus on ${topic} today to improve your score.`;
        }
    }
};


module.exports = AIService;



















