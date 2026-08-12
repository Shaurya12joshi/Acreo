function detectListingType(title) {
  const t = title?.toLowerCase() || "";
  if (t.includes("rent")) return "rent";
  if (t.includes("sale") || t.includes("resale")) return "sale";
  return "unknown";
}

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

function extractSecurityDeposit(cardEl) {
  const listWrapper = cardEl.closest('[id^="cardid"]');
  const scopes = [cardEl, listWrapper].filter(Boolean);

  for (const scope of scopes) {
    const rows = scope.querySelectorAll(".mb-srp__card_breakup_row");
    for (const row of rows) {
      const label = row.querySelector(".mb-srp__card_breakup_row--label")?.textContent.trim();
      if (label && label.toLowerCase() === "security deposit") {
        const valueEl = row.querySelector(".mb-srp__card_breakup_row--value");
        const amount = valueEl?.textContent.replace(/\s+/g, " ").trim().replace(/₹\s+/, "₹");
        return amount || null;
      }
    }
  }

  return null;
}

function extractListingData(cardEl) {
  const listWrapper = cardEl.closest('[id^="cardid"]');
  const id = listWrapper?.id;
  const title = cardEl.querySelector(".mb-srp__card--title")?.getAttribute("title")?.trim();
  const priceAmount = cardEl.querySelector(".mb-srp__card__price--amount")?.textContent.trim();
  const priceLabel = cardEl.querySelector(".mb-srp__card__price--other-charges")?.textContent.trim();
  const securityDeposit = extractSecurityDeposit(cardEl);

  return {
    id,
    title,
    listingType: detectListingType(title),
    priceAmount,
    priceLabel,
    securityDeposit,
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

chrome.runtime.sendMessage({ type: "LISTING_VIEWED", url: window.location.href });