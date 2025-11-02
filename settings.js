// Backend URL for license verification
const BACKEND_URL = "https://article-summarizer-tan-two.vercel.app/verify";

// Payment page URL - Replace with your actual payment/checkout page
const PAYMENT_PAGE_URL = "https://your-payment-page.com";

// Load existing license key on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentKey();
  
  // Initialize upgrade button
  initializeUpgradeButton();
});

// Save button handler
document.getElementById('saveBtn').addEventListener('click', async () => {
  const licenseKey = document.getElementById('licenseKey').value.trim();
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  // Validate input
  if (!licenseKey) {
    showStatus('Please enter a license key', 'error');
    return;
  }

  // Disable button and show loading state
  saveBtn.disabled = true;
  saveBtn.textContent = 'Verifying...';
  status.className = 'status';

  try {
    // Verify the license key
    const isValid = await verifyLicenseKey(licenseKey);

    if (isValid) {
      // Save to storage
      await chrome.storage.local.set({ 
        licenseKey: licenseKey,
        isPro: true 
      });
      
      showStatus('License activated successfully!', 'success');
      document.getElementById('licenseKey').value = '';
      
      // Show current key
      await loadCurrentKey();
    } else {
      showStatus('Invalid or expired key', 'error');
    }
  } catch (error) {
    console.error('Verification error:', error);
    showStatus('Failed to verify license. Please check your connection.', 'error');
  } finally {
    // Re-enable button
    saveBtn.disabled = false;
    saveBtn.textContent = 'Verify & Save License';
  }
});

// Verify license key with backend
async function verifyLicenseKey(key) {
  console.log('[VERIFY] Starting license verification...');
  console.log('[VERIFY] Backend URL:', BACKEND_URL);
  
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey: key })
    });

    console.log('[VERIFY] Response status:', response.status);

    if (!response.ok) {
      console.error('[VERIFY] HTTP error:', response.status, response.statusText);
      return false;
    }

    const data = await response.json();
    console.log('[VERIFY] Response data:', JSON.stringify(data, null, 2));
    
    // Check if the response indicates a valid license
    const isValid = data.valid === true || data.success === true;
    
    if (isValid) {
      console.log('[VERIFY] License key is VALID');
    } else {
      console.log('[VERIFY] License key is INVALID:', data.message || data.error);
    }
    
    return isValid;
    
  } catch (error) {
    console.error('[VERIFY] Network error during verification:', error);
    throw error;
  }
}

// Load and display current license key
async function loadCurrentKey() {
  const data = await chrome.storage.local.get(['licenseKey', 'isPro']);
  const currentKeyDiv = document.getElementById('currentKey');

  if (data.isPro && data.licenseKey) {
    const maskedKey = maskLicenseKey(data.licenseKey);
    currentKeyDiv.innerHTML = `<strong>Current License:</strong> ${maskedKey} (Active)`;
    currentKeyDiv.style.display = 'block';
  } else {
    currentKeyDiv.style.display = 'none';
  }
}

// Mask license key for display (show only first and last 4 characters)
function maskLicenseKey(key) {
  if (key.length <= 8) {
    return key;
  }
  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  const middle = '*'.repeat(Math.min(key.length - 8, 12));
  return `${start}${middle}${end}`;
}

// Show status message
function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status show ${type}`;
}

// Export isProUser function for use in other files
async function isProUser() {
  const data = await chrome.storage.local.get(['licenseKey', 'isPro']);
  
  // If no license key, return false
  if (!data.licenseKey || !data.isPro) {
    return false;
  }

  // Verify the license key is still valid
  try {
    const isValid = await verifyLicenseKey(data.licenseKey);
    
    if (!isValid) {
      // Clear invalid license from storage
      await chrome.storage.local.set({ isPro: false });
      return false;
    }
    
    return true;
  } catch (error) {
    // On network error, trust the local storage (offline mode)
    console.warn('Could not verify license online, using cached status');
    return data.isPro === true;
  }
}

// Initialize upgrade button
function initializeUpgradeButton() {
  const goProBtn = document.getElementById('goProBtn');
  
  if (!goProBtn) return;
  
  goProBtn.addEventListener('click', () => {
    console.log('[UPGRADE] Opening payment page...');
    
    // Open payment page in new tab
    chrome.tabs.create({ url: PAYMENT_PAGE_URL });
  });
}

