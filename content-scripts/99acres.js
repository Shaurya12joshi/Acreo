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

  if (!heading || !heading.toLowerCase().includes("for rent")) return null;

  const link = cardEl.querySelector("a.tupleNew__propertyHeading")?.getAttribute("href");
  const priceAmount = cardEl.querySelector(".tupleNew__priceValWrap span")?.textContent.trim();
  const priceSubLine = cardEl.querySelector(".tupleNew__priceAndPerSqftWrap .tupleNew__perSqftWrap.ellipsis")?.textContent.trim();

  const details = extractAreaWrapFields(cardEl);
  const carpetArea = details[0]?.value;
  const bathroomEntry = details.find((d) => d.label?.toLowerCase().includes("bath"));
  const bathroom = bathroomEntry?.label?.replace(/baths?/i, "").trim();

  return {
    id,
    title: heading,
    priceAmount,
    priceSubLine, 
    link,
    "carpet-area": carpetArea, 
    bathroom,
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