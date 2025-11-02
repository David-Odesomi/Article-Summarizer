# Article Summarizer License API

A lightweight Express.js API for verifying license keys for the Article Summarizer Chrome extension.

## Features

- ✅ Simple license key verification
- ✅ CORS enabled for Chrome extensions
- ✅ Case-insensitive key matching
- ✅ Ready for Vercel/Render deployment
- ✅ Health check endpoint
- ✅ Error handling

## API Endpoints

### GET /
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "message": "Article Summarizer License API",
  "version": "1.0.0"
}
```

### POST /verify
Verify a license key

**Request:**
```json
{
  "licenseKey": "PRO-2024-XXXX-XXXX-XXXX"
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "success": true,
  "message": "License key is valid"
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "success": false,
  "message": "Invalid or expired license key"
}
```

## Local Development

### Install Dependencies
```bash
cd api
npm install
```

### Run the Server
```bash
npm start
```

The API will be available at `http://localhost:3000`

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Test the API
```bash
npm test
```

Or manually test with curl:
```bash
curl -X POST http://localhost:3000/verify \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"PRO-2024-XXXX-XXXX-XXXX"}'
```

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd api
vercel
```

3. Follow the prompts and your API will be deployed!

4. Update your extension code with the Vercel URL:
```javascript
const BACKEND_URL = "https://your-project.vercel.app/verify";
```

### Deploy to Render

1. Push your code to GitHub

2. Go to [Render Dashboard](https://dashboard.render.com/)

3. Click "New +" → "Web Service"

4. Connect your GitHub repository

5. Configure:
   - **Name:** article-summarizer-api
   - **Root Directory:** api
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

6. Click "Create Web Service"

7. Update your extension with the Render URL:
```javascript
const BACKEND_URL = "https://article-summarizer-api.onrender.com/verify";
```

## Adding License Keys

### Method 1: Edit index.js (Simple)
Add keys directly to the `VALID_KEYS` array in `index.js`:

```javascript
const VALID_KEYS = [
  'PRO-2024-XXXX-XXXX-XXXX',
  'PRO-2024-NEW-KEY-HERE',
];
```

### Method 2: Environment Variables (Recommended for Production)

Update `index.js` to read from environment:

```javascript
const VALID_KEYS = process.env.VALID_KEYS 
  ? process.env.VALID_KEYS.split(',') 
  : ['PRO-2024-XXXX-XXXX-XXXX'];
```

Then set environment variable in your hosting platform:
- **Vercel:** Dashboard → Project → Settings → Environment Variables
- **Render:** Dashboard → Service → Environment → Add Environment Variable

## Security Notes

⚠️ **Important for Production:**

1. **Use a Database:** For production, store license keys in a database (MongoDB, PostgreSQL, etc.)
2. **Add Rate Limiting:** Prevent brute force attacks
3. **Add Authentication:** Consider API keys or JWT for additional security
4. **Use HTTPS:** Always use HTTPS in production
5. **Environment Variables:** Never commit real license keys to Git
6. **Logging:** Add proper logging for monitoring

## Project Structure

```
api/
├── index.js          # Main Express server
├── package.json      # Dependencies and scripts
├── vercel.json       # Vercel deployment config
├── .env.example      # Environment variables template
├── test.js           # Test script
└── README.md         # This file
```

## License

MIT
