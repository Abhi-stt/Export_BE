# Fallback Issue Solution

## 🚨 Current Problem

Your document preview shows these fallback indicators:

```
Note: This is processed with fallback OCR. Please configure GEMINI_API_KEY for full AI processing.
```

And:

```
HS Code Suggestions
AI is still analyzing this document for product classification.
HS codes will appear once processing is complete.
```

## 🔍 Root Cause

The AI models are falling back to fallback mode because:

1. **No `.env` file exists** in the BE directory, OR
2. **API keys are not configured** (using placeholder values), OR
3. **API keys are invalid** or have wrong format

## 🔧 Step-by-Step Fix

### Step 1: Check Current Status

Run this command to check your current configuration:

```bash
cd BE
node check-env-config.js
```

This will show you exactly what's missing.

### Step 2: Create/Update .env File

If you don't have a `.env` file, create one:

```bash
cd BE
node setup-env.js
```

### Step 3: Get Your API Keys

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

### Step 4: Verify Your .env File

Your `.env` file should look like this:

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
GEMINI_API_KEY=AIzaSy...your_actual_gemini_key_here
OPENAI_API_KEY=sk-proj-...your_actual_openai_key_here
COMPLIANCE_AI_PROVIDER=openai
```

**Important:** Replace the placeholder values with your actual API keys!

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
2. **Check the preview** - you should see:
   - ✅ Real OCR text extraction (no fallback message)
   - ✅ Real compliance analysis (no "still analyzing" message)
   - ✅ Real HS code suggestions (not fallback data)

## 🚨 Common Issues

### Issue 1: Still Seeing Fallback Messages

**Solution:**
- Check if `.env` file exists in BE directory
- Verify API keys are not placeholder values
- Restart the server after updating keys

### Issue 2: "API_KEY_INVALID" Error

**Solution:**
- Get a new API key from the provider
- Ensure the key format is correct
- Check if the key has expired

### Issue 3: "insufficient_quota" Error

**Solution:**
- Add billing/credits to your OpenAI account
- Check your usage limits
- Upgrade your plan if needed

## 📊 Verification Checklist

- [ ] `.env` file exists in BE directory
- [ ] `GEMINI_API_KEY` is set and starts with `AIza...`
- [ ] `OPENAI_API_KEY` is set and starts with `sk-proj-...`
- [ ] No placeholder values in .env file
- [ ] Server shows "✅ Gemini service initialized successfully"
- [ ] Server shows "✅ OpenAI service initialized successfully"
- [ ] Document upload shows real AI processing messages
- [ ] No fallback warnings in document preview

## 🎯 Expected Result

After fixing the API keys, your document preview should show:

- ✅ **Real OCR text extraction** (no fallback message)
- ✅ **Real compliance analysis** (actual compliance scores)
- ✅ **Real HS code suggestions** (actual AI-generated codes)
- ✅ **Real processing status** (no "still analyzing" messages)

## 🔗 Useful Links

- **Gemini API:** https://aistudio.google.com/app/apikey
- **OpenAI API:** https://platform.openai.com/api-keys
- **OpenAI Billing:** https://platform.openai.com/settings/organization/billing

## 🆘 Still Having Issues?

If you're still seeing fallback mode after following this guide:

1. **Run the diagnostic script:** `node check-env-config.js`
2. **Check server logs** for error messages
3. **Verify API key formats** are correct
4. **Test API keys individually** using the test scripts

---

**Remember:** The key to fixing the fallback issue is ensuring your API keys are properly configured in the `.env` file. Once that's done, your AI models will work with real-time data instead of fallback mode.
