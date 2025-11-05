/**
 * Synthetic Case Generator
 * Uses knowledge base + Claude API to generate realistic case interviews
 */

const fs = require('fs');
const path = require('path');
const ClaudeAPI = require('./claudeAPI');

class CaseGenerator {
  constructor() {
    this.knowledgeBase = this.loadKnowledgeBase();
    this.claudeAPI = new ClaudeAPI();
  }

  /**
   * Load the knowledge base
   */
  loadKnowledgeBase() {
    const kbPath = path.join(__dirname, '../data/knowledge_base.json');

    if (!fs.existsSync(kbPath)) {
      throw new Error('Knowledge base not found. Run buildKnowledgeBase.js first.');
    }

    return JSON.parse(fs.readFileSync(kbPath, 'utf8'));
  }

  /**
   * Generate a synthetic case
   *
   * @param {Object} options - Generation options
   * @param {string} options.caseType - Type of case to generate
   * @param {string} options.difficulty - easy|medium|hard
   * @param {string} options.industry - Optional industry preference
   * @param {string} options.firmStyle - Optional firm style (McKinsey, BCG, Bain)
   * @returns {Promise<Object>} Generated case
   */
  async generate(options = {}) {
    const {
      caseType = 'profitability',
      difficulty = 'medium',
      industry = null,
      firmStyle = null
    } = options;

    console.log(`\n🎯 Generating ${difficulty} ${caseType} case...`);

    // Select relevant patterns from knowledge base
    const relevantPatterns = this.selectRelevantPatterns(caseType, industry);

    // Build generation prompt for Claude
    const prompt = this.buildGenerationPrompt(caseType, difficulty, relevantPatterns, industry, firmStyle);

    // Call Claude API
    console.log('  🤖 Calling Claude API...');
    const generatedCase = await this.claudeAPI.generateCase(prompt);

    // Post-process and validate
    const finalCase = this.postProcess(generatedCase, caseType, difficulty);

    console.log('  ✓ Case generated successfully!\n');

    return finalCase;
  }

  /**
   * Select relevant patterns from knowledge base
   */
  selectRelevantPatterns(caseType, industry) {
    const patterns = {
      opening_examples: [],
      frameworks: [],
      quantitative_examples: [],
      industry_context: null,
      clarifying_patterns: [],
      brainstorming_prompts: []
    };

    // Opening patterns
    if (this.knowledgeBase.opening_patterns[caseType]) {
      patterns.opening_examples = this.knowledgeBase.opening_patterns[caseType].slice(0, 5);
    }

    // Framework approaches
    if (this.knowledgeBase.framework_approaches[caseType]) {
      patterns.frameworks = this.knowledgeBase.framework_approaches[caseType];
    }

    // Quantitative patterns
    patterns.quantitative_examples = this.sampleQuantitativePatterns();

    // Industry context
    if (industry && this.knowledgeBase.industry_contexts[industry]) {
      patterns.industry_context = this.knowledgeBase.industry_contexts[industry];
    } else if (Object.keys(this.knowledgeBase.industry_contexts).length > 0) {
      // Pick a random industry
      const industries = Object.keys(this.knowledgeBase.industry_contexts);
      const randomIndustry = industries[Math.floor(Math.random() * industries.length)];
      patterns.industry_context = this.knowledgeBase.industry_contexts[randomIndustry];
      patterns.industry_context.name = randomIndustry;
    }

    // Clarifying questions
    patterns.clarifying_patterns = this.knowledgeBase.clarifying_questions_patterns.slice(0, 5);

    // Brainstorming
    if (Object.keys(this.knowledgeBase.brainstorming_categories).length > 0) {
      patterns.brainstorming_prompts = Object.values(this.knowledgeBase.brainstorming_categories).flat().slice(0, 3);
    }

    return patterns;
  }

  sampleQuantitativePatterns() {
    const samples = [];
    const patternTypes = Object.keys(this.knowledgeBase.quantitative_patterns);

    patternTypes.forEach(type => {
      const pattern = this.knowledgeBase.quantitative_patterns[type];
      if (pattern.examples && pattern.examples.length > 0) {
        samples.push({
          type: type,
          examples: pattern.examples.slice(0, 2)
        });
      }
    });

    return samples;
  }

  /**
   * Build the generation prompt for Claude API
   */
  buildGenerationPrompt(caseType, difficulty, patterns, industry, firmStyle) {
    return `You are an expert case interview creator for top management consulting firms (McKinsey, BCG, Bain).

TASK: Generate a NEW, UNIQUE consulting case interview.

CASE SPECIFICATIONS:
- Case Type: ${caseType}
- Difficulty: ${difficulty}
- Industry: ${industry || 'Choose a realistic industry'}
- Firm Style: ${firmStyle || 'BCG style (structured, data-driven)'}
- Duration: 30-40 minutes

USE THIS KNOWLEDGE BASE from ${this.knowledgeBase.total_cases_analyzed} real cases:

OPENING STATEMENT EXAMPLES (for inspiration, create your own):
${JSON.stringify(patterns.opening_examples, null, 2)}

EXPECTED FRAMEWORKS for ${caseType} cases:
${JSON.stringify(patterns.frameworks, null, 2)}

QUANTITATIVE QUESTION PATTERNS:
${JSON.stringify(patterns.quantitative_examples, null, 2)}

${patterns.industry_context ? `INDUSTRY CONTEXT (${patterns.industry_context.name}):
${JSON.stringify(patterns.industry_context, null, 2)}` : ''}

CLARIFYING INFORMATION PATTERNS:
${JSON.stringify(patterns.clarifying_patterns, null, 2)}

BRAINSTORMING PATTERNS:
${JSON.stringify(patterns.brainstorming_prompts, null, 2)}

CRITICAL INSTRUCTIONS:
1. Create a COMPLETELY NEW case (not a copy of examples)
2. Combine elements from different patterns to create variety
3. Use REALISTIC numbers, company names, and scenarios
4. Include 2-3 quantitative questions with clear solutions
5. Make difficulty appropriate: ${difficulty === 'easy' ? 'straightforward calculations, clear structure' : difficulty === 'medium' ? 'requires framework thinking, moderate calculations' : 'complex analysis, multi-step calculations, requires insights'}
6. Follow consulting interview best practices
7. Include interviewer guidance (hints, common mistakes)

OUTPUT FORMAT (return ONLY valid JSON, no markdown):
{
  "case_id": "case_${caseType}_${Date.now()}",
  "generated_at": "${new Date().toISOString()}",
  "metadata": {
    "case_type": "${caseType}",
    "industry": "string",
    "difficulty": "${difficulty}",
    "duration": 35,
    "firm_style": "${firmStyle || 'BCG'}",
    "round": 2
  },
  "prompt": "Compelling opening statement (3-5 sentences)",
  "clarifying_information": {
    "objective": "Clear objective statement",
    "timeline": "Decision timeline",
    "client_context": {
      "name": "Company name",
      "business": "What they do",
      "geography": "Where they operate",
      "recent_situation": "Context"
    },
    "additional_data_to_reveal": {
      "revenue": "€XXM",
      "employees": "X,XXX",
      "market_position": "Description",
      "other_key_facts": "..."
    }
  },
  "framework_guidance": {
    "expected_frameworks": ["Primary framework", "Alternative"],
    "key_factors": ["Factor 1", "Factor 2", "Factor 3"],
    "mece_breakdown_example": "How to structure the problem"
  },
  "questions": [
    {
      "question_number": 1,
      "question_text": "Specific quantitative question",
      "exhibit": {
        "type": "table|chart|text",
        "title": "Exhibit title",
        "data": {}
      },
      "solution": {
        "approach": "How to solve",
        "calculation": "Step-by-step math",
        "answer": "Final answer",
        "insight": "Business insight"
      },
      "guidance_for_interviewer": "When to give hints"
    },
    {
      "question_number": 2,
      "question_text": "Second question...",
      "solution": {
        "approach": "...",
        "calculation": "...",
        "answer": "...",
        "insight": "..."
      }
    }
  ],
  "brainstorming": {
    "prompt": "What risks/factors should be considered?",
    "categories": {
      "Financial": ["Risk 1", "Risk 2"],
      "Operational": ["Risk 3", "Risk 4"],
      "Market": ["Risk 5", "Risk 6"]
    },
    "strong_answers": ["Answer 1", "Answer 2", "Answer 3"]
  },
  "conclusion": {
    "recommendation_framework": {
      "clear_answer": "Go/No-go with rationale",
      "key_risks": "Top 3 risks",
      "financial_impact": "Quantified outcome",
      "next_steps": "3-5 specific actions",
      "timeline": "Implementation phases"
    },
    "sample_strong_answer": "Example of excellent answer (2-3 sentences)"
  },
  "interviewer_notes": {
    "common_mistakes": ["Mistake 1", "Mistake 2", "Mistake 3"],
    "hints_if_stuck": ["Hint 1", "Hint 2", "Hint 3"],
    "what_good_looks_like": "Description of strong performance"
  }
}

Generate the case now. Return ONLY the JSON object, no additional text.`;
  }

  /**
   * Post-process the generated case
   */
  postProcess(generatedCase, caseType, difficulty) {
    // Add metadata
    generatedCase.case_id = `case_${caseType}_${Date.now()}`;
    generatedCase.generated_at = new Date().toISOString();

    // Ensure metadata
    if (!generatedCase.metadata) {
      generatedCase.metadata = {};
    }
    generatedCase.metadata.case_type = caseType;
    generatedCase.metadata.difficulty = difficulty;

    // Validate required fields
    const required = ['prompt', 'clarifying_information', 'framework_guidance', 'questions'];
    required.forEach(field => {
      if (!generatedCase[field]) {
        console.warn(`⚠️  Missing field: ${field}`);
      }
    });

    return generatedCase;
  }

  /**
   * Save generated case to file
   */
  saveCase(generatedCase) {
    const casesDir = path.join(__dirname, '../data/generated_cases');
    if (!fs.existsSync(casesDir)) {
      fs.mkdirSync(casesDir, { recursive: true });
    }

    const filename = `${generatedCase.case_id}.json`;
    const filepath = path.join(casesDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(generatedCase, null, 2));
    console.log(`✓ Saved case to ${filepath}`);

    return filepath;
  }
}

module.exports = CaseGenerator;
