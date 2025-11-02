const API_KEY = "AIzaSyBOlntsN0qlu1pFAA9b2dN7QD32wWePDLI";

// DOM Elements
const summarizeBtn = document.getElementById("summarizeBtn");
const btnText = document.getElementById("btnText");
const summaryBox = document.getElementById("summary");
const emptyState = document.getElementById("emptyState");
const statusBar = document.getElementById("statusBar");
const actionBar = document.getElementById("actionBar");
const copyBtn = document.getElementById("copyBtn");
const newSummaryBtn = document.getElementById("newSummaryBtn");

let currentSummary = "";

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    summarizeBtn.click();
  }
});

// Main summarize button handler
summarizeBtn.addEventListener("click", async () => {
  try {

    setLoading(true);
    showStatus("Extracting article text...");
    hideEmptyState();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractArticleText
    });
    
    const { text, charCount } = results[0].result;
    
    if (!text || text.trim().length === 0) {
      throw new Error("Could not extract text from this page");
    }

    showStatus(`Summarizing ${charCount.toLocaleString()} characters...`);
    
    const summary = await summarizeText(text, API_KEY);
    currentSummary = summary;
    
    const wordCount = summary.split(/\s+/).length;
    summaryBox.innerHTML = `${summary}<span class="word-count">${wordCount} words</span>`;
    
    showStatus("Summary complete!", "success");
    actionBar.style.display = "flex";
    
    setTimeout(() => {
      statusBar.classList.remove("show");
    }, 2000);
    
  } catch (error) {
    console.error("Error details:", error);
    const errorMsg = error.message || "Unknown error occurred";
    showStatus(`Error: ${errorMsg}`, "error");
    summaryBox.textContent = "";
    actionBar.style.display = "none";
    showEmptyState();
  } finally {
    setLoading(false);
  }
});

// Copy button handler
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(currentSummary);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  } catch (error) {
    showStatus("Failed to copy to clipboard", "error");
  }
});

// New summary button handler
newSummaryBtn.addEventListener("click", () => {
  summaryBox.textContent = "";
  currentSummary = "";
  actionBar.style.display = "none";
  showEmptyState();
  statusBar.classList.remove("show");
});

// Helper: Show status message
function showStatus(message, type = "") {
  statusBar.textContent = message;
  statusBar.className = "status-bar show";
  if (type) {
    statusBar.classList.add(type);
  }
}

// Helper: Set loading state
function setLoading(loading) {
  if (loading) {
    summarizeBtn.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span>Summarizing...';
  } else {
    summarizeBtn.disabled = false;
    btnText.textContent = "Summarize Page";
  }
}

// Helper: Hide empty state
function hideEmptyState() {
  emptyState.style.display = "none";
}

// Helper: Show empty state
function showEmptyState() {
  emptyState.style.display = "block";
}

// Extracts the main article text from the page (improved)
function extractArticleText() {
  // Try multiple selectors for better article detection
  const selectors = [
    "article",
    "main",
    '[role="main"]',
    ".article-content",
    ".post-content",
    ".entry-content",
    ".content",
    "#content"
  ];
  
  let article = null;
  for (const selector of selectors) {
    article = document.querySelector(selector);
    if (article && article.innerText.trim().length > 100) {
      break;
    }
  }
  
  // Fallback to body
  if (!article) {
    article = document.body;
  }
  
  // Remove script, style, nav, header, footer elements
  const clone = article.cloneNode(true);
  const unwanted = clone.querySelectorAll("script, style, nav, header, footer, aside, .nav, .header, .footer, .sidebar, .ad, .advertisement");
  unwanted.forEach(el => el.remove());
  
  const text = clone.innerText.trim().slice(0, 5000);
  const charCount = text.length;
  
  return { text, charCount };
}

// Sends the text to Gemini for summarization with error handling
async function summarizeText(text, apiKey) {
  // Try Gemini 2.0 Flash first, then fall back to 1.5 Flash
  const models = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];
  
  let lastError = null;
  
  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: "Summarize this webpage concisely in clear, simple language. Focus on the main points and key takeaways:\n\n" + text }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      });
    
      if (!response.ok) {
        let errorMessage = `API error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
          
          // Only throw for non-404 errors when trying models
          if (response.status === 400 && errorMessage.includes("API key")) {
            throw new Error("Invalid API key. Please check your settings.");
          } else if (response.status === 403) {
            throw new Error("API key is invalid or doesn't have permission.");
          } else if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
          } else if (response.status === 404) {
            // Model not found, try next model
            lastError = new Error(`Model ${model} not found`);
            continue;
          }
        } catch (e) {
          if (e.message && (e.message.includes("API key") || e.message.includes("Rate limit"))) {
            throw e;
          }
        }
        lastError = new Error(errorMessage);
        continue;
      }
      
      const data = await response.json();
      
      const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      if (!summary) {
        if (data.candidates?.[0]?.finishReason) {
          throw new Error(`Summary generation stopped: ${data.candidates[0].finishReason}`);
        }
        lastError = new Error("No summary generated. Please try again.");
        continue;
      }
      
      return summary;
      
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error("Network error. Please check your internet connection.");
      }
      if (error.message && (error.message.includes("API key") || error.message.includes("Rate limit") || error.message.includes("permission"))) {
        throw error;
      }
      lastError = error;
    }
  }
  
  // If we've exhausted all models, throw the last error
  throw lastError || new Error("Failed to generate summary with all available models");
}
