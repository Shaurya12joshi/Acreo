const tableBody = document.getElementById("listings-body");
const tableWrapper = document.getElementById("table-wrapper");
const emptyState = document.getElementById("empty-state");
const countLabel = document.getElementById("listing-count");
const clearBtn = document.getElementById("clear-btn");
const filtersRow = document.getElementById("filters");
const sourceFiltersEl = document.getElementById("source-filters");
const bhkFiltersEl = document.getElementById("bhk-filters");
const furnishingFiltersEl = document.getElementById("furnishing-filters");
const tenantFiltersEl = document.getElementById("tenant-filters");
const seenFiltersEl = document.getElementById("seen-filters");
const resetFiltersBtn = document.getElementById("reset-filters-btn");

let allListings = [];
const activeFilters = { source: null, bhk: null, furnishing: null, tenant: null, seen: null };

const SOURCE_OPTIONS = [
  { value: "magicbricks", label: "MagicBricks" },
  { value: "99acres", label: "99acres" },
  { value: "nobroker", label: "NoBroker" },
];
const BHK_OPTIONS = ["1", "2", "3", "4", "5"].map((v) => ({ label: `${v} BHK`, value: v }));
const FURNISHING_OPTIONS = ["Furnished", "Semi-Furnished", "Unfurnished"].map((v) => ({ label: v, value: v }));
const TENANT_OPTIONS = ["Bachelors", "Family", "Bachelors/Family"].map((v) => ({ label: v, value: v }));
const SEEN_OPTIONS = [
  { value: "seen", label: "Seen" },
  { value: "unseen", label: "Not Seen" },
];

function getBhk(listing) {
  const match = listing.title?.match(/(\d+)\s*BHK/i);
  return match ? match[1] : null;
}

function getPropertyType(listing) {
  const t = listing.title?.toLowerCase() || "";
  if (t.includes("villa")) return "Villa";
  if (t.includes("plot") || t.includes("land")) return "Plot/Land";
  if (t.includes("independent house") || t.includes(" house")) return "Independent House";
  if (t.includes("apartment") || t.includes("flat")) return "Apartment";
  return null;
}

function normalizeFurnishing(raw) {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v.includes("unfurnished")) return "Unfurnished";
  if (v.includes("semi")) return "Semi-Furnished";
  if (v.includes("furnished")) return "Furnished";
  return null;
}

function normalizeTenant(raw) {
  if (!raw) return null;
  const v = raw.toLowerCase();
  const hasBachelor = /bachelor/.test(v);
  const hasFamily = /family/.test(v);
  if (hasBachelor && hasFamily) return "Bachelors/Family";
  if (hasBachelor) return "Bachelors";
  if (hasFamily) return "Family";
  if (v.includes("all")) return "Bachelors/Family";
  return null;
}

function hasValue(value) {
  return Boolean(value) && value !== "Not found";
}

function getAreaText(listing) {
  return listing["carpet-area"] || listing["super-area"];
}

function parseNumeric(str) {
  if (!str) return null;
  const match = String(str).replace(/,/g, "").match(/[\d.]+/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function parsePriceValue(str) {
  if (!str) return null;
  const cleaned = String(str).replace(/,/g, "");
  const numMatch = cleaned.match(/[\d.]+/);
  if (!numMatch) return null;
  const num = parseFloat(numMatch[0]);
  if (!Number.isFinite(num) || num <= 0) return null;

  const rest = cleaned.slice(numMatch.index + numMatch[0].length).toLowerCase();
  let multiplier = 1;
  if (/^\s*(crores?|cr)\b/.test(rest)) multiplier = 1e7;
  else if (/^\s*(lakhs?|lacs?|l)\b/.test(rest)) multiplier = 1e5;
  else if (/^\s*k\b/.test(rest)) multiplier = 1e3;

  return num * multiplier;
}

function computePricePerArea(listing) {
  const price = parsePriceValue(listing.priceAmount);
  const area = parseNumeric(getAreaText(listing));
  if (price === null || area === null) return null;
  return price / area;
}

function formatPricePerArea(listing) {
  const value = computePricePerArea(listing);
  if (value === null) return null;
  const rounded = value >= 100 ? Math.round(value).toLocaleString("en-IN") : value.toFixed(2);
  return `₹${rounded}/sqft`;
}

function applyFilters(listings) {
  return listings.filter((listing) => {
    if (activeFilters.source && listing.source !== activeFilters.source) return false;
    if (activeFilters.bhk && getBhk(listing) !== activeFilters.bhk) return false;
    if (activeFilters.furnishing && normalizeFurnishing(listing.furnishing) !== activeFilters.furnishing) return false;
    if (activeFilters.tenant && normalizeTenant(listing["tenent-preffered"]) !== activeFilters.tenant) return false;
    if (activeFilters.seen === "seen" && !listing.seen) return false;
    if (activeFilters.seen === "unseen" && listing.seen) return false;
    return true;
  });
}

function chipButton(label, isActive, onClick, isDisabled = false) {
  const btn = document.createElement("button");
  btn.textContent = label;
  if (isDisabled) {
    btn.disabled = true;
    btn.className =
      "text-xs font-medium rounded-full px-3 py-1.5 bg-surface border border-sand text-muted opacity-40 cursor-not-allowed";
  } else {
    btn.className = isActive
      ? "text-xs font-medium rounded-full px-3 py-1.5 bg-teal text-white transition-colors"
      : "text-xs font-medium rounded-full px-3 py-1.5 bg-surface border border-sand text-ink hover:border-teal transition-colors";
    btn.addEventListener("click", onClick);
  }
  return btn;
}

function renderFilterGroup(container, groupKey, options, isDisabledFn) {
  container.innerHTML = "";
  options.forEach(({ label, value }) => {
    const isActive = activeFilters[groupKey] === value;
    const isDisabled = !isActive && Boolean(isDisabledFn && isDisabledFn(value));
    container.appendChild(
      chipButton(
        label,
        isActive,
        () => {
          activeFilters[groupKey] = isActive ? null : value;
          renderAll();
        },
        isDisabled
      )
    );
  });
}

const FILTER_VALUE_GETTERS = {
  source: (listing) => listing.source,
  bhk: (listing) => getBhk(listing),
  furnishing: (listing) => normalizeFurnishing(listing.furnishing),
  tenant: (listing) => normalizeTenant(listing["tenent-preffered"]),
  seen: (listing) => (listing.seen ? "seen" : "unseen"),
};

function getCountsForGroup(groupKey) {
  const counts = {};
  allListings.forEach((listing) => {
    for (const [otherKey, getValue] of Object.entries(FILTER_VALUE_GETTERS)) {
      if (otherKey === groupKey) continue;
      if (activeFilters[otherKey] && getValue(listing) !== activeFilters[otherKey]) return;
    }
    const value = FILTER_VALUE_GETTERS[groupKey](listing);
    if (value != null) counts[value] = (counts[value] || 0) + 1;
  });
  return counts;
}

function renderFilters() {
  if (allListings.length === 0) {
    filtersRow.classList.add("hidden");
    return;
  }
  filtersRow.classList.remove("hidden");

  const sourceCounts = getCountsForGroup("source");
  const bhkCounts = getCountsForGroup("bhk");
  const furnishingCounts = getCountsForGroup("furnishing");
  const tenantCounts = getCountsForGroup("tenant");
  const seenCounts = getCountsForGroup("seen");

  renderFilterGroup(sourceFiltersEl, "source", SOURCE_OPTIONS, (value) => (sourceCounts[value] || 0) === 0);
  renderFilterGroup(bhkFiltersEl, "bhk", BHK_OPTIONS, (value) => (bhkCounts[value] || 0) === 0);
  renderFilterGroup(furnishingFiltersEl, "furnishing", FURNISHING_OPTIONS, (value) => (furnishingCounts[value] || 0) === 0);
  renderFilterGroup(tenantFiltersEl, "tenant", TENANT_OPTIONS, (value) => (tenantCounts[value] || 0) === 0);
  renderFilterGroup(seenFiltersEl, "seen", SEEN_OPTIONS, (value) => (seenCounts[value] || 0) === 0);
}

function render(listings) {
  const filtered = applyFilters(listings);
  countLabel.textContent = `${filtered.length} of ${listings.length} listings`;

  if (filtered.length === 0) {
    tableWrapper.classList.add("hidden");
    emptyState.classList.remove("hidden");
    emptyState.innerHTML =
      listings.length === 0
        ? `<p class="font-display text-xl text-ink mb-2">No listings yet</p>
         <p class="text-muted text-sm">Browse rental search results on MagicBricks, 99acres, or NoBroker listings you scroll past will appear here automatically.</p>`
        : `<p class="font-display text-xl text-ink mb-2">No matches</p>
         <p class="text-muted text-sm">Nothing matches the current filters. Try resetting them.</p>`;
    return;
  }
  emptyState.classList.add("hidden");
  tableWrapper.classList.remove("hidden");

  tableBody.innerHTML = "";
  filtered.forEach((listing, index) => tableBody.appendChild(buildRow(listing, index)));
}

function renderAll() {
  renderFilters();
  render(allListings);
}

function buildRow(listing, index) {
  const tr = document.createElement("tr");
  tr.className = `border-b border-sand last:border-0 hover:bg-teal-soft/40 transition-colors ${
    listing.seen ? "opacity-70 bg-cream/60" : "odd:bg-surface even:bg-cream/40"
  }`;

  tr.appendChild(titleCell(listing));
  tr.appendChild(priceCell(listing));
  tr.appendChild(cell(getAreaText(listing)));
  tr.appendChild(cell(formatPricePerArea(listing)));
  tr.appendChild(cell(getPropertyType(listing)));
  tr.appendChild(sourceCell(listing.source));
  tr.appendChild(linkCell(listing.link));
  tr.appendChild(viewMoreDetailsCell(listing));

  return tr;
}

function cell(text, extraClass = "") {
  const td = document.createElement("td");
  td.className = `px-3 py-3 text-ink ${extraClass}`;
  td.textContent = text || "—";
  return td;
}

function titleCell(listing) {
  const td = document.createElement("td");
  td.className = "px-3 py-3 font-medium text-ink";

  const wrap = document.createElement("div");
  wrap.className = "flex items-start gap-2";

  const span = document.createElement("span");
  span.className = "line-clamp-2";
  span.textContent = listing.title || "—";
  if (listing.title) span.title = listing.title;
  wrap.appendChild(span);

  if (listing.seen) {
    const badge = document.createElement("span");
    badge.className =
      "shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted bg-sand rounded-full px-2 py-0.5 mt-0.5";
    badge.textContent = "Seen";
    wrap.appendChild(badge);
  }

  td.appendChild(wrap);
  return td;
}

function priceCell(listing) {
  const td = document.createElement("td");
  td.className = "px-3 py-3";

  const topRow = document.createElement("div");
  topRow.className = "flex items-center gap-2";

  const amount = document.createElement("span");
  amount.className = "font-semibold text-ink";
  amount.textContent = listing.priceAmount || "—";
  topRow.appendChild(amount);

  if (listing.listingType === "rent" || listing.listingType === "sale") {
    const tag = document.createElement("span");
    const isRent = listing.listingType === "rent";
    tag.className = isRent
      ? "text-[10px] font-semibold uppercase tracking-wide text-teal bg-teal-soft rounded-full px-2 py-0.5"
      : "text-[10px] font-semibold uppercase tracking-wide text-amber bg-amber-soft rounded-full px-2 py-0.5";
    tag.textContent = isRent ? "Rent" : "Sale";
    topRow.appendChild(tag);
  }

  const label = document.createElement("div");
  label.className = "text-xs text-muted mt-0.5";
  label.textContent = listing.priceLabel || "";

  td.appendChild(topRow);
  td.appendChild(label);
  return td;
}

function sourceCell(source) {
  const td = document.createElement("td");
  td.className = "px-3 py-3";
  const badge = document.createElement("span");
  badge.className = "inline-block text-xs font-medium rounded-full px-2.5 py-1";
  badge.textContent = source || "unknown";
  if (source === "magicbricks") {
    badge.className += " bg-teal-soft text-teal";
  } else if (source === "99acres") {
    badge.className += " bg-teal-soft text-teal";
  } else if (source === "nobroker") {
    badge.className += " bg-teal-soft text-teal";
  } else {
    badge.className += " bg-sand text-muted";
  }
  td.appendChild(badge);
  return td;
}

function linkCell(link) {
  const td = document.createElement("td");
  td.className = "px-3 py-3 text-right";
  if (!link) return td;
  const a = document.createElement("a");
  a.href = link;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.className = "text-amber text-xs font-medium hover:underline";
  a.textContent = "Open Link";
  a.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "LISTING_VIEWED", url: link });
  });
  td.appendChild(a);
  return td;
}

function findValueNearLabel(doc, labelText) {
  const candidates = Array.from(doc.querySelectorAll("body *")).filter(
    (el) => el.children.length === 0 && el.textContent.trim() === labelText
  );
  for (const labelEl of candidates) {
    const siblingText = labelEl.nextElementSibling?.textContent.trim();
    if (siblingText && siblingText.length < 40) return siblingText;
    const parentSiblingText = labelEl.parentElement?.nextElementSibling?.textContent.trim();
    if (parentSiblingText && parentSiblingText.length < 40) return parentSiblingText;
  }
  return null;
}

function parseNoBrokerDetail(doc) {
  const boxes = doc.querySelectorAll(".nb__3ocPe");
  const fields = {};
  boxes.forEach((box) => {
    const label = box.querySelector("#overviewTitle")?.textContent.trim();
    const value = box.querySelector(".font-semi-bold")?.textContent.trim();
    if (label && value) fields[label] = value;
  });
  return {
    furnishing: fields["Furnishing Status"],
    floor: fields["No. of Floors"],
    bathroom: fields["Bathroom"],
    gated: fields["Gated Security"],
  };
}

function parse99acresDetail(doc) {
  return {
    furnishing: doc.querySelector("#furnishingLabel")?.textContent.trim(),
    floor: doc.querySelector("#floorNumLabel")?.textContent.trim(),
    tenant: doc.querySelector("#availableForLabel")?.textContent.trim(),
  };
}

async function fetchDetailFields(listing) {
  const response = await fetch(listing.link);
  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  if (listing.source === "99acres") {
    const parsed = parse99acresDetail(doc);
    return {
      furnishing: parsed.furnishing || findValueNearLabel(doc, "Furnishing"),
      floor: parsed.floor || findValueNearLabel(doc, "Floor"),
      tenant: parsed.tenant || findValueNearLabel(doc, "Available For"),
      bathroom: null,
      gated: findValueNearLabel(doc, "Gated"),
    };
  }
  if (listing.source === "nobroker") {
    const parsed = parseNoBrokerDetail(doc);
    return {
      furnishing: parsed.furnishing || findValueNearLabel(doc, "Furnishing Status") || findValueNearLabel(doc, "Furnishing"),
      floor: parsed.floor || findValueNearLabel(doc, "No. of Floors") || findValueNearLabel(doc, "Floor"),
      bathroom: parsed.bathroom || findValueNearLabel(doc, "Bathroom"),
      gated:
        parsed.gated ||
        findValueNearLabel(doc, "Gated Security") ||
        findValueNearLabel(doc, "Gated Community") ||
        findValueNearLabel(doc, "Gated"),
      tenant: null,
    };
  }
  return {
    furnishing: findValueNearLabel(doc, "Furnishing"),
    floor: findValueNearLabel(doc, "Floor"),
    tenant: findValueNearLabel(doc, "Available For") || findValueNearLabel(doc, "Tenant Preferred"),
    bathroom: null,
    gated: findValueNearLabel(doc, "Gated"),
  };
}

async function persistListing(updated) {
  const idx = allListings.findIndex((l) => l.id === updated.id && l.source === updated.source);
  if (idx !== -1) allListings[idx] = { ...allListings[idx], ...updated };
  await chrome.storage.local.set({ listings: allListings });
}

const DETAIL_FIELDS = [
  { key: "furnishing", label: "Furnishing", getValue: (l) => normalizeFurnishing(l.furnishing) || l.furnishing },
  { key: "bathroom", label: "Bathroom", getValue: (l) => l.bathroom },
  {
    key: "tenent-preffered",
    label: "Tenant",
    getValue: (l) => normalizeTenant(l["tenent-preffered"]) || l["tenent-preffered"],
  },
  { key: "floor", label: "Floor", getValue: (l) => l.floor },
  {
    key: "gated",
    label: "Gated Community",
    getValue: (l) => l.gated,
    hint: "Whether the property is inside a gated complex — a compound with a boundary wall and controlled/security entry — rather than a standalone building open to the street.",
  },
];

function detailsAlreadyLoaded(listing) {
  return DETAIL_FIELDS.some(({ key }) => hasValue(listing[key]));
}

function detailsModal() {
  return {
    root: document.getElementById("details-modal"),
    backdrop: document.getElementById("details-modal-backdrop"),
    closeBtn: document.getElementById("details-modal-close"),
    title: document.getElementById("details-modal-title"),
    body: document.getElementById("details-modal-body"),
  };
}

function closeDetailsModal() {
  const { root } = detailsModal();
  root.classList.add("hidden");
  root.style.display = "none";
}

function detailRow(label, value, hint) {
  const tr = document.createElement("tr");
  tr.className = "border-b border-sand last:border-0";

  const th = document.createElement("th");
  th.scope = "row";
  th.className = "text-left text-xs font-semibold uppercase tracking-wide text-muted px-3 py-3 w-1/3 align-top";

  const labelWrap = document.createElement("span");
  labelWrap.className = "inline-flex items-center gap-1";

  const labelText = document.createElement("span");
  labelText.textContent = label;
  labelWrap.appendChild(labelText);

  if (hint) {
    const info = document.createElement("span");
    info.textContent = "ⓘ";
    info.title = hint;
    info.setAttribute("role", "img");
    info.setAttribute("aria-label", hint);
    info.className = "normal-case font-normal text-muted cursor-help";
    labelWrap.appendChild(info);
  }

  th.appendChild(labelWrap);

  const td = document.createElement("td");
  td.className = "text-sm text-ink px-3 py-3";
  td.textContent = hasValue(value) ? value : "—";

  tr.appendChild(th);
  tr.appendChild(td);
  return tr;
}
function showDetailsModal() {
  const { root } = detailsModal();
  root.classList.remove("hidden");
  root.style.display = "flex";
}

function openDetailsModal(listing) {
  const { title, body } = detailsModal();
  title.textContent = listing.title || "Listing details";
  body.innerHTML = "";
  DETAIL_FIELDS.forEach(({ label, getValue, hint }) => {
    body.appendChild(detailRow(label, getValue(listing), hint));
  });
  showDetailsModal();
}

function showDetailsLoadingState(message) {
  const { title, body } = detailsModal();
  title.textContent = "Listing details";
  body.innerHTML = "";
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 2;
  td.className = "text-sm text-muted px-3 py-6 text-center";
  td.textContent = message;
  tr.appendChild(td);
  body.appendChild(tr);
  showDetailsModal();
}

function makeViewMoreDetailsButton(listing) {
  const btn = document.createElement("button");
  btn.textContent = "View More Details";
  btn.className =
    "text-teal text-xs font-medium border border-dashed border-teal/50 rounded-full px-2.5 py-1 hover:bg-teal-soft transition-colors whitespace-nowrap cursor-pointer";
  btn.style.cursor = "pointer";
  btn.addEventListener("click", async () => {
    if (detailsAlreadyLoaded(listing) || !listing.link) {
      openDetailsModal(listing);
      return;
    }

    btn.textContent = "Loading…";
    btn.disabled = true;
    showDetailsLoadingState("Loading details…");
    try {
      const details = await fetchDetailFields(listing);
      const updated = {
        ...listing,
        furnishing: details.furnishing || listing.furnishing || "Not found",
        floor: details.floor || listing.floor || "Not found",
        bathroom: details.bathroom || listing.bathroom || "Not found",
        gated: details.gated || listing.gated || "Not found",
        "tenent-preffered": details.tenant || listing["tenent-preffered"] || "Not found",
      };
      await persistListing(updated);
      openDetailsModal(updated);
    } catch (err) {
      showDetailsLoadingState("Couldn't load details — try again.");
    } finally {
      btn.textContent = "View More Details";
      btn.disabled = false;
    }
  });
  return btn;
}

function viewMoreDetailsCell(listing) {
  const td = document.createElement("td");
  td.className = "px-3 py-3 text-right";
  td.appendChild(makeViewMoreDetailsButton(listing));
  return td;
}

async function loadAndRender() {
  const { listings = [] } = await chrome.storage.local.get("listings");
  allListings = listings;
  renderAll();
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.listings) {
    allListings = changes.listings.newValue || [];
    renderAll();
  }
});

clearBtn.addEventListener("click", async () => {
  await chrome.storage.local.set({ listings: [] });
});

resetFiltersBtn.addEventListener("click", () => {
  activeFilters.source = null;
  activeFilters.bhk = null;
  activeFilters.furnishing = null;
  activeFilters.tenant = null;
  activeFilters.seen = null;
  renderAll();
});

const { backdrop: detailsModalBackdrop, closeBtn: detailsModalCloseBtn } = detailsModal();
detailsModalBackdrop.addEventListener("click", closeDetailsModal);
detailsModalCloseBtn.addEventListener("click", closeDetailsModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDetailsModal();
});

loadAndRender();