# Article Summarizer Extension - Unit Tests

This document provides instructions for running the comprehensive unit tests for the Article Summarizer Chrome Extension.

## Test Coverage

The test suite covers the following 5 main test cases:

### 1. **extractArticleText** - Text Extraction and Cleaning (12 tests)
- Extracts text from various HTML structures (`<article>`, `<main>`, `role="main"`, etc.)
- Removes unwanted elements (scripts, styles, navigation, headers, footers)
- Filters out advertisements and sidebar content
- Handles fallback to document body
- Limits text to 5000 characters
- Returns accurate character counts

### 2. **summarizeText** - Gemini API Success Cases (7 tests)
- Successfully calls Gemini API and returns summary
- Includes correct prompt in API request
- Uses proper generation configuration (temperature, maxOutputTokens)
- Tries first model successfully
- Falls back to alternative models when needed
- Trims whitespace from summaries

### 3. **summarizeText** - API Error Handling (9 tests)
- Handles invalid API key errors (400)
- Handles forbidden errors (403)
- Handles rate limit errors (429)
- Handles network errors
- Handles empty responses
- Handles missing candidates in response
- Handles finish reason (e.g., SAFETY)
- Handles all models failing
- Handles generic API errors

### 4. **summarizeBtn** - Click Event Orchestration (11 tests)
- Sets loading state correctly
- Shows appropriate status messages
- Hides/shows empty state
- Displays character count during summarization
- Displays summary with word count
- Shows success status after completion
- Shows action bar after successful summary
- Handles text extraction failures
- Handles API errors gracefully
- Re-enables button after errors
- Calculates word count correctly

### 5. **copyBtn** - Clipboard Functionality (8 tests)
- Copies summary to clipboard
- Changes button text to "Copied!"
- Restores original button text after 2 seconds
- Handles clipboard write failures
- Copies exact summary text without modification
- Copies multi-line summaries correctly
- Handles empty summaries
- Copies summaries with unicode characters

## Installation

Install the required dependencies:

```bash
npm install
```

This will install:
- Jest (testing framework)
- @jest/globals (Jest APIs)
- jest-environment-jsdom (DOM environment for tests)

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (auto-rerun on file changes)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

The tests are organized in the following structure:

```
popup.test.js
├── extractArticleText
│   ├── Text extraction from various selectors
│   ├── Cleaning unwanted elements
│   └── Character limiting
├── summarizeText - Success Cases
│   ├── API calls
│   └── Model fallback logic
├── summarizeText - Error Handling
│   ├── Invalid API keys
│   ├── Rate limits
│   └── Network errors
├── summarizeBtn Click Handler
│   ├── Loading states
│   ├── Status messages
│   └── Error handling
└── copyBtn Click Handler
    ├── Clipboard operations
    └── Button state management
```

## Mocks

The test suite includes mocks for:
- **Chrome Extension API** (`chrome.tabs`, `chrome.scripting`)
- **Fetch API** (for Gemini API calls)
- **Clipboard API** (`navigator.clipboard.writeText`)
- **DOM Environment** (via jsdom)

## Test Results

After running tests, you'll see output like:

```
 PASS  ./popup.test.js
  Article Summarizer Extension Tests
    extractArticleText
      ✓ should extract text from article tag
      ✓ should extract text from main tag
      ...
    summarizeText - Success Cases
      ✓ should successfully return summary from Gemini API
      ...
    summarizeText - Error Handling
      ✓ should handle invalid API key error (400)
      ...
    summarizeBtn Click Handler
      ✓ should set loading state when summarize button is clicked
      ...
    copyBtn Click Handler
      ✓ should copy summary to clipboard
      ...

Test Suites: 1 passed, 1 total
Tests:       47 passed, 47 total
```

## Coverage Report

The coverage report shows which lines of `popup.js` are covered by tests:

```
-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------|---------|----------|---------|---------|-------------------
popup.js         |   XX.XX |    XX.XX |   XX.XX |   XX.XX | 
-----------------|---------|----------|---------|---------|-------------------
```

## Notes

- The tests use Jest's mocking capabilities to simulate Chrome Extension APIs, which are not available in the Node.js test environment
- The DOM is simulated using jsdom, which provides a browser-like environment for testing
- All asynchronous operations (API calls, clipboard operations) are properly mocked and tested
- The test suite includes both unit tests (individual functions) and integration tests (button click handlers)

## Troubleshooting

If tests fail:

1. **Check Node.js version**: Ensure you're using Node.js 14 or higher
2. **Clear Jest cache**: Run `npx jest --clearCache`
3. **Reinstall dependencies**: Delete `node_modules` and run `npm install` again
4. **Check test output**: Read the error messages carefully to identify the failing test

## Contributing

When adding new features to the extension:

1. Write tests for the new functionality
2. Ensure all existing tests still pass
3. Aim for high test coverage (>80%)
4. Follow the existing test structure and naming conventions
