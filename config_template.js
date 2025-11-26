// Copy this file to config.js and replace the placeholder with your actual API key

const config = {
    // Get your API key from https://aistudio.google.com
    GEMINI_API_KEY: 'your-api-key-here',
    GEMINI_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else {
    window.config = config;
} 