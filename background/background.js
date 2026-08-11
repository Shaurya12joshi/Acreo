chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NEW_LISTINGS") {
    saveListings(message.listings);
  } else if (message.type === "LISTING_VIEWED") {
    markListingSeen(message.url);
  }
});

function normalizeUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("magicbricks.com")) {
      const idMatch = (u.pathname + u.search).match(/[?&]id=([0-9a-fA-F]+)/);
      if (idMatch) return `${u.origin}::id=${idMatch[1].toLowerCase()}`;
    }
    u.hash = "";
    const path = u.pathname.replace(/\/+$/, "");
    return `${u.origin}${path}${u.search}`;
  } catch (err) {
    return url;
  }
}

async function saveListings(newListings) {
  const { listings = [] } = await chrome.storage.local.get("listings");

  const byId = new Map(listings.map((listing) => [listing.id, listing]));
  newListings.forEach((listing) => {
    const existing = byId.get(listing.id);
    byId.set(listing.id, existing ? { ...existing, ...listing } : listing);
  });

  await chrome.storage.local.set({ listings: Array.from(byId.values()) });
}

async function markListingSeen(url) {
  const target = normalizeUrl(url);
  if (!target) return;

  const { listings = [] } = await chrome.storage.local.get("listings");
  let changed = false;
  const updated = listings.map((listing) => {
    if (!listing.seen && normalizeUrl(listing.link) === target) {
      changed = true;
      return { ...listing, seen: true };
    }
    return listing;
  });

  if (changed) {
    await chrome.storage.local.set({ listings: updated });
  }
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("ui/index.html") });
});