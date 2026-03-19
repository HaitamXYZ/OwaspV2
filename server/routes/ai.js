const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// POST /api/ai/recommendations
router.post('/recommendations', async (req, res) => {
    try {
        const { missingControls } = req.body;
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'GROQ_API_KEY environment variable is not configured on the server.' });
        }

        if (!missingControls || missingControls.length === 0) {
            return res.json({ recommendations: [] });
        }

        // Use Groq's OpenAI-compatible API
        const groq = new OpenAI({
            apiKey,
            baseURL: 'https://api.groq.com/openai/v1'
        });

        // Batch controls to avoid token limits (max 10 at a time)
        const batchSize = 10;
        const controlsToProcess = missingControls.slice(0, batchSize);

        const prompt = `You are a cybersecurity expert specializing in application security.
Analyze the following missing OWASP ASVS security controls and provide detailed implementation recommendations for each.

Missing Controls:
${JSON.stringify(controlsToProcess, null, 2)}

For EACH missing control, provide a response in the following JSON format. Return ONLY a valid JSON array, no markdown:
[
  {
    "control_id": "the control ID",
    "title": "descriptive title for the control",
    "what_to_implement": "clear explanation of what this security control requires",
    "how_to_implement": "step-by-step implementation guide with specific technical details",
    "best_practices": "industry best practices and common pitfalls to avoid",
    "example": "a practical code example or configuration snippet demonstrating the implementation"
  }
]

Be specific, practical, and provide actionable guidance developers can immediately use.`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are a cybersecurity expert. Always respond with valid JSON only, no markdown formatting.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4000
        });

        const responseText = completion.choices[0].message.content;

        // Parse the AI response
        let recommendations;
        try {
            // Remove possible markdown code block wrapping
            let cleaned = responseText.trim();
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.slice(7);
            } else if (cleaned.startsWith('```')) {
                cleaned = cleaned.slice(3);
            }
            if (cleaned.endsWith('```')) {
                cleaned = cleaned.slice(0, -3);
            }
            recommendations = JSON.parse(cleaned.trim());
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            recommendations = [{
                control_id: 'parse_error',
                title: 'AI Response',
                what_to_implement: responseText,
                how_to_implement: 'Please try again',
                best_practices: '',
                example: ''
            }];
        }

        res.json({
            recommendations,
            processedCount: controlsToProcess.length,
            totalMissing: missingControls.length
        });
    } catch (error) {
        console.error('AI recommendation error:', error);

        let userMessage = 'Failed to generate recommendations';
        let statusCode = 500;

        const errMsg = error.message || '';
        const errStatus = error.status || 0;

        if (errStatus === 401 || errMsg.includes('Invalid API Key') || errMsg.includes('invalid_api_key')) {
            userMessage = 'Invalid API key. Please check your Groq API key in Settings.';
            statusCode = 401;
        } else if (errStatus === 429 || errMsg.includes('Rate limit') || errMsg.includes('quota')) {
            userMessage = 'Groq rate limit reached. Please wait a moment and try again.';
            statusCode = 429;
        } else if (errMsg.includes('model') || errStatus === 404) {
            userMessage = 'Model not available. Please try again later.';
            statusCode = 404;
        }

        res.status(statusCode).json({
            error: userMessage,
            details: errMsg
        });
    }
});

module.exports = router;

