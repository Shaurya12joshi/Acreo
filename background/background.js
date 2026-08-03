// Runs in its own context — no DOM, no access to any page's content.
// Its job: relay data between content scripts and storage, and open the UI.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NEW_LISTINGS") {
    saveListings(message.listings);
  }
});

async function saveListings(newListings) {
  const { listings = [] } = await chrome.storage.local.get("listings");

  const byId = new Map(listings.map((listing) => [listing.id, listing]));
  newListings.forEach((listing) => byId.set(listing.id, listing));

  await chrome.storage.local.set({ listings: Array.from(byId.values()) });
}

// Clicking the extension's toolbar icon opens our results page as a normal tab.
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("ui/index.html") });
});
