const toggle = document.getElementById('toggle');
const status = document.getElementById('status');

chrome.storage.sync.get(['enabled'], (res) => {
  const on = res.enabled !== false;
  toggle.checked = on;
  updateStatus(on);
});

toggle.addEventListener('change', () => {
  const on = toggle.checked;
  chrome.storage.sync.set({ enabled: on });
  updateStatus(on);
});

function updateStatus(on) {
  if (on) {
    status.textContent = '● Active on LeetCode';
    status.className = 'status on';
  } else {
    status.textContent = '○ Disabled';
    status.className = 'status';
  }
}
