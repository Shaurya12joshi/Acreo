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

function extractSecurityDepositFromCard(priceSubLine) {
  if (!priceSubLine) return null;
  const match = priceSubLine.match(/deposit\s*:?\s*(.+)$/i);
  if (!match) return null;
  const value = match[1].trim();
  return value || null;
}

function extractListingData(cardEl) {
  const id = cardEl.id;
  const heading = cardEl.querySelector(".tupleNew__propType")?.textContent.trim();
  if (!heading) return null;

  const rawLink = cardEl.querySelector("a.tupleNew__propertyHeading")?.getAttribute("href");
  const link = rawLink ? new URL(rawLink, window.location.origin).href : null;
  const priceAmount = cardEl.querySelector(".tupleNew__priceValWrap span")?.textContent.trim();
  const priceSubLine = cardEl.querySelector(".tupleNew__priceAndPerSqftWrap .tupleNew__perSqftWrap.ellipsis")?.textContent.trim();
  const securityDeposit = extractSecurityDepositFromCard(priceSubLine);

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
    securityDeposit,
    link,
    "carpet-area": carpetArea,
    bathroom,
    floor,
    furnishing,
    status,
    source: "99acres",
  };
}

function textOf(el) {
  return el?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function findValueByLabel(labelPatterns) {
  const regexList = labelPatterns.map((p) => new RegExp(`^${p}$`, "i"));
  const nodes = document.querySelectorAll("body *");
  for (const el of nodes) {
    if (el.children.length > 0) continue;
    const text = textOf(el);
    if (!text || text.length > 40) continue;
    if (!regexList.some((re) => re.test(text))) continue;

    const siblingText = textOf(el.nextElementSibling);
    if (siblingText && siblingText.length < 60 && siblingText.toLowerCase() !== text.toLowerCase()) return siblingText;

    const parentSiblingText = textOf(el.parentElement?.nextElementSibling);
    if (parentSiblingText && parentSiblingText.length < 60) return parentSiblingText;
  }
  return null;
}

function readInitialDataJSON() {
  const scriptEl = Array.from(document.scripts).find((s) => s.textContent.includes("window.__initialData__="));
  if (!scriptEl) return null;

  const text = scriptEl.textContent;
  const marker = "window.__initialData__=";
  const start = text.indexOf(marker);
  if (start === -1) return null;

  const jsonStart = start + marker.length;
  const endMarker = "window.__masked__";
  const endMarkerIdx = text.indexOf(endMarker, jsonStart);
  const jsonEnd = endMarkerIdx === -1 ? text.length : text.lastIndexOf(";", endMarkerIdx);
  const jsonStr = text.slice(jsonStart, jsonEnd === -1 ? undefined : jsonEnd).trim();

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    return null;
  }
}

function extractGatedFromInitialData() {
  const data = readInitialDataJSON();
  if (!data) return null;

  const propData = data?.pd?.pageData?.propertyDetails?.prop_data;
  const flag = propData?.Within_Gated_Community ?? data?.pd?.pageData?.specification?.withinGatedCommunity;
  if (flag === "Y") return "Yes";
  if (flag === "N") return "No";
  return null;
}

function extractDetailPageFields() {
  const floorLabel = document.querySelector("#floorNumLabel")?.textContent.replace(/\s+/g, " ").trim();

  return {
    tenant: document.querySelector("#availableForLabel")?.textContent.trim() || findValueByLabel(["Available for", "Tenant Preferred", "Tenant Type"]),
    floor: floorLabel || findValueByLabel(["Floor", "Floor No\\.?"]),
    furnishing: document.querySelector('div[data-label="FURNISHING"] h2')?.textContent.trim() || findValueByLabel(["Furnishing"]),
    bathroom: document.querySelector("#bathroomNum")?.textContent.replace(/[^0-9]/g, "").trim() || findValueByLabel(["Bathroom", "Bathrooms"]),
    securityDeposit: document.querySelector("#Deposit_Value")?.textContent.trim() || findValueByLabel(["Security Deposit"]),
    gated: extractGatedFromInitialData() || findValueByLabel(["Gated Community", "Gated"]),
  };
}

let detailPageSent = false;

function scrapeDetailPageIfApplicable() {
  if (detailPageSent) return;
  if (document.querySelector(".tupleNew__outerTupleWrap[id]")) return;
  if (!document.querySelector('div[data-label="FURNISHING"] h2, #bathroomNum, #availableForLabel, #floorNumLabel, #Deposit_Value')) return;

  const fields = extractDetailPageFields();
  const hasAny = Object.values(fields).some(Boolean);
  if (!hasAny) return;

  detailPageSent = true;
  chrome.runtime.sendMessage({
    type: "LISTING_DETAILS",
    url: window.location.href,
    fields,
  });
}

const seenCardIds = new Set();

function scrapeNewListings() {
  const cards = document.querySelectorAll(".tupleNew__outerTupleWrap[id]");
  const freshResults = [];

  cards.forEach((cardEl) => {
    if (!cardEl.id || seenCardIds.has(cardEl.id)) return;

    const data = extractListingData(cardEl);
    if (!data) return;
    seenCardIds.add(cardEl.id);
    freshResults.push(data);
  });

  if (freshResults.length > 0) {
    chrome.runtime.sendMessage({ type: "NEW_LISTINGS", listings: freshResults });
  }
}

function startObserving() {
  let scanScheduled = false;
  function scheduleScan() {
    if (scanScheduled) return;
    scanScheduled = true;
    setTimeout(() => {
      scanScheduled = false;
      scrapeNewListings();
      scrapeDetailPageIfApplicable();
    }, 150);
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });
  setInterval(scheduleScan, 1500);

  scrapeNewListings();
  scrapeDetailPageIfApplicable();
}

startObserving();

chrome.runtime.sendMessage({ type: "LISTING_VIEWED", url: window.location.href });