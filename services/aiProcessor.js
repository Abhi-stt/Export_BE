const GeminiService = require('./gemini');
const ComplianceService = require('./compliance');
const { Document } = require('../schemas');

class AIProcessor {
  constructor() {
    this.geminiService = new GeminiService();
    this.complianceService = new ComplianceService();
  }

  /**
   * Process document with two-step AI pipeline
   * Step 1: Gemini 1.5 Pro for OCR/text extraction
   * Step 2: GPT-4 Turbo or Claude 3 Sonnet for compliance analysis
   * @param {string} documentId - MongoDB document ID
   * @returns {Promise<Object>} Processing results
   */
  async processDocument(documentId) {
    try {
      // Get document from database
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      console.log(`Starting AI processing for document: ${document.originalName}`);

      // Update document status
      document.status = 'processing';
      document.processingStartTime = new Date();
      await document.save();

      const startTime = Date.now();

      // Step 1: Extract text using Gemini 1.5 Pro
      console.log('Step 1: Extracting text with Gemini 1.5 Pro...');
      let ocrResult = await this.geminiService.extractTextFromDocument(
        document.filePath,
        document.fileType,
        document.documentType
      );

      // If OCR fails, use fallback processing
      if (!ocrResult.success) {
        console.warn('⚠️  OCR failed, using fallback processing...');
        ocrResult = await this.geminiService.getFallbackProcessing(
          document.filePath,
          document.documentType
        );
      }

      // Update document with OCR results
      document.extractedText = ocrResult.extractedText;
      document.entities = ocrResult.entities;
      document.confidence = ocrResult.confidence;
      document.ocrMetadata = ocrResult.metadata;
      document.structuredData = ocrResult.structuredData;
      await document.save();

      console.log('Step 1 completed: Text extracted successfully');

      // Step 2: Analyze compliance using GPT-4 Turbo or Claude 3 Sonnet
      console.log('Step 2: Analyzing compliance...');
      let complianceResult = await this.complianceService.analyzeCompliance(
        ocrResult.structuredData || { extractedText: ocrResult.extractedText },
        document.documentType
      );

      // If compliance analysis fails, use fallback
      if (!complianceResult.success) {
        console.warn('⚠️  Compliance analysis failed, using fallback...');
        complianceResult = await this.complianceService.getFallbackCompliance(
          ocrResult.structuredData || { extractedText: ocrResult.extractedText },
          document.documentType
        );
      }

      // Update document with compliance results
      document.complianceAnalysis = complianceResult.compliance;
      document.complianceErrors = complianceResult.errors || [];
      document.complianceCorrections = complianceResult.corrections || [];
      document.complianceSummary = complianceResult.summary;
      document.complianceRecommendations = complianceResult.recommendations || [];
      document.complianceMetadata = complianceResult.metadata;

      // Calculate final processing results
      const endTime = Date.now();
      const processingTime = Math.round((endTime - startTime) / 1000); // in seconds

      document.status = 'completed';
      document.processingTime = processingTime;
      document.processingEndTime = new Date();
      document.aiProcessingResults = {
        step1_ocr: {
          provider: 'gemini-1.5-pro',
          success: ocrResult.success,
          confidence: ocrResult.confidence,
          entitiesFound: ocrResult.entities?.length || 0
        },
        step2_compliance: {
          provider: complianceResult.metadata?.provider || 'unknown',
          success: complianceResult.success,
          complianceScore: complianceResult.compliance?.score || 0,
          issuesFound: complianceResult.errors?.length || 0
        },
        totalProcessingTime: processingTime,
        completedAt: new Date()
      };

      await document.save();

      console.log(`Step 2 completed: Document processing finished in ${processingTime}s`);

      return {
        success: true,
        documentId: document._id,
        processingTime: processingTime,
        results: {
          ocr: ocrResult,
          compliance: complianceResult,
          finalStatus: document.status,
          confidence: document.confidence
        },
        message: 'Document processed successfully with AI pipeline'
      };

    } catch (error) {
      console.error('AI Processing Error:', error);

      // Update document status to failed
      try {
        const document = await Document.findById(documentId);
        if (document) {
          document.status = 'failed';
          document.processingEndTime = new Date();
          document.processingError = error.message;
          await document.save();
        }
      } catch (updateError) {
        console.error('Error updating document status:', updateError);
      }

      return {
        success: false,
        documentId: documentId,
        error: error.message,
        message: 'Document processing failed'
      };
    }
  }



  /**
   * Reprocess document with AI pipeline
   * @param {string} documentId - MongoDB document ID
   * @returns {Promise<Object>} Reprocessing results
   */
  async reprocessDocument(documentId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Reset processing fields
      document.status = 'pending';
      document.processingError = null;
      document.extractedText = '';
      document.entities = [];
      document.confidence = 0;
      document.complianceAnalysis = null;
      document.complianceErrors = [];
      document.complianceCorrections = [];
      await document.save();

      console.log(`Reprocessing document: ${document.originalName}`);

      // Process with AI pipeline
      return await this.processDocument(documentId);

    } catch (error) {
      console.error('Reprocessing Error:', error);
      return {
        success: false,
        documentId: documentId,
        error: error.message,
        message: 'Document reprocessing failed'
      };
    }
  }

  /**
   * Get HS Code suggestions using AI
   * @param {string} productDescription - Product description
   * @param {string} additionalInfo - Additional information
   * @returns {Promise<Object>} HS code suggestions
   */
  async getHSCodeSuggestions(productDescription, additionalInfo = '') {
    try {
      console.log(`Getting HS code suggestions for: ${productDescription}`);
      
      let result = await this.complianceService.suggestHSCodes(
        productDescription, 
        additionalInfo
      );

      // If API fails, use fallback
      if (!result.success) {
        console.warn('⚠️  HS Code API failed, using fallback...');
        result = await this.complianceService.getFallbackHSCodes(
          productDescription, 
          additionalInfo
        );
      }

      return result;

    } catch (error) {
      console.error('HS Code Suggestion Error:', error);
      // Use fallback on any error
      try {
        console.warn('⚠️  Using fallback HS codes due to error...');
        return await this.complianceService.getFallbackHSCodes(
          productDescription, 
          additionalInfo
        );
      } catch (fallbackError) {
        return {
          success: false,
          error: error.message,
          suggestions: [],
          reasoning: '',
          message: 'HS code suggestion failed'
        };
      }
    }
  }

  /**
   * Batch process multiple documents
   * @param {Array<string>} documentIds - Array of document IDs
   * @returns {Promise<Object>} Batch processing results
   */
  async batchProcessDocuments(documentIds) {
    const results = [];
    const startTime = Date.now();

    console.log(`Starting batch processing of ${documentIds.length} documents`);

    for (const documentId of documentIds) {
      try {
        const result = await this.processDocument(documentId);
        results.push({
          documentId,
          success: result.success,
          processingTime: result.processingTime,
          error: result.error || null
        });
      } catch (error) {
        results.push({
          documentId,
          success: false,
          processingTime: 0,
          error: error.message
        });
      }
    }

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`Batch processing completed: ${successCount} succeeded, ${failureCount} failed`);

    return {
      success: true,
      totalDocuments: documentIds.length,
      successCount,
      failureCount,
      totalProcessingTime: totalTime,
      results,
      message: `Batch processing completed: ${successCount}/${documentIds.length} documents processed successfully`
    };
  }

  /**
   * Get processing status for a document
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Processing status
   */
  async getProcessingStatus(documentId) {
    try {
      const document = await Document.findById(documentId)
        .select('status processingTime confidence aiProcessingResults processingError extractedText entities complianceAnalysis complianceErrors complianceCorrections complianceRecommendations')
        .lean();

      if (!document) {
        return {
          success: false,
          error: 'Document not found'
        };
      }

      return {
        success: true,
        status: document.status,
        processingTime: document.processingTime,
        confidence: document.confidence,
        extractedText: document.extractedText,
        entities: document.entities,
        complianceAnalysis: document.complianceAnalysis,
        complianceErrors: document.complianceErrors,
        complianceCorrections: document.complianceCorrections,
        complianceRecommendations: document.complianceRecommendations,
        aiProcessingResults: document.aiProcessingResults,
        error: document.processingError
      };

    } catch (error) {
      console.error('Error getting processing status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = AIProcessor;