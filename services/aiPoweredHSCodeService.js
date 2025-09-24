const PureWebScrapingHSCode = require('./realDataServices/pureWebScrapingHSCode');
const ComplianceService = require('./compliance');

class AIPoweredHSCodeService {
  constructor() {
    this.webScraper = new PureWebScrapingHSCode();
    this.complianceService = new ComplianceService();
  }

  /**
   * Get perfect HS code using AI + Government data
   * @param {string} productDescription - Product description
   * @param {string} additionalInfo - Additional information
   * @returns {Promise<Object>} Perfect HS code with structure
   */
  async getPerfectHSCode(productDescription, additionalInfo = '') {
    try {
      console.log(`🤖 AI-Powered HS Code search for: ${productDescription}`);
      
      // Step 1: Get government data first
      const governmentData = await this.webScraper.getHSCode(productDescription);
      
      // Step 2: Get AI suggestions
      const aiSuggestions = await this.complianceService.suggestHSCodes(productDescription, additionalInfo);
      
      // Step 3: Combine and enhance with AI analysis
      const enhancedResult = await this.enhanceWithAI(
        governmentData, 
        aiSuggestions, 
        productDescription, 
        additionalInfo
      );
      
      return enhancedResult;
      
    } catch (error) {
      console.error('❌ AI-Powered HS Code Error:', error.message);
      return {
        success: false,
        error: `AI-powered HS code search failed: ${error.message}`,
        metadata: {
          source: 'AI-Powered + Government Data',
          realData: false,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Enhance government data with AI analysis
   * @param {Object} governmentData - Government HS code data
   * @param {Object} aiSuggestions - AI suggestions
   * @param {string} productDescription - Product description
   * @param {string} additionalInfo - Additional information
   * @returns {Promise<Object>} Enhanced result
   */
  async enhanceWithAI(governmentData, aiSuggestions, productDescription, additionalInfo) {
    try {
      // If government data is successful, enhance it with AI
      if (governmentData.success && governmentData.hsCode) {
        const enhancedHSCode = await this.enhanceGovernmentDataWithAI(
          governmentData.hsCode, 
          productDescription, 
          additionalInfo
        );
        
        return {
          success: true,
          hsCode: enhancedHSCode,
          metadata: {
            source: 'AI-Enhanced Government Data',
            realData: true,
            aiEnhanced: true,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      // If government data fails, use AI as fallback
      if (aiSuggestions.success && aiSuggestions.suggestions.length > 0) {
        const bestAISuggestion = aiSuggestions.suggestions[0];
        
        return {
          success: true,
          hsCode: {
            code: bestAISuggestion.code,
            description: bestAISuggestion.description,
            chapter: this.extractChapter(bestAISuggestion.code),
            heading: this.extractHeading(bestAISuggestion.code),
            subHeading: this.extractSubHeading(bestAISuggestion.code),
            tariffItem: bestAISuggestion.code,
            category: bestAISuggestion.category,
            confidence: bestAISuggestion.confidence,
            source: 'AI Fallback',
            structure: {
              chapter: this.extractChapter(bestAISuggestion.code),
              heading: this.extractHeading(bestAISuggestion.code),
              subHeading: this.extractSubHeading(bestAISuggestion.code),
              tariffItem: bestAISuggestion.code
            },
            aiReasoning: aiSuggestions.reasoning,
            allSuggestions: aiSuggestions.suggestions
          },
          metadata: {
            source: 'AI Fallback',
            realData: false,
            aiEnhanced: true,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      // Both failed
      return {
        success: false,
        error: 'Both government data and AI suggestions failed',
        metadata: {
          source: 'AI-Powered + Government Data',
          realData: false,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ AI Enhancement Error:', error.message);
      return {
        success: false,
        error: `AI enhancement failed: ${error.message}`,
        metadata: {
          source: 'AI-Powered + Government Data',
          realData: false,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Enhance government data with AI analysis
   * @param {Object} hsCode - Government HS code data
   * @param {string} productDescription - Product description
   * @param {string} additionalInfo - Additional information
   * @returns {Promise<Object>} Enhanced HS code
   */
  async enhanceGovernmentDataWithAI(hsCode, productDescription, additionalInfo) {
    try {
      // Create AI prompt for validation and enhancement
      const prompt = `As an expert in HS (Harmonized System) codes, validate and enhance the following government HS code data:

GOVERNMENT DATA:
- HS Code: ${hsCode.code}
- Description: ${hsCode.description}
- Chapter: ${hsCode.chapter || hsCode.structure?.chapter || 'N/A'}
- Heading: ${hsCode.heading || hsCode.structure?.heading || 'N/A'}
- Sub-heading: ${hsCode.subHeading || hsCode.structure?.subHeading || 'N/A'}
- Tariff Item: ${hsCode.tariffItem || hsCode.structure?.tariffItem || 'N/A'}
- Source: ${hsCode.source}
- Confidence: ${hsCode.confidence}%

PRODUCT DESCRIPTION: ${productDescription}
ADDITIONAL INFO: ${additionalInfo}

Please validate this government data and provide enhancements in the following JSON format:
{
  "validation": {
    "isAccurate": boolean,
    "confidence": number (0-100),
    "reasoning": "string explaining validation"
  },
  "enhancement": {
    "improvedDescription": "string",
    "additionalDetails": "string",
    "gstRates": {
      "cgst": "string",
      "sgst": "string", 
      "igst": "string"
    },
    "dutyRate": "string",
    "restrictions": ["string"],
    "similarProducts": ["string"]
  },
  "structure": {
    "chapter": "string",
    "heading": "string",
    "subHeading": "string",
    "tariffItem": "string"
  }
}`;

      let aiResult;
      if (this.complianceService.preferredProvider === 'anthropic' && this.complianceService.anthropic) {
        aiResult = await this.complianceService.analyzeWithClaude(prompt);
      } else if (this.complianceService.openai) {
        aiResult = await this.complianceService.analyzeWithGPT4(prompt);
      } else {
        // No AI available, return government data as-is
        return hsCode;
      }

      const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResult = JSON.parse(jsonMatch[0]);
        
        // Enhance the government data with AI insights
        return {
          ...hsCode,
          description: parsedResult.enhancement?.improvedDescription || hsCode.description,
          chapter: parsedResult.structure?.chapter || hsCode.chapter || hsCode.structure?.chapter,
          heading: parsedResult.structure?.heading || hsCode.heading || hsCode.structure?.heading,
          subHeading: parsedResult.structure?.subHeading || hsCode.subHeading || hsCode.structure?.subHeading,
          tariffItem: parsedResult.structure?.tariffItem || hsCode.tariffItem || hsCode.structure?.tariffItem,
          confidence: Math.max(hsCode.confidence, parsedResult.validation?.confidence || hsCode.confidence),
          dutyRate: parsedResult.enhancement?.dutyRate || hsCode.dutyRate,
          restrictions: parsedResult.enhancement?.restrictions || hsCode.restrictions || [],
          similarProducts: parsedResult.enhancement?.similarProducts || hsCode.similarProducts || [],
          gstRates: {
            ...hsCode.gstRates,
            ...parsedResult.enhancement?.gstRates
          },
          structure: {
            chapter: parsedResult.structure?.chapter || hsCode.chapter || hsCode.structure?.chapter,
            heading: parsedResult.structure?.heading || hsCode.heading || hsCode.structure?.heading,
            subHeading: parsedResult.structure?.subHeading || hsCode.subHeading || hsCode.structure?.subHeading,
            tariffItem: parsedResult.structure?.tariffItem || hsCode.tariffItem || hsCode.structure?.tariffItem
          },
          aiValidation: parsedResult.validation,
          aiEnhancement: parsedResult.enhancement,
          source: `${hsCode.source} + AI Enhanced`
        };
      }
      
      // If AI parsing fails, return government data as-is
      return hsCode;
      
    } catch (error) {
      console.warn('⚠️  AI enhancement failed, returning government data:', error.message);
      return hsCode;
    }
  }

  /**
   * Extract chapter from HS code
   * @param {string} hsCode - HS code
   * @returns {string} Chapter
   */
  extractChapter(hsCode) {
    if (!hsCode) return '';
    const digits = hsCode.replace(/\./g, '');
    return digits.substring(0, 2);
  }

  /**
   * Extract heading from HS code
   * @param {string} hsCode - HS code
   * @returns {string} Heading
   */
  extractHeading(hsCode) {
    if (!hsCode) return '';
    const digits = hsCode.replace(/\./g, '');
    return digits.substring(0, 4);
  }

  /**
   * Extract sub-heading from HS code
   * @param {string} hsCode - HS code
   * @returns {string} Sub-heading
   */
  extractSubHeading(hsCode) {
    if (!hsCode) return '';
    const digits = hsCode.replace(/\./g, '');
    return digits.substring(0, 6);
  }
}

module.exports = AIPoweredHSCodeService;

