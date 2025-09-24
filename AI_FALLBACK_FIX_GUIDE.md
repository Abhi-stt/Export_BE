# AI Fallback Fix Guide

## 🚨 Problem: AI Models Falling Back to Fallback Mode

Your AI models are currently falling back to fallback mode instead of using real-time AI processing. This means:

- ❌ Documents are processed with simulated data instead of real AI
- ❌ OCR uses fallback text extraction instead of Gemini 1.5 Pro
- ❌ Compliance analysis uses fallback rules instead of GPT-4/Claude
- ❌ HS code suggestions use fallback data instead of real AI analysis

## 🔍 Root Cause Analysis

The issue is that **API keys are not properly configured**. The system falls back to fallback mode when:

1. **No `.env` file exists** in the BE directory
2. **API keys are not set** or are using placeholder values
3. **API keys are invalid** or have wrong format
4. **API keys don't have proper permissions** or billing

## 🔧 Step-by-Step Fix

### Step 1: Create .env File

1. **Copy the example file:**
   ```bash
   cd BE
   copy env.example .env
   ```

2. **Or create manually:**
   Create a file named `.env` in the `BE` directory with this content:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb+srv://Abhi:Abhi%402003@export.ouj8jvu.mongodb.net/?retryWrites=true&w=majority&appName=Export
   MONGODB_DB_NAME=export_project

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_12345
   JWT_EXPIRES_IN=24h

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000

   # AI Service Configuration
   # Step 1: Gemini 1.5 Pro for OCR (Google AI)
   GEMINI_API_KEY=your_actual_gemini_api_key_here

   # Step 2: Compliance Analysis (Choose one)
   OPENAI_API_KEY=your_actual_openai_api_key_here
   # OR
   ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here

   # Preferred AI provider for compliance analysis (openai or anthropic)
   COMPLIANCE_AI_PROVIDER=openai
   ```

### Step 2: Get Your API Keys

#### 🤖 Gemini API Key (Required for OCR)

1. **Go to:** [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Sign in** with your Google account
3. **Click "Create API Key"**
4. **Copy the key** (should start with `AIza...`)
5. **Update .env file:**
   ```env
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   ```

#### 🧠 OpenAI API Key (Required for Compliance)

1. **Go to:** [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Sign in** or create an account
3. **Click "Create new secret key"**
4. **Copy the key** (should start with `sk-proj-...`)
5. **Update .env file:**
   ```env
   OPENAI_API_KEY=sk-proj-...your_actual_key_here
   ```

#### 🔄 Anthropic API Key (Alternative for Compliance)

1. **Go to:** [Anthropic Console](https://console.anthropic.com/)
2. **Sign in** or create an account
3. **Go to API Keys section**
4. **Create a new API key**
5. **Update .env file:**
   ```env
   ANTHROPIC_API_KEY=sk-ant-...your_actual_key_here
   ```

### Step 3: Verify API Key Formats

**✅ Correct Formats:**
- Gemini: `AIzaSy...` (Google format)
- OpenAI: `sk-proj-...` (new format)
- Anthropic: `sk-ant-...` (Anthropic format)

**❌ Wrong Formats:**
- `sk-or-v1-...` (old OpenAI format - no longer supported)
- `sk-...` (generic format - may not work)

### Step 4: Test Your Configuration

Run the diagnostic script to verify your setup:

```bash
cd BE
node fix-ai-processing.js
```

This will check:
- ✅ API key configuration
- ✅ API key formats
- ✅ Service initialization
- ✅ Connection tests

### Step 5: Restart the Server

After updating the `.env` file:

```bash
cd BE
npm start
```

You should see these messages:
```
✅ Gemini service initialized successfully
✅ OpenAI service initialized successfully
✅ Compliance service initialized with provider: openai
```

### Step 6: Test Document Upload

1. **Upload a document** through the frontend
2. **Check the server logs** for these messages:
   ```
   🔄 Starting Gemini OCR for: document.pdf
   ✅ Gemini API response received
   🤖 Using OpenAI GPT-4 for compliance analysis...
   ✅ OpenAI GPT-4 analysis completed successfully
   ```

## 🚨 Common Issues & Solutions

### Issue 1: "API_KEY_INVALID" Error

**Solution:**
- Get a new API key from the provider
- Ensure the key format is correct
- Check if the key has expired

### Issue 2: "insufficient_quota" Error

**Solution:**
- Add billing/credits to your OpenAI account
- Check your usage limits
- Upgrade your plan if needed

### Issue 3: "PERMISSION_DENIED" Error

**Solution:**
- Ensure the API key has required permissions
- Check if the service is enabled in your account
- Verify the key is for the correct service

### Issue 4: Still Using Fallback Mode

**Solution:**
- Check if `.env` file exists in BE directory
- Verify API keys are not placeholder values
- Restart the server after updating keys
- Check server logs for initialization messages

## 📊 Verification Checklist

- [ ] `.env` file exists in BE directory
- [ ] `GEMINI_API_KEY` is set and starts with `AIza...`
- [ ] `OPENAI_API_KEY` is set and starts with `sk-proj-...`
- [ ] Server shows "✅ Gemini service initialized successfully"
- [ ] Server shows "✅ OpenAI service initialized successfully"
- [ ] Document upload shows real AI processing messages
- [ ] No fallback warnings in server logs

## 🔗 Useful Links

- **Gemini API:** https://aistudio.google.com/app/apikey
- **OpenAI API:** https://platform.openai.com/api-keys
- **Anthropic API:** https://console.anthropic.com/
- **OpenAI Billing:** https://platform.openai.com/settings/organization/billing

## 🎯 Expected Result

After following this guide, your AI models should:

- ✅ Use **Gemini 1.5 Pro** for real OCR processing
- ✅ Use **GPT-4 Turbo** or **Claude 3 Sonnet** for compliance analysis
- ✅ Provide **real-time AI analysis** instead of fallback data
- ✅ Generate **accurate HS code suggestions** using AI
- ✅ Show **real processing status** in the frontend

## 🆘 Still Having Issues?

If you're still experiencing fallback mode after following this guide:

1. **Run the diagnostic script:** `node fix-ai-processing.js`
2. **Check server logs** for error messages
3. **Verify API key formats** are correct
4. **Test API keys individually** using the test scripts
5. **Contact support** with the diagnostic output

---

**Remember:** The key to fixing AI fallback is ensuring your API keys are properly configured and the services can initialize successfully. Once that's done, your AI models will work with real-time data instead of fallback mode.
