function extractSummaryFields(cardEl) {
  const items = cardEl.querySelectorAll(".mb-srp__card__summary__list--item");
  const fields = {};
  items.forEach((item) => {
    const key = item.getAttribute("data-summary");
    const value = item.querySelector(".mb-srp__card__summary--value")?.textContent.trim();
    if (key) fields[key] = value;
  });
  return fields;
}

function detectListingType(title) {
  const t = title?.toLowerCase() || "";
  if (t.includes("rent")) return "rent";
  if (t.includes("sale") || t.includes("resale")) return "sale";
  return "unknown";
}

function extractListingData(cardEl) {
  const listWrapper = cardEl.closest('[id^="cardid"]');
  const id = listWrapper?.id;
  const title = cardEl.querySelector(".mb-srp__card--title")?.getAttribute("title")?.trim();
  const priceAmount = cardEl.querySelector(".mb-srp__card__price--amount")?.textContent.trim();
  const priceLabel = cardEl.querySelector(".mb-srp__card__price--other-charges")?.textContent.trim();

  return {
    id,
    title,
    listingType: detectListingType(title),
    priceAmount,
    priceLabel,
    link: buildPropertyUrl(cardEl),
    ...extractSummaryFields(cardEl),
    source: "magicbricks",
  };
}
const seenCardIds = new Set();

function scrapeNewListings() {
  const cards = document.querySelectorAll(".mb-srp__card");
  const freshResults = [];

  cards.forEach((cardEl) => {
    const listWrapper = cardEl.closest('[id^="cardid"]');
    const cardId = listWrapper?.id;
    if (cardId && !seenCardIds.has(cardId)) {
      seenCardIds.add(cardId);
      freshResults.push(extractListingData(cardEl));
    }
  });

  if (freshResults.length > 0) {
    chrome.runtime.sendMessage({ type: "NEW_LISTINGS", listings: freshResults });
  }
}

function startObserving() {
  const observer = new MutationObserver(scrapeNewListings);
  observer.observe(document.body, { childList: true, subtree: true });

  scrapeNewListings();
}

startObserving();

function stringToHex(str) {
  return Array.from(str)
    .map((c) => c.charCodeAt(0).toString(16))
    .join("");
}

function buildPropertyUrl(cardEl) {
  const listWrapper = cardEl.closest('[id^="cardid"]');
  const cardId = listWrapper?.id.replace("cardid", "");
  if (!cardId) return null;
  const encodedId = stringToHex("MB" + cardId);
  return `https://www.magicbricks.com/propertyDetails/property&id=${encodedId}`;
}
