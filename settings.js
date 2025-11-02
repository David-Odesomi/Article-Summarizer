// Backend URL for license verification
const BACKEND_URL = "https://article-summarizer-tan-two.vercel.app/verify";

// Paddle Configuration
const PADDLE_PRODUCT_ID = 'YOUR_PRODUCT_ID_HERE'; // Replace with your actual Paddle Product ID

// Initialize Paddle
if (typeof Paddle !== 'undefined') {
  Paddle.Environment.set("production");
  Paddle.Setup({ token: "live_71f116890e42a1b5fc20654efde" });
}

// Load existing license key on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadCurrentKey();
  
  // Initialize Paddle checkout button
  initializePaddleCheckout();
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
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey: key })
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    
    // Check if the response indicates a valid license
    return data.valid === true || data.success === true;
    
  } catch (error) {
    console.error('Network error during verification:', error);
    throw error;
  }
}

// Load and display current license key
async function loadCurrentKey() {
  const data = await chrome.storage.local.get(['licenseKey', 'isPro']);
  const currentKeyDiv = document.getElementById('currentKey');

  if (data.isPro && data.licenseKey) {
    const maskedKey = maskLicenseKey(data.licenseKey);
    currentKeyDiv.innerHTML = `<strong>Current License:</strong> ${maskedKey} ✓`;
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

// Initialize Paddle checkout
function initializePaddleCheckout() {
  const goProBtn = document.getElementById('goProBtn');
  
  if (!goProBtn) return;
  
  goProBtn.addEventListener('click', () => {
    if (typeof Paddle === 'undefined') {
      showStatus('Payment system not loaded. Please refresh the page.', 'error');
      return;
    }
    
    // Open Paddle checkout
    Paddle.Checkout.open({
      product: PADDLE_PRODUCT_ID,
      successCallback: function(data) {
        // Payment successful
        console.log('Purchase successful:', data);
        
        // Show success banner
        showSuccessBanner();
        
        // Also show status message below
        showStatus('Payment successful! Check your email for the license key.', 'success');
      },
      closeCallback: function(data) {
        // Checkout closed
        console.log('Checkout closed:', data);
        
        // Only show message if checkout was closed without completing
        if (!data || !data.checkout || !data.checkout.completed) {
          showStatus('Checkout cancelled', 'info');
        }
      }
    });
  });
}

// Show success banner at the top
function showSuccessBanner() {
  const banner = document.getElementById('successBanner');
  const container = document.querySelector('.container');
  
  if (banner) {
    banner.classList.add('show');
    container.classList.add('with-banner');
    
    // Auto-hide banner after 10 seconds
    setTimeout(() => {
      banner.classList.remove('show');
      container.classList.remove('with-banner');
    }, 10000);
  }
}

