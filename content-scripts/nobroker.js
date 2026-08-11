function detectListingType(title) {
  const t = title?.toLowerCase() || "";
  if (t.includes("rent")) return "rent";
  if (t.includes("sale") || t.includes("resale")) return "sale";
  return "unknown";
}

function extractOverviewBoxes(cardEl) {
  const boxes = cardEl.querySelectorAll(".flex.flex-col.items-center");
  const fields = {};
  boxes.forEach((box) => {
    const amount = box.querySelector(".font-semi-bold.heading-6")?.textContent.trim();
    const label = box.querySelector(".heading-7")?.textContent.trim();
    if (label && amount) fields[label] = amount;
  });
  return fields;
}

function extractLabeledFields(cardEl) {
  const labels = cardEl.querySelectorAll(".heading-7.text-default-color");
  const fields = {};
  labels.forEach((labelEl) => {
    const label = labelEl.textContent.trim();
    const value =
      labelEl.parentElement?.querySelector(".font-semibold")?.textContent.trim() ||
      labelEl.parentElement?.parentElement?.querySelector(".font-semibold")?.textContent.trim();
    if (label && value) fields[label] = value;
  });
  return fields;
}

function extractPriceBox(cardEl) {
  const box = cardEl.querySelector('[id="minDeposit"]');
  if (!box) return null;
  return box.querySelector(".font-semi-bold.heading-6")?.textContent.trim() || null;
}

function extractListingData(cardEl) {
  const id = cardEl.id;
  const titleLink = cardEl.querySelector("h2 a");
  const title = titleLink?.textContent.trim();
  if (!title) return null;

  const href = titleLink.getAttribute("href");
  const link = href ? new URL(href, window.location.origin).href : null;

  const priceMeta = cardEl.querySelector('meta[itemprop="price"]')?.getAttribute("content");
  let priceAmount = priceMeta ? `₹${priceMeta.replace("INR", "").trim()}` : null;

  const overview = extractOverviewBoxes(cardEl);
  const labeled = extractLabeledFields(cardEl);
  const boxAmount = extractPriceBox(cardEl);
  const listingType = detectListingType(title);

  if (!priceAmount && boxAmount) {
    priceAmount = boxAmount;
  }

  let priceLabel = null;
  if (overview["Deposit"]) {
    priceLabel = `Deposit ${overview["Deposit"]}`;
  }

  return {
    id,
    title,
    listingType,
    priceAmount,
    priceLabel,
    link,
    "carpet-area": overview["Builtup"],
    furnishing: labeled["Furnishing"],
    "tenent-preffered": labeled["Preferred Tenants"],
    source: "nobroker",
  };
}

const seenCardIds = new Set();

function scrapeNewListings() {
  const cards = document.querySelectorAll('div[itemtype="http://schema.org/Apartment"][id]');
  const freshResults = [];

  cards.forEach((cardEl) => {
    if (!cardEl.id || seenCardIds.has(cardEl.id)) return;
    seenCardIds.add(cardEl.id);

    const data = extractListingData(cardEl);
    if (data) freshResults.push(data);
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