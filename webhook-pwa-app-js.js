let webhooks = [];
let editingIndex = -1;

// Load webhooks from localStorage
function loadWebhooks() {
  const stored = localStorage.getItem('webhooks');
  webhooks = stored ? JSON.parse(stored) : [];
  renderWebhooks();
}

// Save webhooks to localStorage
function saveWebhooks() {
  localStorage.setItem('webhooks', JSON.stringify(webhooks));
}

// Show status message
function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  
  setTimeout(() => {
    statusEl.className = 'status';
  }, 4000);
}

// Render webhooks list
function renderWebhooks() {
  const listEl = document.getElementById('webhookList');
  
  if (webhooks.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p>No webhooks configured yet.<br>Add one below to get started!</p>
      </div>
    `;
    return;
  }
  
  listEl.innerHTML = webhooks.map((webhook, index) => `
    <div class="webhook-item">
      <div style="flex: 1;">
        <div class="webhook-label">${escapeHtml(webhook.label)}</div>
        <div class="webhook-url">${escapeHtml(webhook.url)}</div>
      </div>
      <button class="btn btn-icon" onclick="editWebhook(${index})">✏️</button>
      <button class="btn btn-icon" onclick="deleteWebhook(${index})">🗑️</button>
    </div>
  `).join('');
}

// Show add/edit form
function showForm(index = -1) {
  editingIndex = index;
  const formCard = document.getElementById('formCard');
  const formTitle = document.getElementById('formTitle');
  const labelInput = document.getElementById('webhookLabel');
  const urlInput = document.getElementById('webhookUrl');
  
  if (index >= 0) {
    formTitle.textContent = 'Edit Webhook';
    labelInput.value = webhooks[index].label;
    urlInput.value = webhooks[index].url;
  } else {
    formTitle.textContent = 'Add Webhook';
    labelInput.value = '';
    urlInput.value = '';
  }
  
  formCard.style.display = 'block';
  labelInput.focus();
}

// Hide form
function hideForm() {
  document.getElementById('formCard').style.display = 'none';
  editingIndex = -1;
}

// Edit webhook
function editWebhook(index) {
  showForm(index);
}

// Delete webhook
function deleteWebhook(index) {
  if (confirm('Are you sure you want to delete this webhook?')) {
    webhooks.splice(index, 1);
    saveWebhooks();
    renderWebhooks();
    showStatus('Webhook deleted', 'success');
  }
}

// Save webhook
function saveWebhook() {
  const label = document.getElementById('webhookLabel').value.trim();
  const url = document.getElementById('webhookUrl').value.trim();
  
  if (!label || !url) {
    showStatus('Please fill in all fields', 'error');
    return;
  }
  
  if (!isValidUrl(url)) {
    showStatus('Please enter a valid URL', 'error');
    return;
  }
  
  if (editingIndex >= 0) {
    webhooks[editingIndex] = { label, url };
    showStatus('Webhook updated!', 'success');
  } else {
    webhooks.push({ label, url });
    showStatus('Webhook added!', 'success');
  }
  
  saveWebhooks();
  renderWebhooks();
  hideForm();
}

// Send to webhook
async function sendToWebhook(index, sharedUrl, sharedTitle) {
  const webhook = webhooks[index];
  
  try {
    showStatus(`Sending to "${webhook.label}"...`, 'info');
    
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: sharedUrl,
        title: sharedTitle,
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      showStatus(`✅ Sent to "${webhook.label}"`, 'success');
      
      // Clear share parameters and redirect to home after success
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } else {
      showStatus(`❌ Failed to send to "${webhook.label}"`, 'error');
    }
  } catch (error) {
    showStatus(`❌ Error: ${error.message}`, 'error');
  }
}

// Handle shared URL
function handleSharedUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUrl = urlParams.get('url') || urlParams.get('text');
  const sharedTitle = urlParams.get('title') || '';
  
  if (sharedUrl) {
    const shareCard = document.getElementById('shareCard');
    const sharedUrlEl = document.getElementById('sharedUrl');
    const shareWebhookList = document.getElementById('shareWebhookList');
    
    sharedUrlEl.innerHTML = `<strong>URL:</strong> ${escapeHtml(sharedUrl)}`;
    
    if (webhooks.length === 0) {
      shareWebhookList.innerHTML = `
        <div class="empty-state">
          <p>No webhooks configured yet.<br>Please add a webhook first.</p>
        </div>
      `;
    } else {
      shareWebhookList.innerHTML = webhooks.map((webhook, index) => `
        <button class="btn btn-success" style="width: 100%; margin-bottom: 10px;" onclick="sendToWebhook(${index}, '${escapeHtml(sharedUrl)}', '${escapeHtml(sharedTitle)}')">
          Send to ${escapeHtml(webhook.label)}
        </button>
      `).join('');
    }
    
    shareCard.style.display = 'block';
  }
}

// Validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Check if app is installed
function checkInstallStatus() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    // App is installed
    return;
  }
  
  // Show install prompt
  const installPrompt = document.getElementById('installPrompt');
  if (installPrompt) {
    installPrompt.style.display = 'block';
  }
}

// Event listeners
document.getElementById('addNewBtn').addEventListener('click', () => showForm());
document.getElementById('saveBtn').addEventListener('click', saveWebhook);
document.getElementById('cancelBtn').addEventListener('click', hideForm);

// Initialize
loadWebhooks();
handleSharedUrl();
checkInstallStatus();