export const VALID_DOMAIN = "@gordoncollege.edu.ph";

// Sidebar + filter bar categories. `short` is the label used on the filter chips.
export const CATEGORIES = [
  { name: "Clothing & Personal Gear", short: "Clothing", icon: "checkroom" },
  { name: "Documents & Cards", short: "Documents", icon: "style" },
  { name: "Electronics & Gadgets", short: "Electronics", icon: "devices" },
  { name: "Keys & Accessories", short: "Keys", icon: "vpn_key" },
  { name: "Stationery & Books", short: "Stationery", icon: "menu_book" },
  { name: "Wallets & Bags", short: "Wallets & Bags", icon: "account_balance_wallet" },
  { name: "Others", short: "Others", icon: "more_horiz" },
];

// Categories offered by the posting page's autocomplete ("Others" is free text).
export const POSTABLE_CATEGORIES = CATEGORIES.filter((c) => c.name !== "Others").map((c) => c.name);

export const ROOMS = Array.from({ length: 31 }, (_, i) => `RM${100 + i}`);

export const STATUS_COLORS = {
  unclaimed: "#3f51b5",
  claimed: "#0ea5e9",
  pending: "#f59e0b",
  synced: "#22c55e",
  searching: "#6b7280",
};

