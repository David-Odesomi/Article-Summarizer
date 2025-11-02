// Daily usage limit
const DAILY_LIMIT = 5;
const BACKEND_URL = "https://your-backend-url.com/verify";

// Update usage counter on page load
document.addEventListener('DOMContentLoaded', async () => {
  await updateUsageDisplay();
});

// When the user clicks the "Summarize Page" button
document.getElementById("summarizeBtn").addEventListener("click", async () => {
  const summaryBox = document.getElementById("summary");
  const copyBtn = document.getElementById("copyBtn");
  
  // Check if user is Pro (skip limits)
  const isPro = await isProUser();
  
  // Check if user can summarize (within daily limit)
  if (!isPro) {
    const canUse = await canSummarize();
    if (!canUse) {
      summaryBox.textContent = "⚠️ Daily limit reached. Upgrade to Pro for unlimited summaries.";
      copyBtn.classList.remove("show");
      return;
    }
  }
  
  summaryBox.textContent = "Summarizing... please wait.";
  copyBtn.classList.remove("show");

  try {
    // Get the active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Run a script in the active tab to extract text
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractArticleText
    });

    const text = results[0].result;

    if (!text || text.trim().length < 50) {
      summaryBox.textContent = "Couldn't find enough readable text on this page.";
      return;
    }

    const summary = await summarizeText(text);
    summaryBox.textContent = summary;
    
    // Increment usage count after successful summarization
    if (!summary.startsWith("❌") && !summary.startsWith("⚠️")) {
      await incrementUsage();
      await updateUsageDisplay();
      copyBtn.classList.add("show");
    }

  } catch (err) {
    console.error("Error:", err);
    summaryBox.textContent = "An unexpected error occurred. Check the console for details.";
  }
});

// Copy button functionality
document.getElementById("copyBtn").addEventListener("click", async () => {
  const summaryBox = document.getElementById("summary");
  const copyBtn = document.getElementById("copyBtn");
  
  try {
    await navigator.clipboard.writeText(summaryBox.textContent);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  } catch (err) {
    console.error("Copy failed:", err);
    copyBtn.textContent = "Copy failed";
    setTimeout(() => {
      copyBtn.textContent = "Copy Summary";
    }, 2000);
  }
});

// Extracts the main article text from the page
function extractArticleText() {
  const article = document.querySelector("article") || document.body;
  return article.innerText.slice(0, 4000); // limit to ~4000 chars
}

// Sends the text to Gemini for summarization
async function summarizeText(text) {
  const apiKey = "AIzaSyBOlntsN0qlu1pFAA9b2dN7QD32wWePDLI"; // Your Gemini API key
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Summarize this webpage concisely and clearly:\n\n" + text }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    console.log("Gemini API Response:", data);

    // Handle errors directly from the API
    if (data.error) {
      const msg = data.error.message || "Unknown API error.";
      return `❌ Gemini API Error: ${msg}`;
    }

    // Extract the summary text from Gemini’s structured response
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!summary) {
      return "⚠️ No summary returned by Gemini. Try again or check your API key.";
    }

    return summary;

  } catch (networkErr) {
    console.error("Network or fetch error:", networkErr);
    return "⚠️ Network error — please check your internet connection or API key.";
  }
}

// Helper: Check if user can summarize (within daily limit)
async function canSummarize() {
  const data = await chrome.storage.local.get(['usageCount', 'lastUsed']);
  const today = new Date().toDateString();
  
  // If no data or it's a new day, reset the counter
  if (!data.lastUsed || data.lastUsed !== today) {
    await chrome.storage.local.set({ usageCount: 0, lastUsed: today });
    return true;
  }
  
  // Check if user is within the daily limit
  return data.usageCount < DAILY_LIMIT;
}

// Helper: Increment usage count
async function incrementUsage() {
  const data = await chrome.storage.local.get(['usageCount', 'lastUsed']);
  const today = new Date().toDateString();
  
  // If it's a new day, reset to 1
  if (!data.lastUsed || data.lastUsed !== today) {
    await chrome.storage.local.set({ usageCount: 1, lastUsed: today });
  } else {
    // Increment the counter
    await chrome.storage.local.set({ 
      usageCount: (data.usageCount || 0) + 1, 
      lastUsed: today 
    });
  }
}

// Helper: Update usage display
async function updateUsageDisplay() {
  const usageCounter = document.getElementById("usageCounter");
  
  // Check if user is Pro
  const isPro = await isProUser();
  
  if (isPro) {
    usageCounter.textContent = "✨ Pro: Unlimited summaries";
    usageCounter.className = "usage-counter pro";
    return;
  }
  
  // Show regular usage for free users
  const data = await chrome.storage.local.get(["usageCount", "lastUsed"]);
  const today = new Date().toDateString();
  
  // Reset counter if its a new day
  let currentUsage = 0;
  if (data.lastUsed === today) {
    currentUsage = data.usageCount || 0;
  }
  
  const remaining = DAILY_LIMIT - currentUsage;
  
  // Update the display
  if (remaining <= 0) {
    usageCounter.textContent = "No summaries left today. Resets tomorrow.";
    usageCounter.className = "usage-counter warning";
  } else if (remaining === 1) {
    usageCounter.textContent = `${remaining} summary remaining today`;
    usageCounter.className = "usage-counter warning";
  } else {
    usageCounter.textContent = `${remaining} summaries remaining today`;
    usageCounter.className = "usage-counter";
  }
}


// Check if user has Pro license
async function isProUser() {
  const data = await chrome.storage.local.get(["licenseKey", "isPro"]);
  
  // If no license key, return false
  if (!data.licenseKey || !data.isPro) {
    return false;
  }

  // Verify the license key is still valid
  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey: data.licenseKey })
    });

    if (!response.ok) {
      await chrome.storage.local.set({ isPro: false });
      return false;
    }

    const result = await response.json();
    const isValid = result.valid === true || result.success === true;
    
    if (!isValid) {
      await chrome.storage.local.set({ isPro: false });
    }
    
    return isValid;
  } catch (error) {
    // On network error, trust the local storage (offline mode)
    console.warn("Could not verify license online, using cached status");
    return data.isPro === true;
  }
}
