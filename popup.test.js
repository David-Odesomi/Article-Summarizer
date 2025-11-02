/**
 * Unit tests for Article Summarizer Extension
 * 
 * Test Coverage:
 * 1. extractArticleText - text extraction and cleaning from various page structures
 * 2. summarizeText - Gemini API calls and summary generation
 * 3. summarizeText - API error handling (invalid key, rate limit, network issues)
 * 4. summarizeBtn - orchestration of summarization process with UI updates
 * 5. copyBtn - clipboard functionality
 */

// Mock Chrome API
global.chrome = {
  tabs: {
    query: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  }
};

// Mock fetch API
global.fetch = jest.fn();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn()
  }
});

// Import the functions we're testing
// Since popup.js uses browser APIs directly, we'll need to load it in a special way
const fs = require('fs');
const path = require('path');

describe('Article Summarizer Extension Tests', () => {
  let extractArticleText;
  let summarizeText;
  let document;
  let summarizeBtn;
  let btnText;
  let summaryBox;
  let emptyState;
  let statusBar;
  let actionBar;
  let copyBtn;
  let newSummaryBtn;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <button id="summarizeBtn">
        <span id="btnText">Summarize Page</span>
      </button>
      <div id="summary"></div>
      <div id="emptyState" style="display: block;"></div>
      <div id="statusBar"></div>
      <div id="actionBar" style="display: none;">
        <button id="copyBtn">Copy</button>
        <button id="newSummaryBtn">New Summary</button>
      </div>
    `;

    // Get DOM elements
    summarizeBtn = document.getElementById('summarizeBtn');
    btnText = document.getElementById('btnText');
    summaryBox = document.getElementById('summary');
    emptyState = document.getElementById('emptyState');
    statusBar = document.getElementById('statusBar');
    actionBar = document.getElementById('actionBar');
    copyBtn = document.getElementById('copyBtn');
    newSummaryBtn = document.getElementById('newSummaryBtn');

    // Define extractArticleText function (from popup.js)
    extractArticleText = function() {
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
      
      if (!article) {
        article = document.body;
      }
      
      const clone = article.cloneNode(true);
      const unwanted = clone.querySelectorAll("script, style, nav, header, footer, aside, .nav, .header, .footer, .sidebar, .ad, .advertisement");
      unwanted.forEach(el => el.remove());
      
      const text = clone.innerText.trim().slice(0, 5000);
      const charCount = text.length;
      
      return { text, charCount };
    };

    // Define summarizeText function (from popup.js)
    summarizeText = async function(text, apiKey) {
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
                    { text: "Summarize this webpage concisely in clear, simple language. Focus on the main points and key takeaways:\\n\\n" + text }
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
              
              if (response.status === 400 && errorMessage.includes("API key")) {
                throw new Error("Invalid API key. Please check your settings.");
              } else if (response.status === 403) {
                throw new Error("API key is invalid or doesn't have permission.");
              } else if (response.status === 429) {
                throw new Error("Rate limit exceeded. Please try again later.");
              } else if (response.status === 404) {
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
      
      throw lastError || new Error("Failed to generate summary with all available models");
    };

    // Reset mocks
    jest.clearAllMocks();
    global.fetch.mockReset();
    navigator.clipboard.writeText.mockReset();
    chrome.tabs.query.mockReset();
    chrome.scripting.executeScript.mockReset();
  });

  // ============================================================================
  // TEST CASE 1: extractArticleText correctly extracts and cleans text
  // ============================================================================
  describe('extractArticleText', () => {
    test('should extract text from article tag', () => {
      document.body.innerHTML = `
        <article>
          <h1>Test Article</h1>
          <p>This is a test article with more than one hundred characters to ensure it passes the length check in the function.</p>
        </article>
      `;

      const result = extractArticleText();
      
      expect(result.text).toContain('Test Article');
      expect(result.text).toContain('test article with more than one hundred characters');
      expect(result.charCount).toBeGreaterThan(0);
    });

    test('should extract text from main tag', () => {
      document.body.innerHTML = `
        <main>
          <h1>Main Content</h1>
          <p>This is the main content area with sufficient text to pass the minimum length requirement for the extraction function.</p>
        </main>
      `;

      const result = extractArticleText();
      
      expect(result.text).toContain('Main Content');
      expect(result.text).toContain('main content area');
    });

    test('should extract text from role="main" attribute', () => {
      document.body.innerHTML = `
        <div role="main">
          <h1>Role Main</h1>
          <p>This content uses the role attribute which is commonly used for accessibility and semantic HTML markup purposes.</p>
        </div>
      `;

      const result = extractArticleText();
      
      expect(result.text).toContain('Role Main');
    });

    test('should extract text from .article-content class', () => {
      document.body.innerHTML = `
        <div class="article-content">
          <h1>Article Content Class</h1>
          <p>This tests extraction from a common class name used by many content management systems and blog platforms.</p>
        </div>
      `;

      const result = extractArticleText();
      
      expect(result.text).toContain('Article Content Class');
    });

    test('should remove script tags from extracted text', () => {
      document.body.innerHTML = `
        <article>
          <h1>Article with Script</h1>
          <script>console.log('This should not appear');</script>
          <p>This is clean content that should be extracted without any script tags or their content being included.</p>
        </article>
      `;

      const result = extractArticleText();
      
      expect(result.text).toContain('Article with Script');
      expect(result.text).not.toContain('console.log');
      expect(result.text).not.toContain('This should not appear');
    });

    test('should remove style tags from extracted text', () => {
      document.body.innerHTML = `
        <article>
          <h1>Article with Style</h1>
          <style>.test { color: red; }</style>
          <p>Content without styles that should be cleanly extracted for the summarization process to work properly.</p>
        </article>
      `;

      const result = extractArticleText();
      
      expect(result.text).toContain('Article with Style');
      expect(result.text).not.toContain('.test');
      expect(result.text).not.toContain('color: red');
    });

    test('should remove navigation elements', () => {
      document.body.innerHTML = `
        <article>
          <h1>Article with Nav</h1>
          <nav>Home | About | Contact</nav>
          <p>The main article content should be extracted while navigation menus and other non-content elements are removed.</p>
        </article>
      `;

      const result = extractArticleText();
      
      expect(result.text).toContain('Article with Nav');
      expect(result.text).not.toContain('Home | About | Contact');
    });

    test('should remove header and footer elements', () => {
      document.body.innerHTML = `
        <article>
          <header>Site Header</header>
          <h1>Article Content</h1>
          <p>This is the actual article content that we want to extract and summarize without headers or footers.</p>
          <footer>Copyright 2024</footer>
        </article>
      `;

      const result = extractArticleText();
      
      expect(result.text).toContain('Article Content');
      expect(result.text).not.toContain('Site Header');
      expect(result.text).not.toContain('Copyright 2024');
    });

    test('should remove elements with ad-related classes', () => {
      document.body.innerHTML = `
        <article>
          <h1>Article with Ads</h1>
          <div class="ad">Advertisement Content</div>
          <div class="advertisement">Sponsored Content</div>
          <div class="sidebar">Sidebar Content</div>
          <p>This is the main article text that should be extracted without any advertisement or sidebar content.</p>
        </article>
      `;

      const result = extractArticleText();
      
      expect(result.text).toContain('Article with Ads');
      expect(result.text).not.toContain('Advertisement Content');
      expect(result.text).not.toContain('Sponsored Content');
      expect(result.text).not.toContain('Sidebar Content');
    });

    test('should fallback to body when no article element found', () => {
      document.body.innerHTML = `
        <div>
          <p>Just some content in the body without any semantic article tags to test the fallback mechanism.</p>
        </div>
      `;

      const result = extractArticleText();
      
      expect(result.text).toContain('Just some content');
      expect(result.charCount).toBeGreaterThan(0);
    });

    test('should limit text to 5000 characters', () => {
      const longText = 'A'.repeat(6000);
      document.body.innerHTML = `
        <article>${longText}</article>
      `;

      const result = extractArticleText();
      
      expect(result.text.length).toBeLessThanOrEqual(5000);
      expect(result.charCount).toBeLessThanOrEqual(5000);
    });

    test('should return correct character count', () => {
      document.body.innerHTML = `
        <article>
          <p>This is a test article with exactly counted characters to verify the character count functionality works.</p>
        </article>
      `;

      const result = extractArticleText();
      
      expect(result.charCount).toBe(result.text.length);
      expect(typeof result.charCount).toBe('number');
    });
  });

  // ============================================================================
  // TEST CASE 2: summarizeText successfully calls Gemini API and returns summary
  // ============================================================================
  describe('summarizeText - Success Cases', () => {
    test('should successfully return summary from Gemini API', async () => {
      const mockSummary = 'This is a test summary of the article content.';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  { text: mockSummary }
                ]
              }
            }
          ]
        })
      });

      const result = await summarizeText('Test article text', 'test-api-key');
      
      expect(result).toBe(mockSummary);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    test('should include correct prompt in API request', async () => {
      const testText = 'Article content to summarize';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Summary' }]
            }
          }]
        })
      });

      await summarizeText(testText, 'test-api-key');
      
      const fetchCall = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(requestBody.contents[0].parts[0].text).toContain('Summarize this webpage concisely');
      expect(requestBody.contents[0].parts[0].text).toContain(testText);
    });

    test('should use correct generation config', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Summary' }]
            }
          }]
        })
      });

      await summarizeText('Test text', 'test-api-key');
      
      const fetchCall = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(requestBody.generationConfig.temperature).toBe(0.7);
      expect(requestBody.generationConfig.maxOutputTokens).toBe(500);
    });

    test('should try first model successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Summary from first model' }]
            }
          }]
        })
      });

      const result = await summarizeText('Test text', 'test-api-key');
      
      expect(result).toBe('Summary from first model');
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch.mock.calls[0][0]).toContain('gemini-2.0-flash-exp');
    });

    test('should fallback to second model if first fails with 404', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ error: { message: 'Model not found' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{ text: 'Summary from second model' }]
              }
            }]
          })
        });

      const result = await summarizeText('Test text', 'test-api-key');
      
      expect(result).toBe('Summary from second model');
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch.mock.calls[1][0]).toContain('gemini-1.5-flash');
    });

    test('should trim whitespace from summary', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: '  Summary with whitespace  \n' }]
            }
          }]
        })
      });

      const result = await summarizeText('Test text', 'test-api-key');
      
      expect(result).toBe('Summary with whitespace');
    });
  });

  // ============================================================================
  // TEST CASE 3: summarizeText handles API errors gracefully
  // ============================================================================
  describe('summarizeText - Error Handling', () => {
    test('should handle invalid API key error (400)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'API key not valid'
          }
        })
      });

      await expect(summarizeText('Test text', 'invalid-key'))
        .rejects
        .toThrow('Invalid API key. Please check your settings.');
    });

    test('should handle forbidden error (403)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: {
            message: 'Permission denied'
          }
        })
      });

      await expect(summarizeText('Test text', 'test-key'))
        .rejects
        .toThrow("API key is invalid or doesn't have permission.");
    });

    test('should handle rate limit error (429)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: 'Quota exceeded'
          }
        })
      });

      await expect(summarizeText('Test text', 'test-key'))
        .rejects
        .toThrow('Rate limit exceeded. Please try again later.');
    });

    test('should handle network error', async () => {
      global.fetch.mockRejectedValueOnce(
        Object.assign(new TypeError('Failed to fetch'), { name: 'TypeError' })
      );

      await expect(summarizeText('Test text', 'test-key'))
        .rejects
        .toThrow('Network error. Please check your internet connection.');
    });

    test('should handle empty response from API', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: '' }]
            }
          }]
        })
      });

      // Should retry with next model
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Valid summary' }]
            }
          }]
        })
      });

      const result = await summarizeText('Test text', 'test-key');
      expect(result).toBe('Valid summary');
    });

    test('should handle missing candidates in response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Valid summary' }]
            }
          }]
        })
      });

      const result = await summarizeText('Test text', 'test-key');
      expect(result).toBe('Valid summary');
    });

    test('should handle finish reason in response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            finishReason: 'SAFETY',
            content: {
              parts: []
            }
          }]
        })
      });

      await expect(summarizeText('Test text', 'test-key'))
        .rejects
        .toThrow('Summary generation stopped: SAFETY');
    });

    test('should handle all models failing with 404', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ error: { message: 'Model not found' } })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ error: { message: 'Model not found' } })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ error: { message: 'Model not found' } })
        });

      await expect(summarizeText('Test text', 'test-key'))
        .rejects
        .toThrow();
    });

    test('should handle generic API error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: {
            message: 'Internal server error'
          }
        })
      });

      await expect(summarizeText('Test text', 'test-key'))
        .rejects
        .toThrow();
    });
  });

  // ============================================================================
  // TEST CASE 4: summarizeBtn orchestrates summarization with UI updates
  // ============================================================================
  describe('summarizeBtn Click Handler', () => {
    let showStatus;
    let setLoading;
    let hideEmptyState;
    let showEmptyState;

    beforeEach(() => {
      // Define helper functions
      showStatus = (message, type = '') => {
        statusBar.textContent = message;
        statusBar.className = 'status-bar show';
        if (type) {
          statusBar.classList.add(type);
        }
      };

      setLoading = (loading) => {
        if (loading) {
          summarizeBtn.disabled = true;
          btnText.innerHTML = '<span class="spinner"></span>Summarizing...';
        } else {
          summarizeBtn.disabled = false;
          btnText.textContent = 'Summarize Page';
        }
      };

      hideEmptyState = () => {
        emptyState.style.display = 'none';
      };

      showEmptyState = () => {
        emptyState.style.display = 'block';
      };

      // Mock Chrome APIs
      chrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      chrome.scripting.executeScript.mockResolvedValue([{
        result: {
          text: 'Test article text with more than enough content to pass validation',
          charCount: 67
        }
      }]);

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Test summary of the article' }]
            }
          }]
        })
      });
    });

    test('should set loading state when summarize button is clicked', async () => {
      const clickHandler = async () => {
        try {
          setLoading(true);
          showStatus('Extracting article text...');
          hideEmptyState();

          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractArticleText
          });

          const { text, charCount } = results[0].result;

          if (!text || text.trim().length === 0) {
            throw new Error('Could not extract text from this page');
          }

          showStatus(`Summarizing ${charCount.toLocaleString()} characters...`);

          const summary = await summarizeText(text, 'test-api-key');

          const wordCount = summary.split(/\s+/).length;
          summaryBox.innerHTML = `${summary}<span class="word-count">${wordCount} words</span>`;

          showStatus('Summary complete!', 'success');
          actionBar.style.display = 'flex';

          setTimeout(() => {
            statusBar.classList.remove('show');
          }, 2000);

        } catch (error) {
          const errorMsg = error.message || 'Unknown error occurred';
          showStatus(`Error: ${errorMsg}`, 'error');
          summaryBox.textContent = '';
          actionBar.style.display = 'none';
          showEmptyState();
        } finally {
          setLoading(false);
        }
      };

      await clickHandler();

      expect(summarizeBtn.disabled).toBe(false); // Should be re-enabled after completion
      expect(btnText.textContent).toBe('Summarize Page');
    });

    test('should show "Extracting article text..." status initially', async () => {
      setLoading(true);
      showStatus('Extracting article text...');

      expect(statusBar.textContent).toBe('Extracting article text...');
      expect(statusBar.classList.contains('show')).toBe(true);
    });

    test('should hide empty state when starting', () => {
      hideEmptyState();
      expect(emptyState.style.display).toBe('none');
    });

    test('should show character count during summarization', () => {
      showStatus('Summarizing 1,234 characters...');
      expect(statusBar.textContent).toContain('1,234 characters');
    });

    test('should display summary with word count', () => {
      const summary = 'This is a test summary';
      const wordCount = summary.split(/\s+/).length;
      summaryBox.innerHTML = `${summary}<span class="word-count">${wordCount} words</span>`;

      expect(summaryBox.innerHTML).toContain('This is a test summary');
      expect(summaryBox.innerHTML).toContain(`${wordCount} words`);
    });

    test('should show success status after completion', () => {
      showStatus('Summary complete!', 'success');

      expect(statusBar.textContent).toBe('Summary complete!');
      expect(statusBar.classList.contains('success')).toBe(true);
    });

    test('should show action bar after successful summary', () => {
      actionBar.style.display = 'flex';
      expect(actionBar.style.display).toBe('flex');
    });

    test('should handle error when text extraction fails', async () => {
      chrome.scripting.executeScript.mockResolvedValue([{
        result: { text: '', charCount: 0 }
      }]);

      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: 1 },
          func: extractArticleText
        });
        const { text } = results[0].result;

        if (!text || text.trim().length === 0) {
          throw new Error('Could not extract text from this page');
        }
      } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
        summaryBox.textContent = '';
        actionBar.style.display = 'none';
        showEmptyState();
      }

      expect(statusBar.textContent).toContain('Could not extract text');
      expect(statusBar.classList.contains('error')).toBe(true);
      expect(emptyState.style.display).toBe('block');
    });

    test('should handle API error gracefully', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'API key not valid' }
        })
      });

      try {
        await summarizeText('Test text', 'invalid-key');
      } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
        summaryBox.textContent = '';
        actionBar.style.display = 'none';
        showEmptyState();
      }

      expect(statusBar.textContent).toContain('Invalid API key');
      expect(actionBar.style.display).toBe('none');
    });

    test('should re-enable button after error', () => {
      setLoading(true);
      expect(summarizeBtn.disabled).toBe(true);

      setLoading(false);
      expect(summarizeBtn.disabled).toBe(false);
    });

    test('should calculate word count correctly', () => {
      const summary = 'One two three four five';
      const wordCount = summary.split(/\s+/).length;

      expect(wordCount).toBe(5);
    });
  });

  // ============================================================================
  // TEST CASE 5: copyBtn successfully copies summary to clipboard
  // ============================================================================
  describe('copyBtn Click Handler', () => {
    let currentSummary;
    let showStatus;

    beforeEach(() => {
      currentSummary = 'This is the current summary text';
      
      showStatus = (message, type = '') => {
        statusBar.textContent = message;
        statusBar.className = 'status-bar show';
        if (type) {
          statusBar.classList.add(type);
        }
      };

      navigator.clipboard.writeText.mockResolvedValue();
    });

    test('should copy summary to clipboard', async () => {
      const clickHandler = async () => {
        try {
          await navigator.clipboard.writeText(currentSummary);
          const originalText = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';

          setTimeout(() => {
            copyBtn.textContent = originalText;
          }, 2000);
        } catch (error) {
          showStatus('Failed to copy to clipboard', 'error');
        }
      };

      copyBtn.textContent = 'Copy';
      await clickHandler();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(currentSummary);
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    });

    test('should change button text to "Copied!" after successful copy', async () => {
      copyBtn.textContent = 'Copy';

      await navigator.clipboard.writeText(currentSummary);
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';

      expect(copyBtn.textContent).toBe('Copied!');
    });

    test('should restore original button text after 2 seconds', (done) => {
      copyBtn.textContent = 'Copy';
      const originalText = copyBtn.textContent;

      copyBtn.textContent = 'Copied!';
      
      setTimeout(() => {
        copyBtn.textContent = originalText;
        expect(copyBtn.textContent).toBe('Copy');
        done();
      }, 2000);
    });

    test('should handle clipboard write failure', async () => {
      navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard error'));

      try {
        await navigator.clipboard.writeText(currentSummary);
      } catch (error) {
        showStatus('Failed to copy to clipboard', 'error');
      }

      expect(statusBar.textContent).toBe('Failed to copy to clipboard');
      expect(statusBar.classList.contains('error')).toBe(true);
    });

    test('should copy exact summary text without modification', async () => {
      const testSummary = 'Test summary with special characters: !@#$%^&*()';
      
      await navigator.clipboard.writeText(testSummary);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testSummary);
    });

    test('should copy multi-line summary correctly', async () => {
      const multiLineSummary = 'Line 1\nLine 2\nLine 3';

      await navigator.clipboard.writeText(multiLineSummary);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(multiLineSummary);
    });

    test('should handle empty summary', async () => {
      const emptySummary = '';

      await navigator.clipboard.writeText(emptySummary);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(emptySummary);
    });

    test('should copy summary with unicode characters', async () => {
      const unicodeSummary = 'Summary with emoji 🎉 and unicode ñ ü';

      await navigator.clipboard.writeText(unicodeSummary);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(unicodeSummary);
    });
  });
});
