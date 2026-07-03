const APP_BASE_URL = 'http://localhost:5173/';

const pageTitle = document.querySelector('#pageTitle');
const pageUrl = document.querySelector('#pageUrl');
const addButton = document.querySelector('#addButton');
const openButton = document.querySelector('#openButton');
const errorBox = document.querySelector('#error');

function setError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function appUrlWithCurrentTab(tab) {
  const url = new URL(APP_BASE_URL);
  url.searchParams.set('addUrl', tab.url);
  url.searchParams.set('addTitle', tab.title || tab.url);
  return url.toString();
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function canShare(tab) {
  return Boolean(tab?.url && /^https?:\/\//i.test(tab.url));
}

document.addEventListener('DOMContentLoaded', async () => {
  let tab;

  try {
    tab = await getCurrentTab();
  } catch (err) {
    setError('Could not read the current tab. Try opening a normal web page first.');
    return;
  }

  pageTitle.textContent = tab?.title || 'Untitled page';
  pageUrl.textContent = tab?.url || 'No URL available';
  addButton.disabled = !canShare(tab);

  if (!canShare(tab)) {
    setError('Only http(s) pages can be added to a lesson pack.');
  }

  addButton.addEventListener('click', () => {
    chrome.tabs.create({ url: appUrlWithCurrentTab(tab) });
  });

  openButton.addEventListener('click', () => {
    chrome.tabs.create({ url: APP_BASE_URL });
  });
});
