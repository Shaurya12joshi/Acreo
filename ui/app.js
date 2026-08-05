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
    emptyState.innerHTML = listings.length === 0
      ? `<p class="font-display text-xl text-ink mb-2">No listings yet</p>
         <p class="text-muted text-sm">Browse rental search results on MagicBricks — listings you scroll past will appear here automatically.</p>`
      : `<p class="font-display text-xl text-ink mb-2">No matches</p>
         <p class="text-muted text-sm">Nothing matches the current filters. Try resetting them.</p>`;
    return;
  }
  emptyState.classList.add("hidden");
  tableWrapper.classList.remove("hidden");

  tableBody.innerHTML = "";
  filtered.forEach((listing) => tableBody.appendChild(buildRow(listing)));
}

function renderAll() {
  renderFilters();
  render(allListings);
}

function buildRow(listing) {
  const tr = document.createElement("tr");
  tr.className = "border-b border-sand last:border-0";

  tr.appendChild(cell(listing.title, "font-medium text-ink"));
  tr.appendChild(priceCell(listing));
  tr.appendChild(furnishingStatusCell(listing));
  tr.appendChild(detailCell(listing, listing.bathroom));
  tr.appendChild(
    detailCell(listing, listing["tenent-preffered"], normalizeTenant(listing["tenent-preffered"]) || listing["tenent-preffered"])
  );
  tr.appendChild(cell(listing["carpet-area"] || listing["super-area"]));
  tr.appendChild(detailCell(listing, listing.floor));
  tr.appendChild(sourceCell(listing.source));
  tr.appendChild(linkCell(listing.link));

  return tr;
}

function cell(text, extraClass = "") {
  const td = document.createElement("td");
  td.className = `px-5 py-3 text-ink ${extraClass}`;
  td.textContent = text || "—";
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
    };
  }
  if (listing.source === "nobroker") {
    const parsed = parseNoBrokerDetail(doc);
    return { furnishing: parsed.furnishing, floor: parsed.floor, bathroom: parsed.bathroom, tenant: null };
  }
  return {
    furnishing: findValueNearLabel(doc, "Furnishing"),
    floor: findValueNearLabel(doc, "Floor"),
    tenant: findValueNearLabel(doc, "Available For") || findValueNearLabel(doc, "Tenant Preferred"),
    bathroom: null,
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
  btn.className = "text-teal text-xs font-medium hover:underline";
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
        "tenent-preffered": details.tenant || listing["tenent-preffered"] || "Not found",
      });
    } catch (err) {
      btn.textContent = "Failed — retry?";
      btn.disabled = false;
    }
  });
  return btn;
}

function detailCell(listing, value, displayValue) {
  if (hasValue(value)) return cell(displayValue ?? value);
  if (!listing.link) return cell(null);
  const td = document.createElement("td");
  td.className = "px-5 py-3 text-ink";
  td.appendChild(makeLoadDetailsButton(listing));
  return td;
}

function furnishingStatusCell(listing) {
  if (listing.listingType === "sale") return detailCell(listing, listing.status);
  const normalized = normalizeFurnishing(listing.furnishing);
  return detailCell(listing, listing.furnishing, normalized || listing.furnishing);
}

function priceCell(listing) {
  const td = document.createElement("td");
  td.className = "px-5 py-3";
  const amount = document.createElement("div");
  amount.className = "font-medium text-ink";
  amount.textContent = listing.priceAmount || "—";
  const label = document.createElement("div");
  label.className = "text-xs text-muted";
  label.textContent = listing.priceLabel || "";
  td.appendChild(amount);
  td.appendChild(label);
  return td;
}

function sourceCell(source) {
  const td = document.createElement("td");
  td.className = "px-5 py-3";
  const badge = document.createElement("span");
  badge.className = "inline-block bg-teal-soft text-teal text-xs font-medium rounded-full px-2.5 py-1";
  badge.textContent = source || "unknown";
  td.appendChild(badge);
  return td;
}

function linkCell(link) {
  const td = document.createElement("td");
  td.className = "px-5 py-3 text-right";
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