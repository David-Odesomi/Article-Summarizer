// When the user clicks the "Summarize Page" button
document.getElementById("summarizeBtn").addEventListener("click", async () => {
  const summaryBox = document.getElementById("summary");
  summaryBox.textContent = "Summarizing... please wait.";

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

  } catch (err) {
    console.error("Error:", err);
    summaryBox.textContent = "An unexpected error occurred. Check the console for details.";
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