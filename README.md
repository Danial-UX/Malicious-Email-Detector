# Malicious Email Detector Chrome Extension

A Chrome extension that leverages **Google Gemini Flash 2.5 LLM** and rule based analysis to automatically detect potential phishing attempts in emails.

The tool supports user's manual inspection of emails directly in your browser, applying both automated semantics and advanced language context provided by Gemini AI.
## **Key Features**

- **AI Powered Contextual Detection**  
  Uses Gemini Flash 2.5 Large Language Model to interpret the intent and tone of emails, identifying manipulative or deceptive communication patterns.

- **RealTime Risk Assessment**  
  Instantly categorises emails as **High**, **Suspicious**, or **Low** risk with explanations.

- **Detailed Diagnostics**  
  Highlights indicators such as suspicious links, mismatched senders, and urgency keywords.

- **Actionable Recommendations**  
  Provides practical guidance to help users verify authenticity and respond safely.

- **Local and Secure Operation**  
  Runs entirely in the browser – no email data is stored, transmitted, or logged externally.

---

## **How It Works**

https://github.com/user-attachments/assets/61930b7c-4e60-48cc-afab-faf5b7b5d6cb

1. **Content Capture**  
   The extension extracts key email elements such as the sender’s address, subject line, body text, and embedded links.  

2. **Pattern Based Rule Checking**  
   Applies semantic and heuristic rules to flag high-risk patterns like:
   - Domain mismatches (e.g., spoofing legitimate sites)
   - Urgent or coercive language
   - Common phishing phrases and structures
   - Suspicious or shortened URLs  

3. **AI Powered Context Analysis**  
   Gemini Flash 2.5 evaluates the semantic meaning and tone of the email to determine potential manipulation or malicious intent, reducing false positives.

4. **Risk Evaluation and Reporting**  
   Displays a Coloured Rating System:
   - 🔴 **High Risk** – Strong indicators of phishing or impersonation.  
   - 🟡 **Suspicious** – Requires user caution and manual verification.  
   - 🟢 **Low Risk** – No significant red flags identified.  

5. **Security Recommendations**  
   Provides context-specific advice (e.g., “Hover to inspect link,” “Verify sender via another channel,” or “Do not download attachments”).

---

## **Installation Guide**

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Danial-UX/Malicious-Email-Detector.git
   ```
2. **Configure your API key:**
   - Obtain a Gemini API key from the [Google AI Studio](https://aistudio.google.com/api-keys)
   -  In your extension directory:
   - Copy the template configuration file:
     ```bash
     cp config.template.js config.js
     ```
   - Edit `config.js` and replace `'your_api_key_here'` with your actual API key
   - Keep `config.js` in `.gitignore` to protect your API key

3. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

