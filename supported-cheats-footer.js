import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { collection, getDocs, getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDolzQZPSdzWQiYbqjhlyNkjE9LrYxkb7E",
  authDomain: "solaris-database-b5384.firebaseapp.com",
  projectId: "solaris-database-b5384",
  storageBucket: "solaris-database-b5384.firebasestorage.app",
  messagingSenderId: "229880902004",
  appId: "1:229880902004:web:34be022f36ac4157433c21",
  measurementId: "G-27L86KFYG6"
};

const STATUS_CACHE_KEY = "productStatuses_cache";
const STATUS_CACHE_TIMESTAMP = "productStatuses_cache_timestamp";
const CACHE_DURATION_MS = 5 * 60 * 1000;

function productUrlForId(productId) {
  const pid = String(productId || "").trim();
  if (!pid) return "#";
  const encoded = encodeURIComponent(pid);
  const host = (location.hostname || "").toLowerCase();
  const isLocal = host === "localhost" || host === "127.0.0.1";
  return isLocal ? `product.html?id=${encoded}` : `/product/${encoded}`;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function chunk(array, size) {
  const s = Math.max(1, Number(size) || 1);
  const result = [];
  for (let i = 0; i < array.length; i += s) {
    result.push(array.slice(i, i + s));
  }
  return result;
}

function loadStatusesFromCache() {
  try {
    const cached = localStorage.getItem(STATUS_CACHE_KEY);
    const ts = localStorage.getItem(STATUS_CACHE_TIMESTAMP);
    if (!cached || !ts) return null;
    const age = Date.now() - parseInt(ts, 10);
    if (!Number.isFinite(age) || age > CACHE_DURATION_MS) return null;
    const parsed = JSON.parse(cached);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function saveStatusesToCache(statuses) {
  try {
    localStorage.setItem(STATUS_CACHE_KEY, JSON.stringify(statuses));
    localStorage.setItem(STATUS_CACHE_TIMESTAMP, Date.now().toString());
  } catch {
  }
}

async function fetchStatusesFromFirestore() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const statusesRef = collection(db, "productStatuses");
  const fetchPromise = getDocs(statusesRef);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Firestore timeout")), 3000);
  });
  const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
  const statuses = {};
  snapshot.forEach((docSnap) => {
    statuses[docSnap.id] = docSnap.data();
  });
  return statuses;
}

function buildProductsFromStatuses(statuses) {
  const entries = Object.entries(statuses || {})
    .filter(([id, value]) => id && id !== "home-cards" && value && typeof value === "object")
    .map(([id, value]) => {
      const nameRaw =
        (typeof value.productName === "string" && value.productName.trim())
          ? value.productName.trim()
          : ((typeof value.name === "string" && value.name.trim()) ? value.name.trim() : id);
      return { id, name: nameRaw };
    });

  entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return entries;
}

function findSupportedCheatsLinkContainers() {
  const headings = Array.from(document.querySelectorAll(".cFooterLinks_title"));
  return headings
    .filter((h) => (h.textContent || "").trim().toLowerCase() === "supported cheats")
    .map((h) => {
      const column = h.closest(".cFooterLinks_column") || h.parentElement;
      if (!column) return null;
      return column.querySelector(".cFooterLinks");
    })
    .filter(Boolean);
}

function renderSupportedCheats(container, products) {
  if (!container) return;

  const groups = chunk(products, 4);
  const listsHtml = groups
    .map((group) => {
      const itemsHtml = group
        .map((p) => {
          const href = productUrlForId(p.id);
          return `<li><a href="${escapeHtml(href)}">${escapeHtml(p.name)}</a></li>`;
        })
        .join("");
      return `<ul class="cFooterLinks_list">${itemsHtml}</ul>`;
    })
    .join("");

  container.style.display = "flex";
  container.style.gap = "24px";
  container.style.flexWrap = "wrap";
  container.innerHTML = listsHtml;
}

async function hydrateSupportedCheatsFooters() {
  const containers = findSupportedCheatsLinkContainers();
  if (!containers.length) return;

  const cached = loadStatusesFromCache();
  if (cached) {
    const products = buildProductsFromStatuses(cached);
    containers.forEach((c) => renderSupportedCheats(c, products));
  }

  try {
    const statuses = await fetchStatusesFromFirestore();
    saveStatusesToCache(statuses);
    const products = buildProductsFromStatuses(statuses);
    containers.forEach((c) => renderSupportedCheats(c, products));
  } catch {
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", hydrateSupportedCheatsFooters);
} else {
  hydrateSupportedCheatsFooters();
}
