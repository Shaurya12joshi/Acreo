const tableBody = document.getElementById("listings-body");
const tableWrapper = document.getElementById("table-wrapper");
const emptyState = document.getElementById("empty-state");
const countLabel = document.getElementById("listing-count");
const clearBtn = document.getElementById("clear-btn");
const filtersRow = document.getElementById("filters");
const bhkFiltersEl = document.getElementById("bhk-filters");
const furnishingFiltersEl = document.getElementById("furnishing-filters");
const tenantFiltersEl = document.getElementById("tenant-filters");
const resetFiltersBtn = document.getElementById("reset-filters-btn");

let allListings = [];
const activeFilters = { bhk: null, furnishing: null, tenant: null };

function getBhk(listing) {
  const match = listing.title?.match(/(\d+)\s*BHK/i);
  return match ? match[1] : null;
}

function uniqueValues(listings, getter) {
  const values = new Set(listings.map(getter).filter(Boolean));
  return Array.from(values).sort();
}

function applyFilters(listings) {
  return listings.filter((listing) => {
    if (activeFilters.bhk && getBhk(listing) !== activeFilters.bhk) return false;
    if (activeFilters.furnishing && listing.furnishing !== activeFilters.furnishing) return false;
    if (activeFilters.tenant && listing["tenent-preffered"] !== activeFilters.tenant) return false;
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

  const bhkValues = uniqueValues(allListings, getBhk).sort((a, b) => a - b);
  renderFilterGroup(bhkFiltersEl, "bhk", bhkValues.map((v) => ({ label: `${v} BHK`, value: v })));

  const furnishingValues = uniqueValues(allListings, (l) => l.furnishing);
  renderFilterGroup(furnishingFiltersEl, "furnishing", furnishingValues.map((v) => ({ label: v, value: v })));

  const tenantValues = uniqueValues(allListings, (l) => l["tenent-preffered"]);
  renderFilterGroup(tenantFiltersEl, "tenant", tenantValues.map((v) => ({ label: v, value: v })));
}

function render(listings) {
  const filtered = applyFilters(listings);
  countLabel.textContent = `${filtered.length} of ${listings.length} listings`;

  if (filtered.length === 0) {
    tableWrapper.classList.add("hidden");
    emptyState.classList.remove("hidden");
    emptyState.innerHTML = listings.length === 0
      ? `<p class="font-display text-xl text-ink mb-2">No listings yet</p>
         <p class="text-muted text-sm">Browse rental search results on MagicBricks listings you scroll past will appear here automatically.</p>`
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
  tr.appendChild(cell(listing.furnishing));
  tr.appendChild(cell(listing.bathroom));
  tr.appendChild(cell(listing["tenent-preffered"]));
  tr.appendChild(cell(listing["carpet-area"]));
  tr.appendChild(cell(listing.floor));
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
  activeFilters.bhk = null;
  activeFilters.furnishing = null;
  activeFilters.tenant = null;
  renderAll();
});

loadAndRender();
