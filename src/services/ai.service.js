const { GoogleGenerativeAI } = require("@google/generative-ai");


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


const AIService = {


    cleanJSON: (text) => {
        try {
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            console.error("AI JSON Parse Error:", text);
            throw new Error("AI generated invalid JSON. Please try again.");
        }
    },


    // --- SCENARIO 1: AI ONLY (TOPIC BASED) ---
    generateQuestionsFromTopics: async (subject, topics, difficulty, count) => {
        const prompt = `
            Act as a teacher. Create ${count} multiple-choice questions for ${difficulty} level students.
            Subject: ${subject}
            Topics: ${topics.join(', ')}


            Strictly output a valid JSON Array with objects having these keys:
            - question_text
            - option_a
            - option_b
            - option_c
            - option_d
            - correct_option (Must be 'A', 'B', 'C', or 'D')
            - explanation


            Do not include any intro text.
        `;
        const result = await model.generateContent(prompt);
        return AIService.cleanJSON(result.response.text());
    },


    // --- SCENARIO 2: PDF GENERATION ---
    generateQuestionsFromPDF: async (rawText, count, subject, difficulty, topics) => {
        const contextText = rawText.substring(0, 15000);


        let guidance = "";
        if (subject) guidance += `Focus specifically on the subject: "${subject}". `;
        if (topics && topics.length > 0) guidance += `Prioritize questions related to these topics: ${topics.join(', ')}. `;


        const prompt = `
            Context: The following text is from a past question paper or study material:
            "${contextText}"


            Task: Generate ${count} multiple-choice questions based on the text above.
            ${guidance}
            Difficulty: ${difficulty}.


            Strictly output a valid JSON Array with objects:
            - question_text
            - option_a
            - option_b
            - option_c
            - option_d
            - correct_option ('A', 'B', 'C', 'D')
            - explanation


            Do not include any intro text.
        `;


        const result = await model.generateContent(prompt);
        return AIService.cleanJSON(result.response.text());
    }
};


module.exports = AIService;




