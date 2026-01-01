

function generateFirebaseCode(productId, appName) {
  return `
<script type="module">
// Firebase Product Status Management
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfigStatus = {
  apiKey: "AIzaSyDolzQZPSdzWQiYbqjhlyNkjE9LrYxkb7E",
  authDomain: "solaris-database-b5384.firebaseapp.com",
  projectId: "solaris-database-b5384",
  storageBucket: "solaris-database-b5384.firebasestorage.app",
  messagingSenderId: "229880902004",
  appId: "1:229880902004:web:34be022f36ac4157433c21",
  measurementId: "G-27L86KFYG6"
};

const appStatus = initializeApp(firebaseConfigStatus, "${appName}");
const dbStatus = getFirestore(appStatus);

const STATUS_CONFIG = {
  "UNKNOWN": { background: "rgba(128,128,128,0.20)", color: "#808080", icon: "fas fa-question-circle" },
  "Undetected (Working)": { background: "rgba(34,228,29,0.20)", color: "#22e41d", icon: "fas fa-shield-alt" },
  "Updating (Not Working)": { background: "rgba(0,123,255,0.20)", color: "#007bff", icon: "fas fa-wrench" },
  "Detected (Not Working)": { background: "rgba(255,0,0,0.20)", color: "#ff0000", icon: "fas fa-exclamation-triangle" },
  "Maintenance": { background: "rgba(255,165,0,0.20)", color: "#ffa500", icon: "fas fa-tools" }
};

const STATUS_CACHE_KEY = 'productStatuses_cache';
const STATUS_CACHE_TIMESTAMP = 'productStatuses_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000;

function loadStatusesFromCache() {
  try {
    const cached = localStorage.getItem(STATUS_CACHE_KEY);
    const timestamp = localStorage.getItem(STATUS_CACHE_TIMESTAMP);
    if (cached && timestamp && (Date.now() - parseInt(timestamp)) < CACHE_DURATION) {
      return JSON.parse(cached);
    }
  } catch (e) {}
  return null;
}

function saveStatusesToCache(statuses) {
  try {
    localStorage.setItem(STATUS_CACHE_KEY, JSON.stringify(statuses));
    localStorage.setItem(STATUS_CACHE_TIMESTAMP, Date.now().toString());
  } catch (e) {}
}

function updateProductStatus(productId, statusText) {
  const statusBadge = document.querySelector(\`.product-status-badge[data-product-id="\${productId}"]\`);
  if (!statusBadge) return;
  
  const config = STATUS_CONFIG[statusText] || STATUS_CONFIG["UNKNOWN"];
  const iconElement = statusBadge.querySelector('i');
  const textElement = statusBadge.querySelector('.status-text');
  
  if (iconElement) iconElement.className = config.icon;
  if (textElement) textElement.textContent = statusText;
  statusBadge.style.background = config.background;
  statusBadge.style.color = config.color;
}

async function initializeProductStatus() {
  const productId = '${productId}';
  
  const cachedStatuses = loadStatusesFromCache();
  if (cachedStatuses && cachedStatuses[productId] && cachedStatuses[productId].status) {
    updateProductStatus(productId, cachedStatuses[productId].status);
  }
  
  try {
    const statusesRef = collection(dbStatus, "productStatuses");
    const fetchPromise = getDocs(statusesRef);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
    
    let snapshot;
    try {
      snapshot = await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      if (error.message === 'Timeout') return;
      throw error;
    }
    
    const statuses = {};
    snapshot.forEach((doc) => { statuses[doc.id] = doc.data(); });
    saveStatusesToCache(statuses);
    
    if (statuses[productId] && statuses[productId].status) {
      updateProductStatus(productId, statuses[productId].status);
    }
    
    onSnapshot(statusesRef, (snapshot) => {
      const updatedStatuses = {};
      snapshot.forEach((doc) => { updatedStatuses[doc.id] = doc.data(); });
      saveStatusesToCache(updatedStatuses);
      if (updatedStatuses[productId] && updatedStatuses[productId].status) {
        updateProductStatus(productId, updatedStatuses[productId].status);
      }
    });
  } catch (error) {
    console.error("Error loading status:", error);
    const cachedStatuses = loadStatusesFromCache();
    if (cachedStatuses && cachedStatuses[productId] && cachedStatuses[productId].status) {
      updateProductStatus(productId, cachedStatuses[productId].status);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProductStatus);
} else {
  initializeProductStatus();
}
</script>
`;
}



