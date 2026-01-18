// Chat Tabs Manager - JavaScript Logic

// State
let tabs = [];
let isEditMode = false;
let currentEditId = null;
let contextMenuTarget = null;
let tabGroup = null;
let activeTabMap = {}; // Map of tab IDs to electron-tabs instances

// DOM Elements
const sidePanel = document.getElementById('sidePanel');
const sidePanelOverlay = document.getElementById('sidePanelOverlay');
const addTabBtn = document.getElementById('addTabBtn');
const addFirstTabBtn = document.getElementById('addFirstTabBtn');
const closePanelBtn = document.getElementById('closePanelBtn');
const cancelBtn = document.getElementById('cancelBtn');
const tabForm = document.getElementById('tabForm');
const panelTitle = document.getElementById('panelTitle');
const editNote = document.getElementById('editNote');
const partitionHelper = document.getElementById('partitionHelper');

const tabTitle = document.getElementById('tabTitle');
const tabUrl = document.getElementById('tabUrl');
const tabPartition = document.getElementById('tabPartition');
const tabId = document.getElementById('tabId');

const titleError = document.getElementById('titleError');
const urlError = document.getElementById('urlError');

const tabsTableBody = document.getElementById('tabsTableBody');
const emptyState = document.getElementById('emptyState');
const chatEmptyState = document.getElementById('chatEmptyState');
const managementView = document.getElementById('managementView');
const chatTabGroup = document.getElementById('chatTabGroup');
const sidebarTabsList = document.getElementById('sidebarTabsList');

const manageTabsBtn = document.getElementById('manageTabsBtn');
const backToChatsBtn = document.getElementById('backToChatsBtn');

const contextMenu = document.getElementById('contextMenu');
const copyPartitionBtn = document.getElementById('copyPartitionBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTabGroup();
  loadTabs();
  initEventListeners();
});

// Initialize electron-tabs
function initTabGroup() {
  tabGroup = document.querySelector('tab-group');
  if (tabGroup) {
    console.log('TabGroup initialized:', tabGroup);
  } else {
    console.error('TabGroup element not found!');
  }
}

// Load tabs from Electron store
function loadTabs() {
  // Send message to main process to get tabs
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('domContentLoaded', {});
    window.electron.ipcRenderer.on('domContentLoaded', (event, data) => {
      tabs = data || [];
      renderTabs();
      renderSidebarTabs();
      
      // Wait for tabGroup to be ready before rendering chat tabs
      if (tabGroup) {
        renderChatTabs();
      }
      
      updateEmptyState();
    });
  } else {
    // Fallback - no tabs initially
    tabs = [];
    renderTabs();
    renderSidebarTabs();
    updateEmptyState();
  }
}

// Update empty state visibility
function updateEmptyState() {
  if (tabs.length === 0) {
    chatEmptyState.classList.remove('hidden');
    chatTabGroup.style.display = 'none';
  } else {
    chatEmptyState.classList.add('hidden');
    chatTabGroup.style.display = 'flex';
  }
}

// Render chat tabs using electron-tabs
function renderChatTabs() {
  if (!tabGroup || tabs.length === 0) return;
  
  // Clear existing tabs
  const existingTabs = tabGroup.getTabs();
  existingTabs.forEach(tab => {
    if (tab.webview) {
      tab.close();
    }
  });
  activeTabMap = {};
  
  // Add all tabs
  tabs.forEach((tabData, index) => {
    addChatTab(tabData, index === 0);
  });
}

// Add a single chat tab
function addChatTab(data, makeActive = false) {
  if (!tabGroup) return;
  
  const tab = tabGroup.addTab({
    title: data.title,
    src: data.url,
    webviewAttributes: {
      id: data.id,
      partition: data.partition,
      allowpopups: 'true',
      webpreferences: 'nativeWindowOpen=true',
      useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    },
    closable: false,
    active: makeActive
  });
  
  activeTabMap[data.id] = tab;
  
  // Handle favicon updates
  if (tab.webview) {
    tab.webview.addEventListener('page-favicon-updated', (event) => {
      const favicon = event.favicons[0];
      if (favicon) {
        tab.setIcon(favicon);
        updateSidebarTabIcon(data.id, favicon);
      }
    });
    
    // Handle media notifications
    let mediaTimeStart = 0;
    tab.webview.addEventListener('media-started-playing', () => {
      mediaTimeStart = Date.now();
    });
    
    tab.webview.addEventListener('media-paused', () => {
      const mediaTimeEnd = Date.now();
      const mediaTime = mediaTimeEnd - mediaTimeStart;
      if (mediaTime < 1400 && window.api && window.api.showNoti) {
        window.api.showNoti(`${data.title}: Have a new message`);
      }
    });
  }
  
  return tab;
}

// Update sidebar tab icon
function updateSidebarTabIcon(tabId, iconUrl) {
  const sidebarTab = document.querySelector(`.sidebar-tab-item[data-id="${tabId}"] .tab-icon`);
  if (sidebarTab && iconUrl) {
    sidebarTab.src = iconUrl;
  }
}

// Render sidebar tabs list
function renderSidebarTabs() {
  if (tabs.length === 0) {
    sidebarTabsList.innerHTML = '<div class="empty-sidebar-message" style="padding: 16px; text-align: center; color: var(--color-text-tertiary); font-size: 13px;">No chats added yet</div>';
    return;
  }
  
  sidebarTabsList.innerHTML = tabs.map((tab, index) => `
    <button class="sidebar-tab-item ${index === 0 ? 'active' : ''}" data-id="${tab.id}">
      <img class="tab-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' fill='%23e1e4e8'/%3E%3C/svg%3E" alt="${escapeHtml(tab.title)}">
      <span class="tab-title">${escapeHtml(tab.title)}</span>
    </button>
  `).join('');
  
  // Add event listeners for sidebar tabs
  document.querySelectorAll('.sidebar-tab-item').forEach(item => {
    item.addEventListener('click', function() {
      switchToTab(this.dataset.id);
    });
  });
}

// Switch to a specific tab
function switchToTab(tabId) {
  const tab = activeTabMap[tabId];
  if (tab) {
    tab.activate();
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-tab-item').forEach(item => {
      item.classList.remove('active');
    });
    const sidebarItem = document.querySelector(`.sidebar-tab-item[data-id="${tabId}"]`);
    if (sidebarItem) {
      sidebarItem.classList.add('active');
    }
  }
}

// Render tabs table (management view)
function renderTabs() {
  if (tabs.length === 0) {
    tabsTableBody.innerHTML = '';
    emptyState.classList.add('visible');
    return;
  }

  emptyState.classList.remove('visible');
  
  tabsTableBody.innerHTML = tabs.map(tab => `
    <tr data-id="${tab.id}">
      <td>
        <div class="tab-title">${escapeHtml(tab.title)}</div>
      </td>
      <td>
        <div class="tab-url" title="${escapeHtml(tab.url)}">${escapeHtml(tab.url)}</div>
      </td>
      <td>
        <div class="tab-partition">
          <span>${escapeHtml(tab.partition)}</span>
          <button class="btn-copy" data-partition="${escapeHtml(tab.partition)}" title="Copy">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
              <path d="M3 10V3.5a1 1 0 011-1h6" stroke="currentColor" stroke-width="1.2"/>
            </svg>
          </button>
        </div>
      </td>
      <td>
        <span class="status-badge ${tab.status || 'active'}">
          <span class="status-dot"></span>
          ${(tab.status || 'active').charAt(0).toUpperCase() + (tab.status || 'active').slice(1)}
        </span>
      </td>
      <td>
        <button class="btn-actions" data-id="${tab.id}">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="5" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="15" r="1.5" fill="currentColor"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
  
  // Add event listeners for copy buttons and action buttons
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', function() {
      copyToClipboard(this.dataset.partition, this);
    });
  });
  
  document.querySelectorAll('.btn-actions').forEach(btn => {
    btn.addEventListener('click', function(event) {
      showContextMenu(event, this.dataset.id);
    });
  });
}

// Initialize event listeners
function initEventListeners() {
  // Debug: Check if elements exist
  console.log('Initializing event listeners...');
  console.log('addTabBtn:', addTabBtn);
  console.log('manageTabsBtn:', manageTabsBtn);
  
  // Open panel
  if (addTabBtn) {
    addTabBtn.addEventListener('click', (e) => {
      console.log('Add tab button clicked');
      openAddPanel();
    });
  } else {
    console.error('addTabBtn not found!');
  }
  
  if (addFirstTabBtn) {
    addFirstTabBtn.addEventListener('click', (e) => {
      console.log('Add first tab button clicked');
      openAddPanel();
    });
  }
  
  const addFirstTabBtnManagement = document.getElementById('addFirstTabBtnManagement');
  if (addFirstTabBtnManagement) {
    addFirstTabBtnManagement.addEventListener('click', (e) => {
      console.log('Add first tab (management) button clicked');
      openAddPanel();
    });
  }
  
  // View switching
  if (manageTabsBtn) {
    manageTabsBtn.addEventListener('click', (e) => {
      console.log('Manage tabs button clicked');
      showManagementView();
    });
  } else {
    console.error('manageTabsBtn not found!');
  }
  
  if (backToChatsBtn) {
    backToChatsBtn.addEventListener('click', (e) => {
      console.log('Back to chats button clicked');
      showChatsView();
    });
  }
  
  // Close panel
  if (closePanelBtn) {
    closePanelBtn.addEventListener('click', (e) => {
      console.log('Close button clicked');
      e.preventDefault();
      e.stopPropagation();
      closePanel();
    });
  } else {
    console.error('closePanelBtn not found!');
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      console.log('Cancel button clicked');
      e.preventDefault();
      closePanel();
    });
  }
  
  if (sidePanelOverlay) {
    sidePanelOverlay.addEventListener('click', (e) => {
      console.log('Overlay clicked');
      closePanel();
    });
  }
  
  // Form submission
  if (tabForm) {
    tabForm.addEventListener('submit', handleSubmit);
  }
  
  // Input validation
  if (tabTitle) {
    tabTitle.addEventListener('input', validateTitle);
  }
  if (tabUrl) {
    tabUrl.addEventListener('input', () => {
      validateUrl();
      updatePartition();
    });
  }
  
  // Copy partition button
  if (copyPartitionBtn) {
    copyPartitionBtn.addEventListener('click', () => {
      copyToClipboard(tabPartition.value, copyPartitionBtn);
    });
  }
  
  // Context menu
  document.addEventListener('click', () => {
    if (contextMenu) {
      contextMenu.classList.remove('open');
    }
  });
  
  if (contextMenu) {
    contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
      item.addEventListener('click', handleContextMenuAction);
    });
  }
  
  // Close context menu on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (contextMenu && contextMenu.classList.contains('open')) {
        contextMenu.classList.remove('open');
      } else if (sidePanel && sidePanel.classList.contains('open')) {
        closePanel();
      }
    }
  });
  
  console.log('Event listeners initialized successfully');
}

// Show management view
function showManagementView() {
  managementView.style.display = 'block';
  chatTabGroup.style.display = 'none';
  chatEmptyState.classList.add('hidden');
}

// Show chats view
function showChatsView() {
  managementView.style.display = 'none';
  updateEmptyState();
}

// Open add panel
function openAddPanel() {
  isEditMode = false;
  currentEditId = null;
  
  panelTitle.textContent = 'Add Chat Tab';
  editNote.style.display = 'none';
  partitionHelper.style.display = 'block';
  
  tabForm.reset();
  tabPartition.value = 'persist:...';
  tabId.value = '';
  
  clearErrors();
  sidePanel.classList.add('open');
  
  // Focus on title input
  setTimeout(() => tabTitle.focus(), 100);
}

// Open edit panel
function openEditPanel(id) {
  isEditMode = true;
  currentEditId = id;
  
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;
  
  panelTitle.textContent = 'Edit Chat Tab';
  editNote.style.display = 'flex';
  partitionHelper.style.display = 'none';
  
  tabTitle.value = tab.title;
  tabUrl.value = tab.url;
  tabPartition.value = tab.partition;
  tabId.value = tab.id;
  
  clearErrors();
  sidePanel.classList.add('open');
  
  // Focus on title input
  setTimeout(() => tabTitle.focus(), 100);
}

// Close panel
function closePanel() {
  console.log('Closing panel...');
  if (sidePanel) {
    sidePanel.classList.remove('open');
    console.log('Panel closed');
  }
  setTimeout(() => {
    if (tabForm) {
      tabForm.reset();
    }
    clearErrors();
  }, 300);
}

// Validate title
function validateTitle() {
  const value = tabTitle.value.trim();
  if (value === '') {
    tabTitle.classList.add('error');
    titleError.classList.add('visible');
    return false;
  }
  tabTitle.classList.remove('error');
  titleError.classList.remove('visible');
  return true;
}

// Validate URL
function validateUrl() {
  const value = tabUrl.value.trim();
  const httpsPattern = /^https:\/\/.+/;
  
  if (value === '' || !httpsPattern.test(value)) {
    tabUrl.classList.add('error');
    urlError.classList.add('visible');
    return false;
  }
  tabUrl.classList.remove('error');
  urlError.classList.remove('visible');
  return true;
}

// Clear errors
function clearErrors() {
  tabTitle.classList.remove('error');
  tabUrl.classList.remove('error');
  titleError.classList.remove('visible');
  urlError.classList.remove('visible');
}

// Update partition based on URL and title
function updatePartition() {
  if (isEditMode) return; // Don't update partition in edit mode
  
  const url = tabUrl.value.trim();
  const title = tabTitle.value.trim();
  
  if (url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      const safeName = (title || domain).toLowerCase().replace(/[^a-z0-9]/g, '');
      tabPartition.value = `persist:${safeName}-${Date.now().toString(36)}`;
    } catch (e) {
      tabPartition.value = 'persist:...';
    }
  }
}

// Handle form submission
function handleSubmit(e) {
  e.preventDefault();
  
  const isTitleValid = validateTitle();
  const isUrlValid = validateUrl();
  
  if (!isTitleValid || !isUrlValid) {
    return;
  }
  
  const formData = {
    title: tabTitle.value.trim(),
    url: tabUrl.value.trim(),
    partition: tabPartition.value,
    status: 'active'
  };
  
  if (isEditMode && currentEditId) {
    // Update existing tab
    formData.id = currentEditId;
    updateTab(formData);
  } else {
    // Add new tab
    addTab(formData);
  }
  
  closePanel();
}

// Add new tab
function addTab(data) {
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('addNewTab', data.title, data.url, data.partition);
    window.electron.ipcRenderer.once('addNewTab', (event, tab) => {
      tabs.push(tab);
      renderTabs();
      renderSidebarTabs();
      
      // Add chat tab
      addChatTab(tab, true);
      updateEmptyState();
      
      // Switch to chats view
      showChatsView();
    });
  } else {
    // Mock for testing
    const newTab = {
      ...data,
      id: Date.now().toString()
    };
    tabs.push(newTab);
    renderTabs();
    renderSidebarTabs();
    addChatTab(newTab, true);
    updateEmptyState();
    showChatsView();
  }
}

// Update tab
function updateTab(data) {
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('updateTab', data);
  }
  
  const index = tabs.findIndex(t => t.id === data.id);
  if (index !== -1) {
    tabs[index] = { ...tabs[index], ...data };
    renderTabs();
    
    // Notify the main window to reload tabs if needed
    setTimeout(() => {
      if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.send('domContentLoaded', {});
      }
    }, 100);
  }
}

// Delete tab
function deleteTab(id) {
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;
  
  const confirmed = confirm(`Are you sure you want to delete "${tab.title}"?\n\nThis will remove the tab and all its session data.`);
  if (!confirmed) return;
  
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('deleteTab', id);
  }
  
  // Remove from chat tabs
  const chatTab = activeTabMap[id];
  if (chatTab && chatTab.webview) {
    chatTab.close();
  }
  delete activeTabMap[id];
  
  tabs = tabs.filter(t => t.id !== id);
  renderTabs();
  renderSidebarTabs();
  updateEmptyState();
}

// Show context menu
function showContextMenu(event, id) {
  event.preventDefault();
  event.stopPropagation();
  
  contextMenuTarget = id;
  
  const rect = event.target.closest('button').getBoundingClientRect();
  contextMenu.style.left = `${rect.left}px`;
  contextMenu.style.top = `${rect.bottom + 4}px`;
  contextMenu.classList.add('open');
}

// Handle context menu actions
function handleContextMenuAction(event) {
  const action = event.currentTarget.dataset.action;
  contextMenu.classList.remove('open');
  
  if (!contextMenuTarget) return;
  
  if (action === 'edit') {
    openEditPanel(contextMenuTarget);
  } else if (action === 'delete') {
    deleteTab(contextMenuTarget);
  }
  
  contextMenuTarget = null;
}

// Copy to clipboard
function copyToClipboard(text, button) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showCopyFeedback(button);
    });
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showCopyFeedback(button);
  }
}

// Show copy feedback
function showCopyFeedback(button) {
  const originalHTML = button.innerHTML;
  button.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 7l3 3 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `;
  button.style.color = 'var(--color-success)';
  
  setTimeout(() => {
    button.innerHTML = originalHTML;
    button.style.color = '';
  }, 1500);
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
