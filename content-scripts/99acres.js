function detectListingType(title) {
  const t = title?.toLowerCase() || "";
  if (t.includes("rent")) return "rent";
  return "sale";
}

function extractAreaWrapFields(cardEl) {
  const wraps = cardEl.querySelectorAll(".tupleNew__areaWrap");
  return Array.from(wraps).map((wrap) => {
    const value = wrap.querySelector(".tupleNew__area1Type")?.textContent.trim();
    const label =
      wrap.querySelector(".tupleNew__areaType")?.textContent.trim() ||
      wrap.querySelector(".tupleNew__possessionBy")?.textContent.trim() ||
      null;
    return { value, label };
  });
}

function extractListingData(cardEl) {
  const id = cardEl.id;
  const heading = cardEl.querySelector(".tupleNew__propType")?.textContent.trim();
  if (!heading) return null;

  const rawLink = cardEl.querySelector("a.tupleNew__propertyHeading")?.getAttribute("href");
  const link = rawLink ? new URL(rawLink, window.location.origin).href : null;
  const priceAmount = cardEl.querySelector(".tupleNew__priceValWrap span")?.textContent.trim();
  const priceSubLine = cardEl.querySelector(".tupleNew__priceAndPerSqftWrap .tupleNew__perSqftWrap.ellipsis")?.textContent.trim();

  if (priceAmount?.includes(" - ")) return null;

  const details = extractAreaWrapFields(cardEl);
  const carpetArea = details[0]?.value;
  const bathroomEntry = details.find((d) => d.label?.toLowerCase().includes("bath"));
  const bathroom = bathroomEntry?.label?.replace(/baths?/i, "").trim();
  const statusEntry = details.find((d) => /ready|construction/i.test(d.label || ""));
  const status = statusEntry?.label;

  const floor = cardEl.querySelector(".tupleNew__unitHighlightTxt")?.textContent.trim();
  const furnishing = cardEl.querySelector(".tupleNew__furnished")?.textContent.trim();

  return {
    id,
    title: heading,
    listingType: detectListingType(heading),
    priceAmount,
    priceSubLine,
    link,
    "carpet-area": carpetArea,
    bathroom,
    floor,
    furnishing,
    status,
    source: "99acres",
  };
}

const seenCardIds = new Set();

function scrapeNewListings() {
  const cards = document.querySelectorAll(".tupleNew__outerTupleWrap[id]");
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