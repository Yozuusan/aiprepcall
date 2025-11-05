/**
 * Claude API Wrapper
 * Handles communication with Anthropic API
 */

const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

class ClaudeAPI {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    this.model = 'claude-sonnet-4-20250514';
    this.maxTokens = 8000;
  }

  /**
   * Generate a case using Claude API
   */
  async generateCase(prompt) {
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Extract response
      const responseText = message.content[0].text;

      // Parse JSON (remove markdown if present)
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const caseData = JSON.parse(cleanedText);

      return caseData;

    } catch (error) {
      console.error('❌ Claude API Error:', error.message);

      if (error.response) {
        console.error('Response:', error.response.data);
      }

      throw error;
    }
  }

  /**
   * Validate API key
   */
  async validateKey() {
    try {
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = ClaudeAPI;
