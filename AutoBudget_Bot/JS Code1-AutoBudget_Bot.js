const text = $node["Telegram Trigger"].json["message"]["text"];

// Function to get current Bangladesh date and time
function getBangladeshDateTime() {
  const now = new Date();
  // Convert to Bangladesh timezone (UTC+6)
  const bdTime = new Date(now.getTime() + (6 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
  
  // Format date as DD/MM/YYYY for Bangladesh
  const day = bdTime.getDate().toString().padStart(2, '0');
  const month = (bdTime.getMonth() + 1).toString().padStart(2, '0');
  const year = bdTime.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;
  
  // Format month as "Month Year"
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const formattedMonth = `${monthNames[bdTime.getMonth()]} ${year}`;
  
  return {
    date: formattedDate,
    month: formattedMonth
  };
}

// Check if text exists and is not empty
if (!text || typeof text !== 'string' || text.trim() === '') {
  const dateTime = getBangladeshDateTime();
  return [{
    json: {
      description: "Invalid input",
      amount: 0,
      quantity: "Not specified",
      date: dateTime.date,
      month: dateTime.month,
      error: "No text received or empty message"
    }
  }];
}

// Bengali quantity words and numbers
const bengaliQuantities = [
  'আধা', 'পৌনে', 'সোয়া', 'দেড়', 'আড়াই', 'সাড়ে', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ',
  'কেজি', 'গ্রাম', 'লিটার', 'পিস', 'টি', 'টা', 'খানা', 'প্যাকেট', 'বোতল', 'কাপ', 'চামচ'
];

const bengaliNumbers = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

// Function to convert Bengali numbers to English
function convertBengaliNumbers(text) {
  return text.replace(/[০-৯]/g, (match) => bengaliNumbers[match] || match);
}

// Function to extract Bengali quantities from text
function extractBengaliQuantity(text) {
  const quantityPattern = new RegExp(`(${bengaliQuantities.join('|')})`, 'gi');
  const matches = text.match(quantityPattern);
  if (matches) {
    return matches.join(' ');
  }
  return null;
}

// Function to remove quantity words from text
function removeQuantityWords(text) {
  const quantityPattern = new RegExp(`\\b(${bengaliQuantities.join('|')})\\b`, 'gi');
  return text.replace(quantityPattern, '').replace(/\s+/g, ' ').trim();
}

const cleanText = convertBengaliNumbers(text.trim());
// Split by comma, newline, or semicolon
const entries = cleanText.split(/[,\n;]+/);
const results = [];

// Get Bangladesh date and time once for all entries
const dateTime = getBangladeshDateTime();

for (let entry of entries) {
  entry = entry.trim();
  
  // Skip empty entries
  if (!entry) continue;
  
  // Convert Bengali numbers in this entry
  entry = convertBengaliNumbers(entry);
  
  // Enhanced regex patterns including Bengali support
  const patterns = [
    // Pattern 1: Bengali structure - Quantity + Description + Amount + Currency
    /^(.+?)\s+(.+?)\s+(\d+(?:\.\d+)?)\s*(?:tk|৳|taka|টাকা)\s*$/i,
    
    // Pattern 2: Description + Amount + Currency + Quantity (English style)
    /^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:tk|৳|taka|টাকা)\s+(.+)$/i,
    
    // Pattern 3: Description + Amount + Currency (no quantity)
    /^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:tk|৳|taka|টাকা)\s*$/i,
    
    // Pattern 4: Amount + Currency + Description
    /^(\d+(?:\.\d+)?)\s*(?:tk|৳|taka|টাকা)\s+(.+)$/i,
    
    // Pattern 5: Just Amount + Currency
    /^(\d+(?:\.\d+)?)\s*(?:tk|৳|taka|টাকা)\s*$/i,
    
    // Pattern 6: Description + Amount + Quantity (no currency)
    /^(.+?)\s+(\d+(?:\.\d+)?)\s+(.+)$/i,
    
    // Pattern 7: Description + Amount (no currency, no quantity)
    /^(.+?)\s+(\d+(?:\.\d+)?)$/i
  ];
  
  let matched = false;
  
  for (let i = 0; i < patterns.length; i++) {
    const match = entry.match(patterns[i]);
    
    if (match) {
      matched = true;
      let description, amount, quantity;
      
      switch (i) {
        case 0: // Bengali: Quantity + Description + Amount + Currency
          const potentialQuantity = match[1].trim();
          const potentialDescription = match[2].trim();
          amount = parseFloat(match[3]);
          
          // Check if first part contains quantity words
          const extractedQty = extractBengaliQuantity(potentialQuantity);
          if (extractedQty) {
            quantity = potentialQuantity;
            description = potentialDescription;
          } else {
            // If no quantity words found, treat as description + description
            description = `${potentialQuantity} ${potentialDescription}`.trim();
            quantity = "Not specified";
          }
          break;
          
        case 1: // Description + Amount + Currency + Quantity
          description = match[1].trim();
          amount = parseFloat(match[2]);
          quantity = match[3].trim();
          break;
          
        case 2: // Description + Amount + Currency
          description = match[1].trim();
          amount = parseFloat(match[2]);
          quantity = extractBengaliQuantity(description) || "Not specified";
          // Remove quantity words from description if found
          if (quantity !== "Not specified") {
            description = removeQuantityWords(description);
          }
          break;
          
        case 3: // Amount + Currency + Description
          amount = parseFloat(match[1]);
          const fullDesc = match[2].trim();
          quantity = extractBengaliQuantity(fullDesc) || "Not specified";
          description = removeQuantityWords(fullDesc);
          break;
          
        case 4: // Just Amount + Currency
          amount = parseFloat(match[1]);
          description = "No Description";
          quantity = "Not specified";
          break;
          
        case 5: // Description + Amount + Quantity
          description = match[1].trim();
          amount = parseFloat(match[2]);
          quantity = match[3].trim();
          break;
          
        case 6: // Description + Amount
          const fullText = match[1].trim();
          amount = parseFloat(match[2]);
          quantity = extractBengaliQuantity(fullText) || "Not specified";
          description = removeQuantityWords(fullText);
          break;
      }
      
      // Validate and clean data
      if (isNaN(amount) || amount <= 0) {
        amount = 0;
      }
      
      if (!description || description === '') {
        description = "No Description";
      }
      
      if (!quantity || quantity === '') {
        quantity = "Not specified";
      }
      
      // Clean up description - remove extra spaces and common prefixes (both English and Bengali)
      description = description
        .replace(/^(bought|purchase|buy|paid|কিনেছি|কিনলাম|নিয়েছি)\s+/i, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Clean up quantity
      quantity = quantity.replace(/\s+/g, ' ').trim();
      
      results.push({
        json: {
          description: description,
          amount: amount,
          quantity: quantity,
          date: dateTime.date,
          month: dateTime.month,
          original_text: entry,
          language: /[\u0980-\u09FF]/.test(entry) ? 'Bengali' : 'English'
        }
      });
      break;
    }
  }
  
  // Enhanced fallback logic for unmatched entries
  if (!matched) {
    const amountMatch = entry.match(/(\d+(?:\.\d+)?)/);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1]);
      let remainingText = entry
        .replace(/\d+(?:\.\d+)?/g, '')
        .replace(/tk|৳|taka|টাকা/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const quantity = extractBengaliQuantity(remainingText) || "Not specified";
      const description = removeQuantityWords(remainingText) || "No Description";
      
      results.push({
        json: {
          description: description,
          amount: amount,
          quantity: quantity,
          date: dateTime.date,
          month: dateTime.month,
          original_text: entry,
          warning: "Partial match - please verify",
          language: /[\u0980-\u09FF]/.test(entry) ? 'Bengali' : 'English'
        }
      });
    } else {
      // No amount found, treat as description only
      const quantity = extractBengaliQuantity(entry) || "Not specified";
      const description = removeQuantityWords(entry);
      
      results.push({
        json: {
          description: description,
          amount: 0,
          quantity: quantity,
          date: dateTime.date,
          month: dateTime.month,
          original_text: entry,
          warning: "No amount detected",
          language: /[\u0980-\u09FF]/.test(entry) ? 'Bengali' : 'English'
        }
      });
    }
  }
}

// If no valid entries found, return an error entry
if (results.length === 0) {
  return [{
    json: {
      description: "Parse Error",
      amount: 0,
      quantity: "Not specified",
      date: dateTime.date,
      month: dateTime.month,
      error: "Could not parse any entries from input",
      original_text: cleanText
    }
  }];
}

return results;
