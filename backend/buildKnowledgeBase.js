/**
 * Knowledge Base Builder
 * Consolidates patterns from all extracted cases into a reusable knowledge base
 */

const fs = require('fs');
const path = require('path');

class KnowledgeBaseBuilder {
  constructor() {
    this.knowledgeBase = {
      version: "1.0",
      last_updated: new Date().toISOString(),
      total_cases_analyzed: 0,
      sources: [],
      case_structures: [],
      opening_patterns: {},
      framework_approaches: {},
      clarifying_questions_patterns: [],
      quantitative_patterns: {},
      industry_contexts: {},
      brainstorming_categories: {},
      conclusion_formats: [],
      interviewer_behaviors: {},
      firm_styles: {}
    };
  }

  /**
   * Load extracted cases from Python extraction
   */
  loadExtractedCases() {
    const extractedPath = path.join(__dirname, '../data/extracted_cases.json');

    if (!fs.existsSync(extractedPath)) {
      throw new Error('No extracted cases found. Run extractPDFs.py first.');
    }

    const data = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));
    return data.cases;
  }

  /**
   * Build the complete knowledge base
   */
  build() {
    console.log('\n🧠 Building Knowledge Base...\n');

    const cases = this.loadExtractedCases();
    this.knowledgeBase.total_cases_analyzed = cases.length;

    // Process each case
    cases.forEach((caseData, index) => {
      if (index % 10 === 0) {
        console.log(`  Processing case ${index + 1}/${cases.length}...`);
      }

      this.extractStructurePatterns(caseData);
      this.extractOpeningPatterns(caseData);
      this.extractFrameworks(caseData);
      this.extractQuantitativePatterns(caseData);
      this.extractIndustryContext(caseData);
      this.extractClarifyingPatterns(caseData);
      this.extractBrainstormingPatterns(caseData);
      this.extractConclusionPatterns(caseData);
    });

    // Consolidate and deduplicate
    this.consolidate();

    // Save knowledge base
    this.save();

    console.log('\n✓ Knowledge Base built successfully!\n');
    this.printSummary();
  }

  /**
   * Extract structure patterns
   */
  extractStructurePatterns(caseData) {
    const structure = {
      has_prompt: !!caseData.prompt,
      has_clarifying: !!caseData.clarifying_info,
      has_framework: caseData.framework && caseData.framework.length > 0,
      has_questions: caseData.questions && caseData.questions.length > 0,
      question_count: caseData.questions ? caseData.questions.length : 0,
      has_exhibits: caseData.exhibits && caseData.exhibits.length > 0,
      has_conclusion: !!caseData.conclusion
    };

    this.knowledgeBase.case_structures.push(structure);
  }

  /**
   * Extract opening statement patterns by case type
   */
  extractOpeningPatterns(caseData) {
    const caseType = caseData.case_type || 'general';
    const prompt = caseData.prompt;

    if (!prompt) return;

    if (!this.knowledgeBase.opening_patterns[caseType]) {
      this.knowledgeBase.opening_patterns[caseType] = [];
    }

    // Extract pattern (replace specific details with placeholders)
    let pattern = prompt;

    // Replace company names
    pattern = pattern.replace(/[A-Z][a-z]+(?:Mart|Corp|Inc|Ltd|Co|Group)/g, '{company}');

    // Replace numbers
    pattern = pattern.replace(/\d+(?:,\d+)*(?:\.\d+)?/g, '{number}');

    // Replace currencies
    pattern = pattern.replace(/[$€£¥]\d+[MBK]?/g, '{currency}');

    // Replace percentages
    pattern = pattern.replace(/\d+%/g, '{percentage}');

    this.knowledgeBase.opening_patterns[caseType].push({
      original: prompt.substring(0, 200),
      pattern: pattern.substring(0, 200)
    });
  }

  /**
   * Extract framework patterns
   */
  extractFrameworks(caseData) {
    const caseType = caseData.case_type || 'general';
    const frameworks = caseData.framework || [];

    if (frameworks.length === 0) return;

    if (!this.knowledgeBase.framework_approaches[caseType]) {
      this.knowledgeBase.framework_approaches[caseType] = {
        primary: [],
        advanced: [],
        examples: []
      };
    }

    frameworks.forEach(fw => {
      // Categorize as primary or advanced
      const isPrimary = /MECE|Revenue|Cost|3Cs|4Ps/.test(fw);

      if (isPrimary) {
        this.knowledgeBase.framework_approaches[caseType].primary.push(fw);
      } else {
        this.knowledgeBase.framework_approaches[caseType].advanced.push(fw);
      }
    });
  }

  /**
   * Extract quantitative patterns
   */
  extractQuantitativePatterns(caseData) {
    const questions = caseData.questions || [];

    questions.forEach(q => {
      const text = q.text || '';

      // Detect calculation types
      if (/revenue|price.*volume|sales/i.test(text)) {
        if (!this.knowledgeBase.quantitative_patterns.revenue_calculation) {
          this.knowledgeBase.quantitative_patterns.revenue_calculation = {
            examples: [],
            formulas: []
          };
        }
        this.knowledgeBase.quantitative_patterns.revenue_calculation.examples.push(text.substring(0, 150));
      }

      if (/market size|TAM|SAM/i.test(text)) {
        if (!this.knowledgeBase.quantitative_patterns.market_sizing) {
          this.knowledgeBase.quantitative_patterns.market_sizing = {
            examples: [],
            approaches: []
          };
        }
        this.knowledgeBase.quantitative_patterns.market_sizing.examples.push(text.substring(0, 150));
      }

      if (/break.*even|profit.*margin/i.test(text)) {
        if (!this.knowledgeBase.quantitative_patterns.profitability_analysis) {
          this.knowledgeBase.quantitative_patterns.profitability_analysis = {
            examples: []
          };
        }
        this.knowledgeBase.quantitative_patterns.profitability_analysis.examples.push(text.substring(0, 150));
      }
    });
  }

  /**
   * Extract industry context
   */
  extractIndustryContext(caseData) {
    const industry = caseData.industry || 'General';

    if (!this.knowledgeBase.industry_contexts[industry]) {
      this.knowledgeBase.industry_contexts[industry] = {
        case_count: 0,
        typical_problems: [],
        example_prompts: []
      };
    }

    this.knowledgeBase.industry_contexts[industry].case_count++;

    if (caseData.prompt) {
      this.knowledgeBase.industry_contexts[industry].example_prompts.push(
        caseData.prompt.substring(0, 200)
      );
    }
  }

  /**
   * Extract clarifying question patterns
   */
  extractClarifyingPatterns(caseData) {
    const clarifying = caseData.clarifying_info;
    if (!clarifying) return;

    // Look for common patterns like "Objective:", "Timeline:", etc.
    const patterns = clarifying.match(/(?:Objective|Timeline|Client|Market|Competition):\s*[^\n]+/gi);

    if (patterns) {
      this.knowledgeBase.clarifying_questions_patterns.push(...patterns);
    }
  }

  /**
   * Extract brainstorming patterns
   */
  extractBrainstormingPatterns(caseData) {
    // Look for brainstorming prompts in the case
    const text = caseData.raw_text || '';
    const brainstormMatches = text.match(/(?:risks?|factors?|considerations?|approaches?).*?\?/gi);

    if (brainstormMatches) {
      brainstormMatches.forEach(match => {
        const category = this.categorizeBrainstorm(match);
        if (!this.knowledgeBase.brainstorming_categories[category]) {
          this.knowledgeBase.brainstorming_categories[category] = [];
        }
        this.knowledgeBase.brainstorming_categories[category].push(match);
      });
    }
  }

  categorizeBrainstorm(text) {
    if (/risk/i.test(text)) return 'risks';
    if (/factor/i.test(text)) return 'factors';
    if (/consider/i.test(text)) return 'considerations';
    if (/approach/i.test(text)) return 'approaches';
    return 'other';
  }

  /**
   * Extract conclusion patterns
   */
  extractConclusionPatterns(caseData) {
    const conclusion = caseData.conclusion;
    if (!conclusion) return;

    this.knowledgeBase.conclusion_formats.push({
      structure: this.analyzeConclusionStructure(conclusion),
      example: conclusion.substring(0, 300)
    });
  }

  analyzeConclusionStructure(text) {
    return {
      has_recommendation: /recommend/i.test(text),
      has_risks: /risk/i.test(text),
      has_next_steps: /next step/i.test(text),
      has_quantification: /\d+[%$€]/i.test(text)
    };
  }

  /**
   * Consolidate and deduplicate patterns
   */
  consolidate() {
    console.log('\n📊 Consolidating patterns...');

    // Deduplicate opening patterns
    Object.keys(this.knowledgeBase.opening_patterns).forEach(caseType => {
      const patterns = this.knowledgeBase.opening_patterns[caseType];
      this.knowledgeBase.opening_patterns[caseType] = this.deduplicateByPattern(patterns);
    });

    // Deduplicate frameworks
    Object.keys(this.knowledgeBase.framework_approaches).forEach(caseType => {
      const fw = this.knowledgeBase.framework_approaches[caseType];
      fw.primary = [...new Set(fw.primary)];
      fw.advanced = [...new Set(fw.advanced)];
    });

    // Keep only unique examples (limit to top 10 per category)
    Object.keys(this.knowledgeBase.quantitative_patterns).forEach(patternType => {
      const pattern = this.knowledgeBase.quantitative_patterns[patternType];
      if (pattern.examples) {
        pattern.examples = [...new Set(pattern.examples)].slice(0, 10);
      }
    });
  }

  deduplicateByPattern(items) {
    const seen = new Set();
    return items.filter(item => {
      const key = item.pattern || item;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Save knowledge base to file
   */
  save() {
    const outputPath = path.join(__dirname, '../data/knowledge_base.json');
    fs.writeFileSync(outputPath, JSON.stringify(this.knowledgeBase, null, 2));
    console.log(`\n✓ Saved to ${outputPath}`);
  }

  /**
   * Print summary statistics
   */
  printSummary() {
    console.log('═══════════════════════════════════════════');
    console.log('KNOWLEDGE BASE SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`Total Cases Analyzed: ${this.knowledgeBase.total_cases_analyzed}`);
    console.log(`\nCase Types Covered:`);

    Object.keys(this.knowledgeBase.opening_patterns).forEach(type => {
      const count = this.knowledgeBase.opening_patterns[type].length;
      console.log(`  ${type}: ${count} patterns`);
    });

    console.log(`\nIndustries:`);
    Object.keys(this.knowledgeBase.industry_contexts).forEach(industry => {
      const count = this.knowledgeBase.industry_contexts[industry].case_count;
      console.log(`  ${industry}: ${count} cases`);
    });

    console.log(`\nQuantitative Patterns: ${Object.keys(this.knowledgeBase.quantitative_patterns).length} types`);
    console.log(`Framework Examples: ${Object.keys(this.knowledgeBase.framework_approaches).length} case types`);
    console.log('═══════════════════════════════════════════\n');
  }
}

// Run if called directly
if (require.main === module) {
  const builder = new KnowledgeBaseBuilder();
  builder.build();
}

module.exports = KnowledgeBaseBuilder;
