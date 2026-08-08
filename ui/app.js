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
const resetFiltersBtn = document.getElementById("reset-filters-btn");

let allListings = [];
const activeFilters = { source: null, bhk: null, furnishing: null, tenant: null };

const SOURCE_OPTIONS = [
  { value: "magicbricks", label: "MagicBricks" },
  { value: "99acres", label: "99acres" },
  { value: "nobroker", label: "NoBroker" },
];
const BHK_OPTIONS = ["1", "2", "3", "4", "5"].map((v) => ({ label: `${v} BHK`, value: v }));
const FURNISHING_OPTIONS = ["Furnished", "Semi-Furnished", "Unfurnished"].map((v) => ({ label: v, value: v }));
const TENANT_OPTIONS = ["Bachelors", "Family", "Bachelors/Family"].map((v) => ({ label: v, value: v }));

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

function applyFilters(listings) {
  return listings.filter((listing) => {
    if (activeFilters.source && listing.source !== activeFilters.source) return false;
    if (activeFilters.bhk && getBhk(listing) !== activeFilters.bhk) return false;
    if (activeFilters.furnishing && normalizeFurnishing(listing.furnishing) !== activeFilters.furnishing) return false;
    if (activeFilters.tenant && normalizeTenant(listing["tenent-preffered"]) !== activeFilters.tenant) return false;
    return true;
  });
}

function chipButton(label, isActive, onClick) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.className = isActive
    ? "text-xs font-medium rounded-full px-3 py-1.5 bg-teal text-white transition-colors"
    : "text-xs font-medium rounded-full px-3 py-1.5 bg-surface border border-sand text-ink hover:border-teal transition-colors";
  btn.addEventListener("click", onClick);
  return btn;
}

function renderFilterGroup(container, groupKey, options) {
  container.innerHTML = "";
  options.forEach(({ label, value }) => {
    const isActive = activeFilters[groupKey] === value;
    container.appendChild(
      chipButton(label, isActive, () => {
        activeFilters[groupKey] = isActive ? null : value;
        renderAll();
      })
    );
  });
}

function renderFilters() {
  if (allListings.length === 0) {
    filtersRow.classList.add("hidden");
    return;
  }
  filtersRow.classList.remove("hidden");

  renderFilterGroup(sourceFiltersEl, "source", SOURCE_OPTIONS);
  renderFilterGroup(bhkFiltersEl, "bhk", BHK_OPTIONS);
  renderFilterGroup(furnishingFiltersEl, "furnishing", FURNISHING_OPTIONS);
  renderFilterGroup(tenantFiltersEl, "tenant", TENANT_OPTIONS);
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
  tr.className = "border-b border-sand last:border-0 odd:bg-surface even:bg-cream/40 hover:bg-teal-soft/40 transition-colors";

  tr.appendChild(titleCell(listing));
  tr.appendChild(priceCell(listing));
  tr.appendChild(furnishingStatusCell(listing));
  tr.appendChild(detailCell(listing, listing.bathroom));
  tr.appendChild(
    detailCell(listing, listing["tenent-preffered"], normalizeTenant(listing["tenent-preffered"]) || listing["tenent-preffered"])
  );
  tr.appendChild(cell(listing["carpet-area"] || listing["super-area"]));
  tr.appendChild(detailCell(listing, listing.floor));
  tr.appendChild(cell(getPropertyType(listing)));
  tr.appendChild(gatedCell(listing));
  tr.appendChild(sourceCell(listing.source));
  tr.appendChild(linkCell(listing.link));

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
  const span = document.createElement("span");
  span.className = "line-clamp-2";
  span.textContent = listing.title || "—";
  if (listing.title) span.title = listing.title;
  td.appendChild(span);
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

function gatedCell(listing) {
  const value = listing.gated;
  if (!hasValue(value)) {
    if (!listing.link) return cell(null);
    const td = document.createElement("td");
    td.className = "px-3 py-3";
    td.appendChild(makeLoadDetailsButton(listing));
    return td;
  }

  const td = document.createElement("td");
  td.className = "px-3 py-3";
  const isYes = value.toLowerCase().includes("yes");
  const badge = document.createElement("span");
  badge.textContent = value;
  if (isYes) {
    badge.className = "inline-block text-xs font-medium rounded-full px-2.5 py-1";
    badge.style.backgroundColor = "#e3efe5";
    badge.style.color = "#3f7a4f";
  } else {
    badge.className = "inline-block bg-cream text-muted text-xs font-medium rounded-full px-2.5 py-1 border border-sand";
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
  a.textContent = "View";
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
      furnishing: parsed.furnishing,
      floor: parsed.floor,
      bathroom: parsed.bathroom,
      gated: parsed.gated,
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

function makeLoadDetailsButton(listing) {
  const btn = document.createElement("button");
  btn.textContent = "Load details";
  btn.className =
    "text-teal text-xs font-medium border border-dashed border-teal/50 rounded-full px-2.5 py-1 hover:bg-teal-soft transition-colors";
  btn.addEventListener("click", async () => {
    btn.textContent = "Loading…";
    btn.disabled = true;
    try {
      const details = await fetchDetailFields(listing);
      await persistListing({
        ...listing,
        furnishing: details.furnishing || listing.furnishing || "Not found",
        floor: details.floor || listing.floor || "Not found",
        bathroom: details.bathroom || listing.bathroom || "Not found",
        gated: details.gated || listing.gated || "Not found",
        "tenent-preffered": details.tenant || listing["tenent-preffered"] || "Not found",
      });
    } catch (err) {
      btn.textContent = "Failed — retry?";
      btn.className =
        "text-amber text-xs font-medium border border-dashed border-amber/50 rounded-full px-2.5 py-1 hover:bg-amber-soft transition-colors";
      btn.disabled = false;
    }
  });
  return btn;
}

function detailCell(listing, value, displayValue) {
  if (hasValue(value)) return cell(displayValue ?? value);
  if (!listing.link) return cell(null);
  const td = document.createElement("td");
  td.className = "px-3 py-3 text-ink";
  td.appendChild(makeLoadDetailsButton(listing));
  return td;
}

function furnishingStatusCell(listing) {
  if (listing.listingType === "sale") return detailCell(listing, listing.status);
  const normalized = normalizeFurnishing(listing.furnishing);
  return detailCell(listing, listing.furnishing, normalized || listing.furnishing);
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
  renderAll();
});

loadAndRender();