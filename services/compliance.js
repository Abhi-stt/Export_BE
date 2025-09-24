const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const QuotaManager = require('./quotaManager');

class ComplianceService {
  constructor() {
    this.quotaManager = new QuotaManager();
    
    // Initialize OpenAI (GPT-4 Turbo)
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        console.log('✅ OpenAI service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize OpenAI service:', error.message);
        this.openai = null;
      }
    } else {
      console.warn('⚠️  OPENAI_API_KEY not configured or using placeholder value');
      this.openai = null;
    }

    // Initialize Anthropic (Claude 3 Sonnet)
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
      try {
        this.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
        console.log('✅ Anthropic service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Anthropic service:', error.message);
        this.anthropic = null;
      }
    } else {
      console.warn('⚠️  ANTHROPIC_API_KEY not configured or using placeholder value');
      this.anthropic = null;
    }

    // Default to GPT-4 Turbo, fallback to Claude
    this.preferredProvider = process.env.COMPLIANCE_AI_PROVIDER || 'openai';
    
    // Log initialization status
    if (this.openai || this.anthropic) {
      console.log(`✅ Compliance service initialized with provider: ${this.preferredProvider}`);
    } else {
      throw new Error('❌ AI providers not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file');
    }
  }

  /**
   * Analyze document compliance using AI
   * @param {Object} extractedData - Data extracted from Gemini OCR
   * @param {string} documentType - Type of document (invoice, BOE, etc.)
   * @returns {Promise<Object>} Compliance analysis results
   */
  async analyzeCompliance(extractedData, documentType) {
    try {
      await this.quotaManager.checkQuota('compliance_analysis');
      
      const prompt = this.buildCompliancePrompt(extractedData, documentType);
      
      let result;
      if (this.preferredProvider === 'anthropic' && this.anthropic) {
        result = await this.analyzeWithClaude(prompt);
      } else if (this.openai) {
        result = await this.analyzeWithGPT4(prompt);
      } else {
        throw new Error('❌ AI providers not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file');
      }

      return this.parseComplianceResult(result, documentType);

    } catch (error) {
      console.error('Compliance Analysis Error:', error);
      
      // If it's an API key error, throw error
      if (error.message && (error.message.includes('Incorrect API key') || error.message.includes('invalid_api_key') || error.status === 401)) {
        throw new Error('❌ Invalid API key. Please check your OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file');
      }
      
      return {
        success: false,
        error: error.message,
        compliance: {
          isValid: false,
          score: 0,
          checks: [],
          errors: [{
            type: 'ai_error',
            field: 'analysis',
            message: 'AI analysis failed',
            severity: 'error',
            requirement: 'AI processing'
          }]
        },
        metadata: {
          provider: this.preferredProvider,
          processingTime: Date.now(),
          error: true
        }
      };
    }
  }

  /**
   * Build compliance analysis prompt
   * @param {Object} extractedData - Extracted data
   * @param {string} documentType - Document type
   * @returns {string} Formatted prompt
   */
  buildCompliancePrompt(extractedData, documentType) {
    return `As an expert in trade compliance and document analysis, analyze the following ${documentType} data for compliance issues:

EXTRACTED DATA:
${JSON.stringify(extractedData, null, 2)}

DOCUMENT TYPE: ${documentType}

Please provide a comprehensive compliance analysis in the following JSON format:
{
  "isValid": boolean,
  "score": number (0-100),
  "checks": [
    {
      "name": "string",
      "passed": boolean,
      "message": "string",
      "severity": "info|warning|error",
      "requirement": "string"
    }
  ],
  "errors": [
    {
      "type": "string",
      "field": "string",
      "message": "string",
      "severity": "info|warning|error",
      "requirement": "string"
    }
  ],
  "corrections": [
    {
      "type": "string",
      "field": "string",
      "message": "string",
      "suggestion": "string",
      "priority": "low|medium|high"
    }
  ],
  "summary": {
    "totalChecks": number,
    "passedChecks": number,
    "failedChecks": number,
    "warningsCount": number,
    "criticalIssues": number
  },
  "recommendations": [
    {
      "category": "string",
      "message": "string",
      "priority": "low|medium|high"
    }
  ]
}

Focus on:
1. Required field completeness
2. Data format validation
3. Business logic consistency
4. Regulatory compliance
5. Document authenticity indicators`;
  }

  /**
   * Analyze with GPT-4 Turbo
   * @param {string} prompt - Analysis prompt
   * @returns {Promise<string>} AI response
   */
  async analyzeWithGPT4(prompt) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in trade compliance and document analysis. Provide accurate, detailed compliance analysis in the requested JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('GPT-4 Analysis Error:', error);
      throw error;
    }
  }

  /**
   * Analyze with Claude 3 Sonnet
   * @param {string} prompt - Analysis prompt
   * @returns {Promise<string>} AI response
   */
  async analyzeWithClaude(prompt) {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Claude Analysis Error:', error);
      throw error;
    }
  }

  /**
   * Parse compliance analysis result
   * @param {string} result - Raw AI response
   * @param {string} documentType - Document type
   * @returns {Object} Parsed compliance result
   */
  parseComplianceResult(result, documentType) {
    try {
      // Try to extract JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResult = JSON.parse(jsonMatch[0]);
        
        return {
          success: true,
          compliance: parsedResult,
          metadata: {
            provider: this.preferredProvider,
            processingTime: Date.now(),
            documentType: documentType
          }
        };
      }

      throw new Error('❌ Failed to parse AI response. Please check your AI provider configuration.');

    } catch (error) {
      console.error('Error parsing compliance result:', error);
      throw new Error('❌ Failed to parse AI response. Please check your AI provider configuration.');
    }
  }

  /**
   * Get HS Code suggestions using AI
   * @param {string} productDescription - Product description
   * @param {string} additionalInfo - Additional product information
   * @returns {Promise<Object>} HS code suggestions
   */
  async suggestHSCodes(productDescription, additionalInfo = '') {
    try {
      const prompt = `As an expert in HS (Harmonized System) codes, provide accurate HS code suggestions for the following product:

PRODUCT DESCRIPTION: ${productDescription}
ADDITIONAL INFO: ${additionalInfo}

Provide 3-5 most relevant HS code suggestions with the following JSON format:
{
  "suggestions": [
    {
      "code": "string (10-digit HS code)",
      "description": "string",
      "confidence": number (0-100),
      "category": "string",
      "dutyRate": "string",
      "restrictions": ["string"],
      "similarProducts": ["string"]
    }
  ],
  "reasoning": "string explaining the selection logic"
}`;

      let result;
      if (this.preferredProvider === 'anthropic' && this.anthropic) {
        result = await this.analyzeWithClaude(prompt);
      } else if (this.openai) {
        result = await this.analyzeWithGPT4(prompt);
      } else {
        throw new Error('❌ AI providers not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file');
      }

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResult = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          suggestions: parsedResult.suggestions || [],
          reasoning: parsedResult.reasoning || '',
          metadata: {
            provider: this.preferredProvider,
            processingTime: Date.now()
          }
        };
      }

      throw new Error('Could not parse HS code suggestions');

    } catch (error) {
      console.error('HS Code Suggestion Error:', error);
      
      // If it's an API key error, throw error
      if (error.message && (error.message.includes('Incorrect API key') || error.message.includes('invalid_api_key') || error.status === 401)) {
        throw new Error('❌ Invalid API key. Please check your OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file');
      }
      
      return {
        success: false,
        error: error.message,
        suggestions: [],
        reasoning: '',
        metadata: {
          provider: this.preferredProvider,
          processingTime: Date.now(),
          error: true
        }
      };
    }
  }
}

module.exports = ComplianceService;
