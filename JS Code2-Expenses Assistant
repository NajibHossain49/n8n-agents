let total = 0;
let debug = [];

// Safety check
if (!items || items.length === 0) {
  return [
    {
      json: {
        total: 0,
        month: new Date().toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        debug: [],
        error: "No items found",
      },
    },
  ];
}

for (let i = 0; i < items.length; i++) {
  const row = items[i].json;
  debug.push(row);

  const amountStr = row["Amount"];
  const amount = parseFloat(amountStr);

  if (!isNaN(amount)) {
    total += amount;
  }
}

return [
  {
    json: {
      total: Math.round(total * 100) / 100, // Rounds to 2 decimals
      month: $node["Code"].json["month"],
      debug,
      itemCount: items.length, // Added for verification
      validItems: debug.filter((item) => !isNaN(parseFloat(item.Amount)))
        .length, // Count of valid amounts
    },
  },
];
// This code calculates the total expenses from a list of items, ensuring that it handles cases where no items are present and provides debugging information.
