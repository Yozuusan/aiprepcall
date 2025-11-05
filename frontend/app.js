/**
 * Frontend Application Logic
 */

const API_BASE = 'http://localhost:3000/api';

// DOM Elements
const generateBtn = document.getElementById('generateBtn');
const surpriseBtn = document.getElementById('surpriseBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const loadingSection = document.getElementById('loadingSection');
const caseSection = document.getElementById('caseSection');
const caseContent = document.getElementById('caseContent');
const statsContent = document.getElementById('statsContent');

// Event Listeners
generateBtn.addEventListener('click', () => generateCase(false));
surpriseBtn.addEventListener('click', () => generateCase(true));
regenerateBtn.addEventListener('click', () => generateCase(false));

// Initialize
loadStats();

/**
 * Generate a case
 */
async function generateCase(surprise = false) {
    // Get form values
    let caseType = document.getElementById('caseType').value;
    let difficulty = document.getElementById('difficulty').value;
    const industry = document.getElementById('industry').value;

    // If surprise, randomize
    if (surprise) {
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

    // Show loading
    loadingSection.style.display = 'block';
    caseSection.style.display = 'none';

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
        </div>

        <div class="case-block">
            <h3>🧩 Framework Guidance</h3>
            <p><strong>Expected Frameworks:</strong> ${caseData.framework_guidance.expected_frameworks.join(', ')}</p>
            <p><strong>Key Factors to Consider:</strong></p>
            <ul>
                ${caseData.framework_guidance.key_factors.map(f => `<li>${f}</li>`).join('')}
            </ul>
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
 * Load knowledge base stats
 */
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const stats = await response.json();

        let html = `
            <p><strong>Total Cases Analyzed:</strong> ${stats.total_cases_analyzed}</p>
            <p><strong>Last Updated:</strong> ${new Date(stats.last_updated).toLocaleDateString()}</p>

            <h4>Coverage:</h4>
            <ul>
                ${stats.case_types.slice(0, 5).map(ct =>
                    `<li>${ct.type}: ${ct.pattern_count} patterns</li>`
                ).join('')}
            </ul>

            <h4>Industries:</h4>
            <ul>
                ${stats.industries.slice(0, 5).map(ind =>
                    `<li>${ind.industry}: ${ind.case_count} cases</li>`
                ).join('')}
            </ul>
        `;

        statsContent.innerHTML = html;

    } catch (error) {
        console.error('Error loading stats:', error);
        statsContent.innerHTML = '<p>Error loading stats</p>';
    }
}
