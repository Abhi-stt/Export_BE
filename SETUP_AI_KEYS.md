# AI API Keys Setup Guide

## 🚀 Quick Setup for Real AI Processing

### 1. 🤖 Gemini 1.5 Pro (Google AI) - For OCR

**Get Your API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

**Add to .env file:**
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. 🧠 GPT-4 Turbo (OpenAI) - For Compliance Analysis

**Get Your API Key:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the generated key (starts with sk-...)

**Add to .env file:**
```env
OPENAI_API_KEY=your_openai_api_key_here
COMPLIANCE_AI_PROVIDER=openai
```

### 3. 🔄 Alternative: Claude 3 Sonnet (Anthropic)

**Get Your API Key:**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create an account
3. Go to API Keys section
4. Create a new API key

**Add to .env file:**
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
COMPLIANCE_AI_PROVIDER=anthropic
```

## 📝 Complete .env Configuration

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://Abhi:Abhi%402003@export.ouj8jvu.mongodb.net/?retryWrites=true&w=majority&appName=Export
MONGODB_DB_NAME=export_project

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# 🤖 AI Service Configuration
# Step 1: Gemini 1.5 Pro for OCR
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Step 2: Compliance Analysis (Choose one)
OPENAI_API_KEY=your_actual_openai_api_key_here
# OR
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here

# Preferred AI provider (openai or anthropic)
COMPLIANCE_AI_PROVIDER=openai
```

## 🔄 After Adding API Keys

1. **Restart the backend server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **You should see:**
   ```
   ✅ Gemini service initialized successfully
   ✅ OpenAI service initialized successfully
   Server running on port 5000
   ```

3. **Test with real document upload** - you'll now get:
   - Real OCR from Gemini 1.5 Pro
   - Real compliance analysis from GPT-4/Claude
   - Actual confidence scores
   - Real entity extraction

## 💰 Cost Considerations

### Gemini 1.5 Pro (Google AI)
- **Very affordable** for OCR
- Free tier available
- ~$0.001-0.01 per document

### GPT-4 Turbo (OpenAI)  
- **Moderate cost** for compliance analysis
- ~$0.01-0.10 per document
- Pay-per-use pricing

### Claude 3 Sonnet (Anthropic)
- **Similar to GPT-4** pricing
- Good alternative option
- ~$0.01-0.10 per document

## 🔧 Troubleshooting

### Invalid API Key Errors
```
API key not valid. Please pass a valid API key.
```
**Solution:** Check that you've copied the API key correctly to .env file

### Rate Limiting
```
Rate limit exceeded
```
**Solution:** Wait a moment or upgrade to paid plan

### Service Unavailable
```
Service temporarily unavailable
```
**Solution:** Check service status pages, try again later

## 🚀 Development vs Production

### Development Mode
- Use fallback processing (no API keys needed)
- Perfect for UI testing and development
- Instant results with realistic demo data

### Production Mode  
- Use real API keys for actual AI processing
- Real OCR and compliance analysis
- Accurate confidence scores and entity extraction
