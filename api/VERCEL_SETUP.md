# Vercel Deployment Setup Guide

## 🚀 Deploy to Vercel

### Step 1: Deploy the API

```bash
cd api
vercel
```

Follow the prompts to deploy your API.

### Step 2: Add Environment Variables in Vercel

Go to your Vercel project dashboard:

1. **Navigate to:** [Vercel Dashboard](https://vercel.com/dashboard)
2. **Select your project:** article-summarizer-api
3. **Go to:** Settings → Environment Variables
4. **Add the following variables:**

#### Required Environment Variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `PADDLE_VENDOR_ID` | Your numeric vendor ID | Found in Paddle Dashboard → Developer Tools → Authentication |
| `PADDLE_AUTH_CODE` | `pdl_live_apikey_01k928qp91arpw6dg2pykg0xtw_F9nvhDj0yGbdZ02QEXvhGG_Aeu` | Your Paddle API key from Developer Tools |
| `PADDLE_PRODUCT_ID` | Your product ID | Found in Paddle Dashboard → Catalog → Your Product |

#### Optional Environment Variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `VALID_KEYS` | `KEY1,KEY2,KEY3` | Comma-separated list of valid license keys |
| `PORT` | `3000` | Server port (auto-configured by Vercel) |

### Step 3: Add Environment Variables via Vercel UI

#### Using Vercel Dashboard:

1. Click **"Add New"** button
2. For each variable:
   - **Key:** `PADDLE_VENDOR_ID`
   - **Value:** Your numeric vendor ID
   - **Environments:** Select all (Production, Preview, Development)
   - Click **"Save"**

3. Repeat for:
   - `PADDLE_AUTH_CODE` = `pdl_live_apikey_01k928qp91arpw6dg2pykg0xtw_F9nvhDj0yGbdZ02QEXvhGG_Aeu`
   - `PADDLE_PRODUCT_ID` = Your product ID

#### Using Vercel CLI (Alternative):

```bash
# Set Paddle Vendor ID
vercel env add PADDLE_VENDOR_ID

# Set Paddle Auth Code
vercel env add PADDLE_AUTH_CODE

# Set Paddle Product ID
vercel env add PADDLE_PRODUCT_ID

# Optional: Set valid keys
vercel env add VALID_KEYS
```

When prompted:
- Choose environments: Select all (Production, Preview, Development)
- Enter the value when asked

### Step 4: Redeploy

After adding environment variables, redeploy your project:

```bash
vercel --prod
```

Or trigger a redeploy from Vercel Dashboard:
1. Go to **Deployments** tab
2. Click the **three dots** on the latest deployment
3. Select **"Redeploy"**

### Step 5: Verify Configuration

Test your API endpoint:

```bash
curl https://your-project.vercel.app/
```

You should see:
```json
{
  "status": "ok",
  "message": "Article Summarizer License API",
  "version": "1.0.0",
  "paddle_configured": true
}
```

If `paddle_configured` is `false`, check your environment variables.

### Step 6: Test License Verification

```bash
curl -X POST https://your-project.vercel.app/verify \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"PRO-2024-XXXX-XXXX-XXXX"}'
```

Expected response:
```json
{
  "valid": true,
  "success": true,
  "message": "License key is valid"
}
```

## 🔐 Security Best Practices

### ✅ DO:
- Store all sensitive credentials in Vercel Environment Variables
- Use different API keys for development and production
- Rotate your API keys periodically
- Monitor your API usage in Paddle Dashboard
- Use HTTPS for all API calls (Vercel provides this automatically)

### ❌ DON'T:
- Never commit API keys to Git
- Never expose API keys in client-side code
- Never share your API keys publicly
- Never use production keys in development

## 📝 Environment Variable Reference

### PADDLE_VENDOR_ID
- **Type:** Number
- **Example:** `12345`
- **Where to find:** Paddle Dashboard → Developer Tools → Authentication
- **Required:** Yes

### PADDLE_AUTH_CODE
- **Type:** String
- **Example:** `pdl_live_apikey_01k928qp91arpw6dg2pykg0xtw_F9nvhDj0yGbdZ02QEXvhGG_Aeu`
- **Where to find:** Paddle Dashboard → Developer Tools → API Keys
- **Required:** Yes
- **Note:** Keep this secret! Never commit to Git

### PADDLE_PRODUCT_ID
- **Type:** String
- **Example:** `pri_01hxgz7r4n2k8q9p3m5l6j7k8h`
- **Where to find:** Paddle Dashboard → Catalog → Your Product → Copy Product ID
- **Required:** Yes

### VALID_KEYS (Optional)
- **Type:** Comma-separated string
- **Example:** `PRO-2024-ABC-123,PRO-2024-XYZ-789`
- **Required:** No (uses hardcoded fallback if not set)
- **Recommended:** Yes, for production

## 🔄 Updating Environment Variables

To update an existing environment variable:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find the variable you want to update
3. Click the **three dots** → **"Edit"**
4. Update the value
5. Click **"Save"**
6. **Important:** Redeploy your project for changes to take effect

## 🐛 Troubleshooting

### Issue: `paddle_configured: false`

**Solution:** Check that all three Paddle environment variables are set:
```bash
vercel env ls
```

You should see:
- PADDLE_VENDOR_ID
- PADDLE_AUTH_CODE
- PADDLE_PRODUCT_ID

### Issue: License verification always returns false

**Solution:** 
1. Check that `VALID_KEYS` environment variable is set correctly
2. Ensure keys are comma-separated with no extra spaces
3. Keys are case-insensitive, so `PRO-2024-XXX` matches `pro-2024-xxx`

### Issue: CORS errors from Chrome extension

**Solution:** The API already has CORS enabled. Ensure your extension has proper permissions in manifest.json:
```json
{
  "permissions": ["storage"],
  "host_permissions": ["https://your-project.vercel.app/*"]
}
```

## 📚 Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Paddle API Documentation](https://developer.paddle.com/api-reference)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)

## 💡 Tips

1. **Use Preview Deployments:** Test changes in preview environments before deploying to production
2. **Set up Vercel GitHub Integration:** Auto-deploy on push to main branch
3. **Enable Vercel Analytics:** Monitor API performance and usage
4. **Set up alerts:** Get notified if your API goes down

---

Need help? Check the main README.md for more information.
