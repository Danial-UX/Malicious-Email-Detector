// Function to extract email content based on the email provider
function extractEmailContent() {
    let emailContent = {
        subject: '',
        body: '',
        sender: '',
        links: [],
        attachments: []
    };

    console.log('Starting email content extraction...');

    // Add debug logging
    debugAttachments(emailContent.attachments);

    // Gmail
    if (window.location.hostname.includes('mail.google.com')) {
        // Get email subject
        const subjectElement = document.querySelector('h2.hP');
        if (subjectElement) {
            emailContent.subject = subjectElement.textContent.trim();
        }

        // Get email body
        const bodySelectors = ['.a3s.aiL', '.a3s.aiL .ii.gt', '.ii.gt'];
        let bodyElement = null;
        
        for (const selector of bodySelectors) {
            bodyElement = document.querySelector(selector);
            if (bodyElement) break;
        }

        if (bodyElement) {
            emailContent.body = bodyElement.innerText.trim();
            
            // Get all links
            const links = bodyElement.querySelectorAll('a');
            links.forEach(link => {
                if (link.href && !link.href.startsWith('mailto:')) {
                    emailContent.links.push({
                        url: link.href,
                        text: link.textContent.trim()
                    });
                }
            });
        }

        // Get sender
        const senderSelectors = ['.gD', '.go', '[email]', '.from'];
        let senderElement = null;

        for (const selector of senderSelectors) {
            senderElement = document.querySelector(selector);
            if (senderElement) break;
        }        if (senderElement) {
            emailContent.sender = senderElement.getAttribute('email') || senderElement.textContent.trim();
        }

        // Get attachments for Gmail
        const attachmentSelectors = [
            '.aZo',  // Gmail attachment container
            '.aZp',  // Alternative Gmail attachment selector
            '.attachment',
            '[role="listitem"] span[title*="Download"]',
            '.J-N-JX'  // Gmail's span element for attachments
        ];

        attachmentSelectors.forEach(selector => {
            const attachmentElements = document.querySelectorAll(selector);
            attachmentElements.forEach(element => {
                // Extract attachment information
                let fileName = '';
                let fileSize = '';
                let downloadUrl = '';

                // Try to get filename from various attributes and text content
                fileName = element.getAttribute('data-tooltip') || 
                          element.getAttribute('title') || 
                          element.textContent.trim() ||
                          element.querySelector('span[title]')?.getAttribute('title') ||
                          '';

                // Extract file size if available
                const sizeElement = element.querySelector('.aZm') || 
                                  element.querySelector('.attachment-size') ||
                                  element.nextElementSibling;
                if (sizeElement) {
                    fileSize = sizeElement.textContent.trim();
                }

                // Get download link
                const linkElement = element.querySelector('a') || element.closest('a');
                if (linkElement) {
                    downloadUrl = linkElement.href || '';
                }

                if (fileName || element.textContent.includes('.')) {
                    emailContent.attachments.push({
                        fileName: fileName || 'Unknown attachment',
                        fileSize: fileSize,
                        downloadUrl: downloadUrl,
                        element: element.outerHTML
                    });
                }
            });
        });
    }

    // Outlook email providers
    else if (window.location.hostname.includes('outlook')) {
        // Get email subject for Outlook
        const subjectSelectors = ['[role="heading"]', '.rps_d3b2', 'h1'];
        let subjectElement = null;
        
        for (const selector of subjectSelectors) {
            subjectElement = document.querySelector(selector);
            if (subjectElement) break;
        }
        
        if (subjectElement) {
            emailContent.subject = subjectElement.textContent.trim();
        }

        // Get email body for Outlook
        const bodySelectors = ['.rps_1679', '[role="main"]', '.emailBody'];
        let bodyElement = null;
        
        for (const selector of bodySelectors) {
            bodyElement = document.querySelector(selector);
            if (bodyElement) break;
        }

        if (bodyElement) {
            emailContent.body = bodyElement.innerText.trim();
            
            // Get all links
            const links = bodyElement.querySelectorAll('a');
            links.forEach(link => {
                if (link.href && !link.href.startsWith('mailto:')) {
                    emailContent.links.push({
                        url: link.href,
                        text: link.textContent.trim()
                    });
                }
            });
        }

        // Get sender for Outlook
        const senderSelectors = ['.rps_b9c4', '[data-testid="sender-name"]'];
        let senderElement = null;

        for (const selector of senderSelectors) {
            senderElement = document.querySelector(selector);
            if (senderElement) break;
        }

        if (senderElement) {
            emailContent.sender = senderElement.textContent.trim();
        }

        // Get attachments for Outlook
        const outlookAttachmentSelectors = [
            '.attachment',
            '[data-testid="attachment"]',
            '.rps_attachment',
            '[role="button"][aria-label*="attachment"]',
            '[title*="Download"]'
        ];

        outlookAttachmentSelectors.forEach(selector => {
            const attachmentElements = document.querySelectorAll(selector);
            attachmentElements.forEach(element => {
                let fileName = element.getAttribute('aria-label') || 
                              element.getAttribute('title') ||
                              element.textContent.trim() ||
                              '';

                let fileSize = '';
                const sizeMatch = fileName.match(/\(([^)]+)\)$/);
                if (sizeMatch) {
                    fileSize = sizeMatch[1];
                    fileName = fileName.replace(/\s*\([^)]+\)$/, '');
                }

                if (fileName) {
                    emailContent.attachments.push({
                        fileName: fileName,
                        fileSize: fileSize,
                        downloadUrl: element.href || '',
                        element: element.outerHTML
                    });
                }
            });
        });
    }

    // Yahoo Mail
    else if (window.location.hostname.includes('yahoo')) {
        // Get email subject for Yahoo
        const subjectElement = document.querySelector('[data-test-id="message-subject"]');
        if (subjectElement) {
            emailContent.subject = subjectElement.textContent.trim();
        }

        // Get email body for Yahoo
        const bodyElement = document.querySelector('[data-test-id="message-view-body-content"]');
        if (bodyElement) {
            emailContent.body = bodyElement.innerText.trim();
            
            // Get all links
            const links = bodyElement.querySelectorAll('a');
            links.forEach(link => {
                if (link.href && !link.href.startsWith('mailto:')) {
                    emailContent.links.push({
                        url: link.href,
                        text: link.textContent.trim()
                    });
                }
            });
        }

        // Get sender for Yahoo
        const senderElement = document.querySelector('[data-test-id="message-from-display-name"]');
        if (senderElement) {
            emailContent.sender = senderElement.textContent.trim();
        }

        // Get attachments for Yahoo
        const yahooAttachmentSelectors = [
            '[data-test-id*="attachment"]',
            '.attachment-item',
            '[role="button"][aria-label*="Download"]'
        ];

        yahooAttachmentSelectors.forEach(selector => {
            const attachmentElements = document.querySelectorAll(selector);
            attachmentElements.forEach(element => {
                let fileName = element.getAttribute('aria-label') || 
                              element.textContent.trim() ||
                              '';

                if (fileName) {
                    emailContent.attachments.push({
                        fileName: fileName,
                        fileSize: '',
                        downloadUrl: element.href || '',
                        element: element.outerHTML
                    });
                }
            });        });
    }

    // Debug logging for found attachments
    debugAttachments(emailContent.attachments);

    return emailContent;
}

// Function to analyze attachments for security risks
function analyzeAttachments(attachments) {
    const dangerousExtensions = [
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', 
        '.app', '.deb', '.pkg', '.dmg', '.run', '.msi', '.gadget', '.inf',
        '.ins', '.inx', '.isu', '.job', '.lnk', '.msc', '.msi', '.msp', 
        '.mst', '.paf', '.pif', '.ps1', '.reg', '.rgs', '.sct', '.shb',
        '.shs', '.u3p', '.vb', '.vbe', '.vbs', '.vbscript', '.ws', '.wsf',
        '.wsh', '.zip', '.rar', '.7z', '.tar.gz'
    ];

    const suspiciousExtensions = [
        '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf', '.rtf',
        '.html', '.htm', '.php', '.asp', '.jsp', '.xml', '.svg'
    ];

    let attachmentRisks = [];
    let attachmentWarnings = [];

    attachments.forEach(attachment => {
        const fileName = attachment.fileName.toLowerCase();
        const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

        let riskLevel = 'low';
        let riskReasons = [];

        // Check for dangerous file types
        if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
            riskLevel = 'high';
            riskReasons.push(`Dangerous file type: ${fileExtension}`);
            
            if (fileExtension === '.exe' || fileExtension === '.bat' || fileExtension === '.cmd') {
                riskReasons.push('Executable files can contain malware');
            }
            if (fileExtension === '.zip' || fileExtension === '.rar' || fileExtension === '.7z') {
                riskReasons.push('Compressed files may hide malicious content');
            }
            if (fileExtension === '.js' || fileExtension === '.vbs' || fileExtension === '.ps1') {
                riskReasons.push('Script files can execute malicious code');
            }
        }
        // Check for suspicious file types
        else if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
            riskLevel = 'medium';
            riskReasons.push(`Potentially suspicious file type: ${fileExtension}`);
            riskReasons.push('Document files can contain macros or embedded content');
        }

        // Check for suspicious naming patterns
        const suspiciousPatterns = [
            /invoice.*\.(exe|zip|rar)/i,
            /receipt.*\.(exe|zip|rar)/i,
            /document.*\.(exe|zip|rar)/i,
            /photo.*\.(exe|zip|rar)/i,
            /update.*\.(exe|zip|rar)/i,
            /urgent.*\.(exe|zip|rar)/i,
            /payment.*\.(exe|zip|rar)/i,
            /security.*\.(exe|zip|rar)/i,
            /\.(exe|bat|cmd|scr|pif)$/i
        ];

        if (suspiciousPatterns.some(pattern => pattern.test(fileName))) {
            riskLevel = riskLevel === 'low' ? 'high' : riskLevel;
            riskReasons.push('Suspicious filename pattern often used in malware');
        }

        // Check for double extensions
        const doubleExtensionPattern = /\.[a-z]{2,4}\.[a-z]{2,4}$/i;
        if (doubleExtensionPattern.test(fileName)) {
            riskLevel = 'high';
            riskReasons.push('Double file extension may be hiding true file type');
        }

        // Check for very long filenames (potential buffer overflow attempt)
        if (fileName.length > 255) {
            riskLevel = 'medium';
            riskReasons.push('Unusually long filename');
        }

        // Check for unusual characters in filename
        const unusualChars = /[^\w\s\-_\.]/;
        if (unusualChars.test(fileName)) {
            riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
            riskReasons.push('Filename contains unusual characters');
        }

        if (riskLevel === 'high') {
            attachmentRisks.push({
                type: 'attachment',
                fileName: attachment.fileName,
                fileSize: attachment.fileSize,
                riskLevel: riskLevel,
                reasons: riskReasons,
                detail: `High-risk attachment: ${attachment.fileName}`
            });
        } else if (riskLevel === 'medium') {
            attachmentWarnings.push({
                type: 'attachment',
                fileName: attachment.fileName,
                fileSize: attachment.fileSize,
                riskLevel: riskLevel,
                reasons: riskReasons,
                detail: `Potentially risky attachment: ${attachment.fileName}`
            });
        }
    });

    return { attachmentRisks, attachmentWarnings };
}

// Debug function to log found attachments
function debugAttachments(attachments) {
    if (attachments.length > 0) {
        console.log('🔍 Found attachments:', attachments);
        attachments.forEach((att, index) => {
            console.log(`📎 Attachment ${index + 1}:`, {
                name: att.fileName,
                size: att.fileSize,
                hasDownloadUrl: !!att.downloadUrl
            });
        });
    } else {
        console.log('📎 No attachments found');
    }
}

// Function to create attachment security report
async function analyzeAttachmentsWithAI(attachments) {
    if (attachments.length === 0) {
        return { riskLevel: 'none', analysis: 'No attachments found' };
    }

    const apiKey = window.config?.GEMINI_API_KEY;
    const apiUrl = window.config?.GEMINI_URL;

    if (!apiKey || apiKey === 'your_api_key_here') {
        console.warn('Gemini API key not configured, using basic attachment analysis');
        return analyzeAttachments(attachments);
    }

    const attachmentInfo = attachments.map(att => ({
        name: att.fileName,
        size: att.fileSize || 'unknown'
    }));

    const prompt = `You are a cybersecurity expert analyzing email attachments for malware and security risks.

Analyze the following email attachments and respond ONLY with a JSON object (no markdown formatting):

Attachments: ${JSON.stringify(attachmentInfo)}

Evaluate each attachment for:
1. File type security risk (executable, script, compressed files)
2. Suspicious naming patterns
3. Potential malware indicators
4. Social engineering tactics in filenames
5. Overall security risk

Required JSON response format:
{
    "overallRisk": "high/medium/low/none",
    "confidence": number between 0 and 1,
    "reasoning": "detailed explanation",
    "attachmentAnalysis": [
        {
            "fileName": "filename",
            "riskLevel": "high/medium/low",
            "threats": ["list", "of", "potential", "threats"],
            "recommendations": ["list", "of", "recommendations"]
        }
    ],
    "generalRecommendations": ["list", "of", "general", "recommendations"]
}`;

    try {
        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) throw new Error('Gemini API request failed');

        const data = await response.json();
        let responseText = data.candidates[0].content.parts[0].text;
        responseText = responseText.replace(/```json\s*|\s*```/g, '').trim();
        responseText = responseText.replace(/^[`\s]+|[`\s]+$/g, '');

        return JSON.parse(responseText);
    } catch (error) {
        console.error('Error analyzing attachments with AI:', error);
        return analyzeAttachments(attachments);
    }
}

// Function to analyze text context using Gemini
async function analyzeTextContext(text, type, patterns = [], emailContent = null) {
    const apiKey = window.config?.GEMINI_API_KEY;
    const apiUrl = window.config?.GEMINI_URL;

    if (!apiKey || apiKey === 'your_api_key_here') {
        console.error('Gemini API key not configured');
        return null;
    }

    const prompt = {
        text: `You are a cybersecurity expert analyzing an email ${type} for phishing attempts. This is a critical security task.

Suspicious patterns found: ${patterns.join(', ')}

Analyze the following aspects and respond ONLY with a JSON object (no markdown formatting, no backticks):

1. SENDER LEGITIMACY:
- Is the sender's domain consistent with the claimed organization?
- Are there subtle misspellings or unusual characters?

2. CONTENT ANALYSIS:
- Does it request sensitive information (passwords, financial details)?
- Are there unexpected account warnings or threats?
- Is there artificial urgency or pressure?
- Does the tone match legitimate business communication?

3. LINK ANALYSIS:
- Are URLs consistent with the claimed organization?
- Are there shortened or obscured links?

4. RED FLAGS:
- Grammatical errors or inconsistent formatting
- Generic greetings or unusual personalization
- Mismatched sender names and email addresses
- Requests to verify accounts or provide credentials
- Threats about account suspension or closure
- Unrealistic offers or rewards

5. LEGITIMATE BUSINESS CONTEXT:
- Is this a standard business notification?
- Are sensitive terms used in appropriate context?
- Is any urgency justified by real business needs?

Required JSON response format (no additional text or formatting):
{
    "isPotentialPhishing": boolean,
    "confidence": number between 0 and 1,
    "reasoning": "detailed explanation string",
    "contextualFlags": ["list", "of", "flags"],
    "legitimateContext": boolean,
    "legitimateReason": "explanation if legitimate",
    "riskLevel": "high/medium/low",
    "suspiciousElements": ["list", "of", "suspicious", "elements"]
}

Text to analyze: "${text}"
${emailContent ? `\nAdditional context - Sender: ${emailContent.sender}, Subject: ${emailContent.subject}` : ''}`
    };

    try {
        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt.text }] }]
            })
        });

        if (!response.ok) throw new Error('Gemini API request failed');

        const data = await response.json();
        let responseText = data.candidates[0].content.parts[0].text;
        responseText = responseText.replace(/```json\s*|\s*```/g, '').trim();
        responseText = responseText.replace(/^[`\s]+|[`\s]+$/g, '');

        const analysisResult = JSON.parse(responseText);
        const requiredFields = ['isPotentialPhishing', 'confidence', 'reasoning', 'contextualFlags', 'riskLevel'];
        
        if (requiredFields.some(field => !(field in analysisResult))) {
            console.error('Missing required fields in analysis result');
            return null;
        }

        return analysisResult;
    } catch (error) {
        console.error('Error analyzing context with Gemini:', error);
        return null;
    }
}

// Function to analyze email content
async function analyzeEmail(emailContent) {
    let highRiskFactors = [];
    let warnings = [];
    let contextualAnalysis = [];

    // Analyze attachments first
    if (emailContent.attachments && emailContent.attachments.length > 0) {
        console.log('Analyzing attachments:', emailContent.attachments);
        
        // Basic attachment analysis
        const basicAttachmentAnalysis = analyzeAttachments(emailContent.attachments);
        
        // Add high-risk attachments
        if (basicAttachmentAnalysis.attachmentRisks.length > 0) {
            highRiskFactors.push(...basicAttachmentAnalysis.attachmentRisks);
        }
        
        // Add attachment warnings
        if (basicAttachmentAnalysis.attachmentWarnings.length > 0) {
            warnings.push(...basicAttachmentAnalysis.attachmentWarnings);
        }

        // AI-powered attachment analysis
        try {
            const aiAttachmentAnalysis = await analyzeAttachmentsWithAI(emailContent.attachments);
            if (aiAttachmentAnalysis && aiAttachmentAnalysis.overallRisk) {
                if (aiAttachmentAnalysis.overallRisk === 'high') {
                    highRiskFactors.push({
                        type: 'attachment_ai',
                        detail: 'AI detected high-risk attachments',
                        reason: aiAttachmentAnalysis.reasoning,
                        confidence: aiAttachmentAnalysis.confidence,
                        attachmentAnalysis: aiAttachmentAnalysis.attachmentAnalysis
                    });
                } else if (aiAttachmentAnalysis.overallRisk === 'medium') {
                    warnings.push({
                        type: 'attachment_ai',
                        detail: 'AI detected potentially risky attachments',
                        reason: aiAttachmentAnalysis.reasoning,
                        confidence: aiAttachmentAnalysis.confidence,
                        attachmentAnalysis: aiAttachmentAnalysis.attachmentAnalysis
                    });
                }
            }
        } catch (error) {
            console.warn('AI attachment analysis failed:', error);
        }
    }

    // Function to get surrounding context
    function getContext(text, matchIndex, matchLength) {
        const contextLength = 50;
        const start = Math.max(0, matchIndex - contextLength);
        const end = Math.min(text.length, matchIndex + matchLength + contextLength);
        return text.substring(start, end).trim();
    }

    // Check subject patterns
    if (emailContent.subject) {
        const subjectLower = emailContent.subject.toLowerCase();
        const highRiskSubjectPatterns = [
            'account.*suspended', 'security.*breach', 'unauthorized.*access',
            'immediate.*action.*required', 'verify.*account.*now', 'urgent.*update',
            'account.*blocked', 'unusual.*activity'
        ];

        const subjectPatternMatches = highRiskSubjectPatterns
            .map(pattern => {
                const match = subjectLower.match(new RegExp(pattern, 'i'));
                return match ? {
                    pattern,
                    matched: match[0],
                    context: emailContent.subject
                } : null;
            })
            .filter(Boolean);

        if (subjectPatternMatches.length > 0) {
            const subjectAnalysis = await analyzeTextContext(
                emailContent.subject, 
                'subject',
                subjectPatternMatches.map(m => m.matched),
                emailContent
            );

            if (subjectAnalysis?.riskLevel === 'high' || 
                (subjectAnalysis?.isPotentialPhishing && subjectAnalysis?.confidence > 0.6)) {
                highRiskFactors.push({
                    type: 'subject',
                    detail: `Suspicious subject: "${emailContent.subject}"`,
                    reason: subjectAnalysis.reasoning,
                    confidence: subjectAnalysis.confidence,
                    patterns: subjectPatternMatches
                });
            }
        }
    }

    // Check body patterns
    if (emailContent.body) {
        const bodyLower = emailContent.body.toLowerCase();
        const patterns = [
            // Sensitive info patterns
            'password', 'credit card', 'social security', 'bank account',
            'verify.*identity', 'confirm.*account', 'ssn', 'login.*credentials',
            // Pressure patterns
            'within.*24 hours', 'account.*suspended', 'limited time',
            'immediate action', 'urgent', 'expires soon', 'act now',
            'failure to respond', 'account.*terminated'
        ];

        const bodyPatternMatches = patterns
            .map(pattern => {
                const match = bodyLower.match(new RegExp(pattern, 'i'));
                return match ? {
                    pattern,
                    matched: match[0],
                    context: getContext(emailContent.body, match.index, match[0].length)
                } : null;
            })
            .filter(Boolean);

        if (bodyPatternMatches.length > 0) {
            const bodyAnalysis = await analyzeTextContext(
                emailContent.body,
                'body',
                bodyPatternMatches.map(m => m.matched),
                emailContent
            );

            if (bodyAnalysis?.riskLevel === 'high' || 
                (bodyAnalysis?.isPotentialPhishing && bodyAnalysis?.confidence > 0.6)) {
                highRiskFactors.push({
                    type: 'content',
                    detail: 'Suspicious content detected',
                    reason: bodyAnalysis.reasoning,
                    confidence: bodyAnalysis.confidence,
                    patterns: bodyPatternMatches
                });
            } else if (bodyAnalysis?.riskLevel === 'medium' || 
                      (bodyAnalysis?.isPotentialPhishing && bodyAnalysis?.confidence > 0.4)) {
                warnings.push({
                    type: 'content',
                    detail: 'Potentially suspicious content',
                    reason: bodyAnalysis.reasoning,
                    confidence: bodyAnalysis.confidence,
                    patterns: bodyPatternMatches
                });
            }
        }
    }

    // Check links
    if (emailContent.links.length > 0) {
        const suspiciousUrlPatterns = [
            'bit\\.ly', 'tinyurl', 'goo\\.gl', 'tiny\\.cc',
            'click\\.here', 'verify.*account', 'login.*secure',
            '\\.xyz/', '\\.info/', 'account.*verify', 'secure.*login'
        ];

        const suspiciousLinks = emailContent.links
            .map(link => {
                const linkLower = link.url.toLowerCase();
                const matchedPattern = suspiciousUrlPatterns.find(pattern => 
                    linkLower.match(new RegExp(pattern)));
                return matchedPattern ? {
                    url: link.url,
                    pattern: matchedPattern,
                    text: link.text
                } : null;
            })
            .filter(Boolean);

        if (suspiciousLinks.length > 0) {
            highRiskFactors.push({
                type: 'links',
                detail: 'Suspicious links detected',
                links: suspiciousLinks
            });
        }
    }

    return { highRiskFactors, warnings, contextualAnalysis };
}

// Update message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ping") {
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === "getEmailContent") {
        (async () => {
            try {
                const emailContent = extractEmailContent();
                const analysis = await analyzeEmail(emailContent);
                sendResponse(analysis);
            } catch (error) {
                console.error('Error in content script:', error);
                sendResponse({ error: error.message });
            }
        })();
        return true;
    }
    return false;
});