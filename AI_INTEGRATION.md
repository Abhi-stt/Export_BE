# AI Integration Documentation

## Overview

This backend implements a two-step AI processing pipeline for document analysis and compliance checking:

1. **Step 1 (OCR)**: Gemini 1.5 Pro extracts structured text from images or PDFs
2. **Step 2 (Reasoning/Compliance)**: GPT-4 Turbo or Claude 3 Sonnet analyzes compliance

## Architecture

```
Document Upload → Gemini 1.5 Pro (OCR) → GPT-4/Claude (Compliance) → Results Stored
```

## AI Services Setup

### 1. Gemini 1.5 Pro (Google AI)

**Purpose**: OCR and structured text extraction from documents

**Setup**:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Add to your `.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

**Features**:
- Extracts text from PDFs and images
- Structures data based on document type (invoice, BOE, etc.)
- Identifies entities (companies, amounts, dates, etc.)
- Provides confidence scores

### 2. GPT-4 Turbo (OpenAI)

**Purpose**: Compliance analysis and reasoning

**Setup**:
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an API key
3. Add to your `.env` file:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   COMPLIANCE_AI_PROVIDER=openai
   ```

**Features**:
- Analyzes document compliance with trade regulations
- Identifies errors and suggests corrections
- Provides detailed compliance scoring
- Offers recommendations for improvements

### 3. Claude 3 Sonnet (Anthropic)

**Purpose**: Alternative compliance analysis provider

**Setup**:
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. Add to your `.env` file:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   COMPLIANCE_AI_PROVIDER=anthropic
   ```

**Features**:
- Similar to GPT-4 Turbo but with different reasoning approach
- Strong performance on compliance analysis
- Can be used as primary or fallback provider

## Environment Configuration

```env
# Step 1: Gemini 1.5 Pro for OCR
GEMINI_API_KEY=your_gemini_api_key_here

# Step 2: Choose your compliance provider
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
COMPLIANCE_AI_PROVIDER=openai  # or 'anthropic'
```

## API Endpoints

### Document Processing

#### Upload Document with AI Processing
```http
POST /api/documents/upload
Content-Type: multipart/form-data

# File will be automatically processed through AI pipeline
```

#### Reprocess Document
```http
POST /api/documents/:id/reprocess
Authorization: Bearer <token>

# Reprocesses document through AI pipeline
```

#### Get Processing Status
```http
GET /api/documents/:id/processing-status
Authorization: Bearer <token>

# Returns current processing status and results
```

### HS Code Suggestions

#### Get AI-Powered HS Code Suggestions
```http
POST /api/hs-codes/suggest
Content-Type: application/json
Authorization: Bearer <token>

{
  "productDescription": "Smartphone with 128GB storage",
  "additionalInfo": "Android device, made in China"
}
```

## Document Processing Flow

### 1. Document Upload
```javascript
// User uploads document
const formData = new FormData();
formData.append('document', file);
formData.append('documentType', 'invoice');

fetch('/api/documents/upload', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 2. AI Processing Pipeline

#### Step 1: OCR with Gemini 1.5 Pro
- Document is sent to Gemini 1.5 Pro
- Text is extracted and structured based on document type
- Entities are identified and confidence scores assigned
- Results stored in `structuredData` and `ocrMetadata` fields

#### Step 2: Compliance Analysis
- Extracted data is sent to GPT-4 Turbo or Claude 3 Sonnet
- Compliance rules are checked against document content
- Errors, corrections, and recommendations are generated
- Results stored in `complianceAnalysis` and related fields

### 3. Results Storage

The processed document contains:

```javascript
{
  // Original document info
  "originalName": "invoice.pdf",
  "status": "completed",
  
  // Step 1 Results (Gemini OCR)
  "extractedText": "Full extracted text...",
  "structuredData": {
    "documentType": "invoice",
    "invoiceNumber": "INV-2024-001",
    "items": [...],
    // ... structured data
  },
  "entities": [
    {
      "type": "company",
      "value": "ABC Corp",
      "confidence": 95
    }
  ],
  "ocrMetadata": {
    "model": "gemini-1.5-pro",
    "processingTime": 1234567890
  },
  
  // Step 2 Results (GPT-4/Claude Compliance)
  "complianceAnalysis": {
    "isValid": true,
    "score": 85,
    "checks": [
      {
        "name": "Invoice Number Check",
        "passed": true,
        "message": "Invoice number is present",
        "severity": "info"
      }
    ]
  },
  "complianceErrors": [],
  "complianceCorrections": [],
  "complianceRecommendations": [],
  
  // Processing Summary
  "aiProcessingResults": {
    "step1_ocr": {
      "provider": "gemini-1.5-pro",
      "success": true,
      "confidence": 90,
      "entitiesFound": 5
    },
    "step2_compliance": {
      "provider": "openai",
      "success": true,
      "complianceScore": 85,
      "issuesFound": 0
    },
    "totalProcessingTime": 15,
    "completedAt": "2024-01-15T10:30:00Z"
  }
}
```

## Error Handling

### Common Issues

1. **Missing API Keys**
   ```javascript
   {
     "success": false,
     "error": "No AI provider configured for compliance analysis"
   }
   ```

2. **OCR Failure**
   ```javascript
   {
     "success": false,
     "error": "OCR failed: Invalid file format"
   }
   ```

3. **Compliance Analysis Failure**
   ```javascript
   {
     "success": false,
     "error": "Compliance analysis failed: Rate limit exceeded"
   }
   ```

### Fallback Behavior

- If Gemini OCR fails, document status is set to "failed"
- If compliance analysis fails, basic analysis is provided
- Processing continues with available results

## Monitoring and Logging

### Processing Logs
```javascript
console.log('Starting AI processing for document: invoice.pdf');
console.log('Step 1: Extracting text with Gemini 1.5 Pro...');
console.log('Step 1 completed: Text extracted successfully');
console.log('Step 2: Analyzing compliance...');
console.log('Step 2 completed: Document processing finished in 15s');
```

### Performance Metrics
- OCR processing time
- Compliance analysis time
- Total processing time
- Success/failure rates
- Confidence scores

## Cost Optimization

### API Usage
- **Gemini 1.5 Pro**: Charged per input token and image
- **GPT-4 Turbo**: Charged per input/output token
- **Claude 3 Sonnet**: Charged per input/output token

### Optimization Strategies
1. **Document Size Limits**: Limit file sizes to reduce processing costs
2. **Batch Processing**: Process multiple documents together when possible
3. **Caching**: Cache results for similar documents
4. **Provider Selection**: Choose cost-effective provider based on needs

## Security Considerations

### API Key Security
- Store API keys in environment variables only
- Never commit API keys to version control
- Rotate keys regularly
- Use separate keys for development and production

### Data Privacy
- Documents are processed by third-party AI services
- Ensure compliance with data protection regulations
- Consider on-premises alternatives for sensitive documents
- Implement data retention policies

## Testing

### Unit Tests
```javascript
// Test AI processor
const aiProcessor = new AIProcessor();
const result = await aiProcessor.processDocument(documentId);
expect(result.success).toBe(true);
```

### Integration Tests
```javascript
// Test full pipeline
const response = await request(app)
  .post('/api/documents/upload')
  .attach('document', 'test-invoice.pdf')
  .expect(200);
```

## Troubleshooting

### Common Issues

1. **"No AI provider configured"**
   - Check that API keys are set in environment variables
   - Verify COMPLIANCE_AI_PROVIDER is set correctly

2. **"OCR failed: Invalid file format"**
   - Ensure file is PDF or supported image format
   - Check file size limits

3. **"Rate limit exceeded"**
   - Implement request queuing
   - Consider upgrading API plans
   - Add retry logic with exponential backoff

### Debug Mode

Set environment variable for detailed logging:
```env
LOG_LEVEL=debug
```

This will provide detailed information about AI processing steps.

## Future Enhancements

1. **Additional AI Providers**: Support for other OCR and analysis services
2. **Custom Models**: Fine-tuned models for specific document types
3. **Real-time Processing**: WebSocket-based real-time processing updates
4. **Batch Operations**: Bulk document processing capabilities
5. **Analytics Dashboard**: AI processing metrics and insights

## Support

For issues with AI integration:
1. Check API key configuration
2. Review logs for detailed error messages
3. Consult AI provider documentation
4. Contact support team with processing logs