document.addEventListener('DOMContentLoaded', function() {
    const scanBtn = document.getElementById('scanBtn');
    const results = document.getElementById('results');
    const loading = document.getElementById('loading');
    const riskLevel = document.getElementById('riskLevel');
    const details = document.getElementById('details');
    const errorMessage = document.getElementById('errorMessage');
    const recommendationsList = document.getElementById('recommendationsList');

    scanBtn.addEventListener('click', async () => {
        // Reset UI
        loading.style.display = 'block';
        results.style.display = 'none';
        errorMessage.style.display = 'none';
        scanBtn.disabled = true;        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we're on a supported email domain
            const supportedDomains = [
                'mail.google.com',
                'outlook.live.com',
                'outlook.office.com',
                'mail.yahoo.com'
            ];
            
            const url = new URL(tab.url);
            if (!supportedDomains.includes(url.hostname)) {
                throw new Error('Please open an email in Gmail, Outlook, or Yahoo Mail to scan.');
            }

            // Inject content script if not already loaded
            await ensureContentScript(tab.id);

            // Get analysis from content script with retry logic
            const response = await sendMessageWithRetry(tab.id, { action: "getEmailContent" });
            
            displayResults(response);
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = error.message || 'Error analyzing email. Please try again.';
            errorMessage.style.display = 'block';
            results.style.display = 'none';        } finally {
            loading.style.display = 'none';
            scanBtn.disabled = false;
        }
    });

    async function ensureContentScript(tabId) {
        try {
            // Try to ping the content script first
            const response = await new Promise((resolve) => {
                chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
                    resolve(response);
                });
            });

            // If no response, inject the content script
            if (!response) {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['config.js', 'content.js']
                });
                
                // Wait a bit for the script to load
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.warn('Error ensuring content script:', error);
            // Try to inject anyway
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['config.js', 'content.js']
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (injectError) {
                throw new Error('Failed to inject content script: ' + injectError.message);
            }
        }
    }

    async function sendMessageWithRetry(tabId, message, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await new Promise((resolve, reject) => {
                    chrome.tabs.sendMessage(tabId, message, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                            return;
                        }
                        if (!response) {
                            reject(new Error('Empty response from content script'));
                            return;
                        }
                        if (response.error) {
                            reject(new Error(response.error));
                            return;
                        }
                        resolve(response);
                    });
                });
                return response;
            } catch (error) {
                console.warn(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    throw new Error(`Failed to communicate with content script after ${maxRetries} attempts: ${error.message}`);
                }
                
                // Wait before retry, with exponential backoff
                await new Promise(resolve => setTimeout(resolve, attempt * 500));
                
                // Try to re-inject content script on retry
                if (attempt > 1) {
                    try {
                        await ensureContentScript(tabId);
                    } catch (injectError) {
                        console.warn('Failed to re-inject content script:', injectError);
                    }
                }
            }
        }
    }

    function displayResults(analysis) {
        results.style.display = 'block';        // Set risk level and recommendations
        let riskClass, riskText, recommendations;

        // Check for attachment-related high risks
        const hasHighRiskAttachments = analysis.highRiskFactors?.some(factor => 
            factor.type === 'attachment' || factor.type === 'attachment_ai'
        );

        if (analysis.highRiskFactors?.length > 0) {
            riskClass = 'high-risk';
            riskText = '🔴 High Risk - Likely Phishing Attempt';
            recommendations = [
                'Do not click any links in this email',
                'Do not download any attachments',
                'Do not open or execute any attachment files',
                'Do not reply to this email',
                'Report this email as phishing',
                'Scan your computer for malware if you already opened attachments'
            ];

            if (hasHighRiskAttachments) {
                recommendations.unshift('⚠️ CRITICAL: This email contains dangerous attachments');
            }
        } else if (analysis.warnings?.length > 0) {
            riskClass = 'suspicious';
            riskText = '🟡 Suspicious - Exercise Caution';
            
            const hasAttachmentWarnings = analysis.warnings?.some(warning => 
                warning.type === 'attachment' || warning.type === 'attachment_ai'
            );

            recommendations = [
                'Verify the sender through other means',
                'Do not provide sensitive information',
                'When in doubt, contact the company directly'
            ];

            if (hasAttachmentWarnings) {
                recommendations.push('Exercise extreme caution with any attachments');
                recommendations.push('Scan attachments with antivirus before opening');
                recommendations.push('Consider using a sandbox environment for suspicious files');
            }
        } else {
            riskClass = 'low-risk';
            riskText = '🟢 Low Risk - No Obvious Red Flags';
            recommendations = [
                'Always remain vigilant with email communications',
                'Keep your security software up to date',
                'Still verify sender authenticity for important requests'
            ];
        }

        // Update UI elements
        riskLevel.className = `risk-level ${riskClass}`;
        riskLevel.textContent = riskText;
        recommendationsList.innerHTML = recommendations.map(rec => `<li>${rec}</li>`).join('');        // Display detected issues
        if (analysis.highRiskFactors?.length > 0 || analysis.warnings?.length > 0) {
            const detailsList = document.createElement('ul');
            detailsList.style.listStyle = 'none';
            detailsList.style.padding = '0';

            function createDetailedItem(item) {
                const li = document.createElement('li');
                li.className = 'detail-item';
                li.style.cssText = 'margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;';

                // Create a list for all suspicious elements
                const suspiciousList = document.createElement('ul');
                suspiciousList.style.cssText = 'list-style: none; padding: 0; margin: 0;';

                // Handle attachment-specific items
                if (item.type === 'attachment') {
                    const attachmentHeader = document.createElement('div');
                    attachmentHeader.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #d73027;';
                    attachmentHeader.innerHTML = `🗂️ ${item.detail}`;
                    li.appendChild(attachmentHeader);

                    // Add file details
                    const fileDetails = document.createElement('div');
                    fileDetails.style.cssText = 'margin-bottom: 8px; padding: 8px; background-color: #fff3cd; border-radius: 4px;';
                    fileDetails.innerHTML = `
                        <strong>File:</strong> ${item.fileName}<br>
                        ${item.fileSize ? `<strong>Size:</strong> ${item.fileSize}<br>` : ''}
                        <strong>Risk Level:</strong> <span style="color: ${item.riskLevel === 'high' ? '#d73027' : '#ff8c00'};">${item.riskLevel.toUpperCase()}</span>
                    `;
                    li.appendChild(fileDetails);

                    // Add reasons
                    if (item.reasons && item.reasons.length > 0) {
                        item.reasons.forEach(reason => {
                            const reasonItem = document.createElement('li');
                            reasonItem.style.cssText = 'margin-bottom: 5px;';
                            reasonItem.textContent = `• ${reason}`;
                            suspiciousList.appendChild(reasonItem);
                        });
                    }
                }
                // Handle AI attachment analysis
                else if (item.type === 'attachment_ai') {
                    const aiHeader = document.createElement('div');
                    aiHeader.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #d73027;';
                    aiHeader.innerHTML = `${item.detail}`;
                    li.appendChild(aiHeader);

                    // Add AI reasoning
                    if (item.reason) {
                        const reasonDiv = document.createElement('div');
                        reasonDiv.style.cssText = 'margin-bottom: 8px; padding: 8px; background-color: #e3f2fd; border-radius: 4px;';
                        reasonDiv.innerHTML = `<strong>AI Analysis:</strong> ${item.reason}`;
                        li.appendChild(reasonDiv);
                    }

                    // Add individual attachment analysis
                    if (item.attachmentAnalysis && item.attachmentAnalysis.length > 0) {
                        item.attachmentAnalysis.forEach(attAnalysis => {
                            const attDiv = document.createElement('div');
                            attDiv.style.cssText = 'margin-bottom: 8px; padding: 8px; background-color: #fff3cd; border-radius: 4px;';
                            attDiv.innerHTML = `
                                <strong>${attAnalysis.fileName}</strong><br>
                                <strong>Risk:</strong> <span style="color: ${attAnalysis.riskLevel === 'high' ? '#d73027' : '#ff8c00'};">${attAnalysis.riskLevel.toUpperCase()}</span>
                            `;
                            
                            if (attAnalysis.threats && attAnalysis.threats.length > 0) {
                                const threatsList = document.createElement('ul');
                                threatsList.style.cssText = 'margin: 5px 0; padding-left: 15px;';
                                attAnalysis.threats.forEach(threat => {
                                    const threatItem = document.createElement('li');
                                    threatItem.textContent = threat;
                                    threatsList.appendChild(threatItem);
                                });
                                attDiv.appendChild(threatsList);
                            }
                            
                            li.appendChild(attDiv);
                        });
                    }
                }
                // Handle regular items
                else {
                    // Add reasoning points
                    if (item.reason) {
                        const reasonPoints = item.reason.split('. ').filter(point => point.trim());
                        reasonPoints.forEach(point => {
                            const reasonItem = document.createElement('li');
                            reasonItem.style.cssText = 'margin-bottom: 8px;';
                            reasonItem.textContent = `• ${point.trim()}`;
                            suspiciousList.appendChild(reasonItem);
                        });
                    }

                    // Add suspicious links as separate points
                    if (item.links?.length > 0) {
                        item.links.forEach(link => {
                            const linkItem = document.createElement('li');
                            linkItem.style.cssText = 'margin-bottom: 8px;';
                            linkItem.innerHTML = `• Suspicious Link: "${link.text}" (${link.url})`;
                            suspiciousList.appendChild(linkItem);
                        });
                    }
                }

                if (suspiciousList.children.length > 0) {
                    li.appendChild(suspiciousList);
                }
                return li;
            }

            // Add high risk factors and warnings
            [...(analysis.highRiskFactors || []), ...(analysis.warnings || [])].forEach(item => {
                detailsList.appendChild(createDetailedItem(item));
            });

            details.innerHTML = '<h3>Detected Issues:</h3>';
            details.appendChild(detailsList);
        } else {
            details.innerHTML = '<p>No suspicious elements detected.</p>';
        }
    }
}); 