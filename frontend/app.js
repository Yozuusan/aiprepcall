/**
 * Frontend Application Logic
 */

const API_BASE = 'http://localhost:3000/api';

// DOM Elements
const generateBtn = document.getElementById('generateBtn');
const surpriseBtn = document.getElementById('surpriseBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const loadingSection = document.getElementById('loadingSection');
const loadingMessage = document.getElementById('loadingMessage');
const caseSection = document.getElementById('caseSection');
const caseContent = document.getElementById('caseContent');

// Real cases DOM elements
const getRealCaseBtn = document.getElementById('getRealCaseBtn');
const getAnotherRealCaseBtn = document.getElementById('getAnotherRealCaseBtn');
const downloadRealPdfBtn = document.getElementById('downloadRealPdfBtn');
const realLoadingSection = document.getElementById('realLoadingSection');
const realCaseSection = document.getElementById('realCaseSection');
const realCaseContent = document.getElementById('realCaseContent');

// Event Listeners
generateBtn.addEventListener('click', () => generateCase(false));
surpriseBtn.addEventListener('click', () => generateCase(true));
regenerateBtn.addEventListener('click', () => generateCase(false));
downloadPdfBtn.addEventListener('click', downloadCaseAsPdf);
getRealCaseBtn.addEventListener('click', () => getRealCase());
getAnotherRealCaseBtn.addEventListener('click', () => getRealCase());
downloadRealPdfBtn.addEventListener('click', downloadRealCaseAsPdf);

// Tab handling
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        if (tab === 'generate') {
            document.getElementById('generateTab').classList.add('active');
        } else if (tab === 'real') {
            document.getElementById('realTab').classList.add('active');
        }
    });
});

// Loading messages
const loadingMessages = [
    'Analyzing case requirements...',
    'Thinking through frameworks...',
    'Selecting case scenario...',
    'Structuring the problem...',
    'Generating client context...',
    'Crafting quantitative questions...',
    'Designing solution approach...',
    'Preparing interviewer notes...',
    'Finalizing case details...'
];

let messageInterval = null;

/**
 * Generate a case
 */
async function generateCase(surprise = false) {
    // Get form values
    let caseType = document.getElementById('caseType').value;
    let difficulty = document.getElementById('difficulty').value;
    const industry = document.getElementById('industry').value;

    // If surprise or random selected, randomize
    if (surprise || caseType === 'random') {
        const caseTypes = [
            'profitability', 'market_entry', 'mergers_acquisitions',
            'competitive_response', 'new_product_launch', 'pricing',
            'cost_reduction', 'growth', 'private_equity',
            'process_optimization', 'offshoring'
        ];
        const difficulties = ['easy', 'medium', 'hard'];

        caseType = caseTypes[Math.floor(Math.random() * caseTypes.length)];
        difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    }

    // Show loading with dynamic messages
    loadingSection.style.display = 'block';
    caseSection.style.display = 'none';

    // Start rotating messages
    let messageIndex = 0;
    loadingMessage.textContent = loadingMessages[messageIndex];

    messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        loadingMessage.textContent = loadingMessages[messageIndex];
    }, 6000); // Change message every 6 seconds

    try {
        const response = await fetch(`${API_BASE}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                case_type: caseType,
                difficulty: difficulty,
                industry: industry || undefined
            })
        });

        const data = await response.json();

        if (data.success) {
            displayCase(data.case);
        } else {
            alert('Error: ' + data.error);
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate case. Check console for details.');
    } finally {
        // Stop rotating messages
        if (messageInterval) {
            clearInterval(messageInterval);
            messageInterval = null;
        }
        loadingSection.style.display = 'none';
    }
}

/**
 * Display generated case
 */
function displayCase(caseData) {
    caseSection.style.display = 'block';

    let html = `
        <div class="case-metadata">
            <span class="badge">${caseData.metadata.case_type}</span>
            <span class="badge">${caseData.metadata.difficulty}</span>
            <span class="badge">${caseData.metadata.industry}</span>
            <span class="badge">~${caseData.metadata.duration} min</span>
        </div>

        <div class="case-block">
            <h3>📋 Case Prompt</h3>
            <p>${caseData.prompt}</p>
        </div>

        <div class="case-block">
            <h3>ℹ️ Clarifying Information</h3>
            <p><strong>Objective:</strong> ${caseData.clarifying_information.objective}</p>
            <p><strong>Timeline:</strong> ${caseData.clarifying_information.timeline}</p>

            <h4>Client Context:</h4>
            <ul>
                <li><strong>Name:</strong> ${caseData.clarifying_information.client_context.name}</li>
                <li><strong>Business:</strong> ${caseData.clarifying_information.client_context.business}</li>
                <li><strong>Geography:</strong> ${caseData.clarifying_information.client_context.geography}</li>
                <li><strong>Situation:</strong> ${caseData.clarifying_information.client_context.recent_situation}</li>
            </ul>

            ${caseData.clarifying_information.additional_data_to_reveal ? `
                <h4>Additional Data:</h4>
                <ul>
                    ${Object.entries(caseData.clarifying_information.additional_data_to_reveal).map(([key, value]) =>
                        `<li><strong>${key.replace(/_/g, ' ')}:</strong> ${value}</li>`
                    ).join('')}
                </ul>
            ` : ''}

            ${caseData.clarifying_information.questions_candidate_should_ask ? `
                <h4>Good Clarifying Questions to Ask:</h4>
                <ul>
                    ${caseData.clarifying_information.questions_candidate_should_ask.map(q => `<li>${q}</li>`).join('')}
                </ul>
            ` : ''}
        </div>

        <div class="case-block">
            <h3>🧩 Framework Guidance</h3>
            <p><strong>Expected Frameworks:</strong> ${caseData.framework_guidance.expected_frameworks.join(', ')}</p>

            ${caseData.framework_guidance.detailed_framework_structure ? `
                <div class="framework-detail">
                    <h4>${caseData.framework_guidance.detailed_framework_structure.framework_name}</h4>
                    ${caseData.framework_guidance.detailed_framework_structure.main_branches.map(branch => `
                        <div class="framework-branch">
                            <strong>📊 ${branch.branch_name}</strong>
                            <ul>
                                ${branch.sub_branches.map(sub => `<li>${sub}</li>`).join('')}
                            </ul>
                            ${branch.key_questions ? `
                                <p><em>Key questions:</em></p>
                                <ul>
                                    ${branch.key_questions.map(q => `<li>${q}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `).join('')}
                    <p><strong>How to apply:</strong> ${caseData.framework_guidance.detailed_framework_structure.how_to_apply}</p>
                </div>
            ` : ''}

            <p><strong>Key Factors to Consider:</strong></p>
            <ul>
                ${caseData.framework_guidance.key_factors.map(f => `<li>${f}</li>`).join('')}
            </ul>

            ${caseData.framework_guidance.mece_breakdown_example ? `
                <p><strong>MECE Breakdown:</strong> ${caseData.framework_guidance.mece_breakdown_example}</p>
            ` : ''}
        </div>

        <div class="case-block">
            <h3>❓ Questions</h3>
            ${caseData.questions.map((q, i) => `
                <div class="question-block">
                    <h4>Question ${q.question_number}</h4>
                    <p>${q.question_text}</p>

                    ${q.exhibit ? `
                        <div class="exhibit">
                            <strong>${q.exhibit.title}</strong>
                            <pre>${JSON.stringify(q.exhibit.data, null, 2)}</pre>
                        </div>
                    ` : ''}

                    <details>
                        <summary>Solution</summary>
                        <p><strong>Approach:</strong> ${q.solution.approach}</p>
                        <p><strong>Calculation:</strong> ${q.solution.calculation}</p>
                        ${q.solution.answer ? `<p><strong>Answer:</strong> ${q.solution.answer}</p>` : ''}
                        <p><strong>Insight:</strong> ${q.solution.insight}</p>
                    </details>
                </div>
            `).join('')}
        </div>

        <div class="case-block">
            <h3>💭 Brainstorming</h3>
            <p>${caseData.brainstorming.prompt}</p>
            ${Object.entries(caseData.brainstorming.categories).map(([cat, items]) => `
                <div class="brainstorm-category">
                    <h4>${cat}</h4>
                    <ul>
                        ${items.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>

        <div class="case-block">
            <h3>✅ Conclusion Framework</h3>
            <p><strong>What a strong answer includes:</strong></p>
            <ul>
                <li>Clear recommendation: ${caseData.conclusion.recommendation_framework.clear_answer}</li>
                <li>Key risks: ${caseData.conclusion.recommendation_framework.key_risks}</li>
                <li>Financial impact: ${caseData.conclusion.recommendation_framework.financial_impact}</li>
                <li>Next steps: ${caseData.conclusion.recommendation_framework.next_steps}</li>
            </ul>

            <details>
                <summary>Sample Strong Answer</summary>
                <p>${caseData.conclusion.sample_strong_answer}</p>
            </details>
        </div>

        <div class="case-block interviewer-notes">
            <h3>👨‍🏫 Interviewer Notes</h3>

            <h4>Common Mistakes:</h4>
            <ul>
                ${caseData.interviewer_notes.common_mistakes.map(m => `<li>${m}</li>`).join('')}
            </ul>

            <h4>Hints if Stuck:</h4>
            <ul>
                ${caseData.interviewer_notes.hints_if_stuck.map(h => `<li>${h}</li>`).join('')}
            </ul>

            <p><strong>What good looks like:</strong> ${caseData.interviewer_notes.what_good_looks_like}</p>
        </div>
    `;

    caseContent.innerHTML = html;

    // Scroll to case
    caseSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Download case as PDF - Pure text version with jsPDF
 */
function downloadCaseAsPdf() {
    const element = document.getElementById('caseContent');

    // Get case metadata for filename
    const metadata = element.querySelector('.case-metadata');
    let filename = 'consulting-case.pdf';

    if (metadata) {
        const badges = metadata.querySelectorAll('.badge');
        if (badges.length >= 2) {
            const caseType = badges[0].textContent.replace(/\s+/g, '-');
            const difficulty = badges[1].textContent.toLowerCase();
            filename = `case-${caseType}-${difficulty}.pdf`;
        }
    }

    // Clone the element
    const clonedElement = element.cloneNode(true);

    // Open all <details> elements to show solutions
    const allDetails = clonedElement.querySelectorAll('details');
    allDetails.forEach(detail => {
        detail.setAttribute('open', 'open');
    });

    // Convert to pure text with basic formatting
    const textContent = convertToPlainText(clonedElement);

    // Create PDF with jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Page settings
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    const lineHeight = 6;
    const fontSize = 10;

    doc.setFont('helvetica');
    doc.setFontSize(fontSize);

    let yPosition = margin;

    // Split text into lines
    const lines = textContent.split('\n');

    lines.forEach((line) => {
        // Check if we need a new page
        if (yPosition + lineHeight > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
        }

        // Handle different line types
        if (line.startsWith('===')) {
            // Major section separator
            yPosition += 3;
            if (yPosition + lineHeight > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }
        } else if (line.startsWith('---')) {
            // Minor section separator
            yPosition += 2;
        } else if (line.trim() === '') {
            // Empty line - just add spacing
            yPosition += lineHeight * 0.5;
        } else {
            // Regular text - split long lines
            const wrappedLines = doc.splitTextToSize(line, maxWidth);

            wrappedLines.forEach((wrappedLine, index) => {
                // Check for page break before each wrapped line
                if (yPosition + lineHeight > pageHeight - margin) {
                    doc.addPage();
                    yPosition = margin;
                }

                doc.text(wrappedLine, margin, yPosition);
                yPosition += lineHeight;
            });
        }
    });

    // Save the PDF
    doc.save(filename);
}

/**
 * Convert HTML to plain text with structure
 */
function convertToPlainText(element) {
    let text = '';

    // Process each child node
    function processNode(node, indent = '') {
        if (node.nodeType === Node.TEXT_NODE) {
            const content = node.textContent.trim();
            if (content) {
                text += content + ' ';
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName;

            // Add spacing before block elements
            if (['DIV', 'P', 'H3', 'H4', 'UL', 'OL', 'LI'].includes(tagName)) {
                if (text && !text.endsWith('\n')) {
                    text += '\n';
                }
            }

            // Handle specific elements
            if (tagName === 'H3') {
                text += '\n\n' + '='.repeat(60) + '\n';
                text += node.textContent.trim().toUpperCase() + '\n';
                text += '='.repeat(60) + '\n\n';
                return; // Skip children, already got text
            } else if (tagName === 'H4') {
                text += '\n' + node.textContent.trim() + '\n';
                text += '-'.repeat(40) + '\n';
                return;
            } else if (tagName === 'STRONG' || tagName === 'B') {
                text += '\n' + node.textContent.trim() + ': ';
                return;
            } else if (tagName === 'LI') {
                text += indent + '• ' + node.textContent.trim() + '\n';
                return;
            } else if (tagName === 'SUMMARY') {
                text += '\n' + node.textContent.trim() + '\n';
                return;
            } else if (tagName === 'DETAILS') {
                // Process details content
                Array.from(node.children).forEach(child => {
                    if (child.tagName !== 'SUMMARY') {
                        processNode(child, indent + '  ');
                    }
                });
                return;
            } else if (tagName === 'BR') {
                text += '\n';
                return;
            }

            // Process children
            Array.from(node.childNodes).forEach(child => {
                processNode(child, indent);
            });

            // Add spacing after block elements
            if (['DIV', 'P'].includes(tagName)) {
                text += '\n';
            }
        }
    }

    processNode(element);

    // Clean up extra newlines
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
}

/**
 * Get a random real case
 */
async function getRealCase() {
    const caseType = document.getElementById('realCaseType').value;
    const industry = document.getElementById('realIndustry').value;
    const sourceType = document.getElementById('realSourceType').value;

    // Show loading
    realLoadingSection.style.display = 'block';
    realCaseSection.style.display = 'none';

    try {
        const params = new URLSearchParams();
        if (caseType !== 'all') params.append('case_type', caseType);
        if (industry !== 'all') params.append('industry', industry);
        if (sourceType !== 'all') params.append('source_type', sourceType);

        const response = await fetch(API_BASE + '/real-cases/random?' + params.toString());
        const data = await response.json();

        if (data.success) {
            displayRealCase(data.case, data.total_matching);
        } else {
            alert('Error: ' + data.error);
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to get real case. Check console for details.');
    } finally {
        realLoadingSection.style.display = 'none';
    }
}

/**
 * Display real case
 */
function displayRealCase(caseData, totalMatching) {
    realCaseSection.style.display = 'block';

    let html = '';
    html += '<div class="case-metadata">';
    html += '<span class="badge">' + caseData.source_type + '</span>';
    html += '<span class="badge">' + (caseData.case_type || 'General') + '</span>';
    html += '<span class="badge">' + (caseData.industry || 'N/A') + '</span>';
    html += '<span class="badge">Source: ' + caseData.source_display + '</span>';
    html += '<span class="badge">' + totalMatching + ' cases matching filters</span>';
    html += '</div>';

    html += '<div class="case-block">';
    html += '<h3>📋 Case Prompt</h3>';
    html += '<p>' + (caseData.prompt || caseData.raw_text.substring(0, 500) + '...') + '</p>';
    html += '</div>';

    // Add clarifying info if available
    if (caseData.clarifying_info) {
        html += '<div class="case-block">';
        html += '<h3>ℹ️ Clarifying Information</h3>';
        html += '<pre style="white-space: pre-wrap;">' + caseData.clarifying_info + '</pre>';
        html += '</div>';
    }

    // Add framework if available
    if (caseData.framework && caseData.framework.length > 0) {
        html += '<div class="case-block">';
        html += '<h3>🧩 Framework</h3>';
        html += '<ul>';
        caseData.framework.forEach(f => {
            html += '<li>' + f + '</li>';
        });
        html += '</ul>';
        html += '</div>';
    }

    // Add questions if available
    if (caseData.questions && caseData.questions.length > 0) {
        html += '<div class="case-block">';
        html += '<h3>❓ Questions</h3>';
        caseData.questions.forEach((q, i) => {
            html += '<div class="question-block">';
            html += '<h4>Question ' + (i + 1) + '</h4>';
            html += '<p>' + (q.text || q) + '</p>';
            html += '</div>';
        });
        html += '</div>';
    }

    // Add conclusion if available
    if (caseData.conclusion) {
        html += '<div class="case-block">';
        html += '<h3>✅ Conclusion</h3>';
        html += '<pre style="white-space: pre-wrap;">' + caseData.conclusion + '</pre>';
        html += '</div>';
    }

    // Show full raw text
    html += '<div class="case-block">';
    html += '<h3>📄 Full Case Text</h3>';
    html += '<pre style="white-space: pre-wrap; line-height: 1.6;">' + caseData.raw_text + '</pre>';
    html += '</div>';

    realCaseContent.innerHTML = html;

    // Scroll to case
    realCaseSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Download real case as PDF
 */
function downloadRealCaseAsPdf() {
    const element = document.getElementById('realCaseContent');

    // Get case metadata for filename
    const metadata = element.querySelector('.case-metadata');
    let filename = 'real-case.pdf';

    if (metadata) {
        const badges = metadata.querySelectorAll('.badge');
        if (badges.length >= 2) {
            const sourceType = badges[0].textContent.replace(/\s+/g, '-');
            const caseType = badges[1].textContent.replace(/\s+/g, '-');
            filename = 'real-case-' + sourceType + '-' + caseType + '.pdf';
        }
    }

    // Convert to plain text
    const textContent = convertToPlainText(element);

    // Create PDF with jsPDF
    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Page settings
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    const lineHeight = 6;
    const fontSize = 10;

    doc.setFont('helvetica');
    doc.setFontSize(fontSize);

    let yPosition = margin;

    // Split text into lines
    const lines = textContent.split('\n');

    lines.forEach((line) => {
        // Check if we need a new page
        if (yPosition + lineHeight > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
        }

        // Handle different line types
        if (line.startsWith('===')) {
            // Major section separator
            yPosition += 3;
            if (yPosition + lineHeight > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
            }
        } else if (line.startsWith('---')) {
            // Minor section separator
            yPosition += 2;
        } else if (line.trim() === '') {
            // Empty line - just add spacing
            yPosition += lineHeight * 0.5;
        } else {
            // Regular text - split long lines
            const wrappedLines = doc.splitTextToSize(line, maxWidth);

            wrappedLines.forEach((wrappedLine, index) => {
                // Check for page break before each wrapped line
                if (yPosition + lineHeight > pageHeight - margin) {
                    doc.addPage();
                    yPosition = margin;
                }

                doc.text(wrappedLine, margin, yPosition);
                yPosition += lineHeight;
            });
        }
    });

    // Save the PDF
    doc.save(filename);
}
