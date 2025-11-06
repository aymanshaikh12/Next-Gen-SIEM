# Gemini API Setup for SecForce SIEM

SecForce SIEM uses Google's Gemini API for AI-powered alert classification and scoring.

## Setup Instructions

1. **Get a Gemini API Key**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy your API key

2. **Configure the API Key**
   - Create a `.env` file in the `backend` directory:
     ```bash
     cd backend
     cp .env.example .env
     ```
   - Edit `.env` and add your API key:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     ```

3. **Install Dependencies**
   - The required packages are already in `requirements.txt`
   - Run: `pip install -r requirements.txt`

4. **Restart the Backend**
   - Restart your FastAPI server for the changes to take effect

## How It Works

- When an alert is generated, SecForce sends the alert details to Gemini API
- Gemini analyzes the alert and returns:
  - Risk score (0-100)
  - Suppression recommendation
  - Alert classification (e.g., "Brute Force Attack", "Unauthorized Access")
- If Gemini API is not configured, the system falls back to rule-based classification

## Features

- **Intelligent Classification**: AI identifies attack types and patterns
- **Risk Scoring**: Advanced risk assessment based on context
- **Automatic Suppression**: Low-risk alerts are automatically suppressed
- **Fallback Support**: Works without API key using rule-based logic

## Notes

- The API key is stored in `.env` file (not committed to git)
- API calls are made only when alerts are generated
- Free tier has rate limits - consider upgrading for production use

