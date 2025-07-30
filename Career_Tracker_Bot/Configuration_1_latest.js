// Get the message text from Telegram trigger
const messageText = $input.first().json.message.text;

// Initialize variables
let jobLink = '';
let companyName = '';
let engagementWay = '';

// Split into lines and clean
const lines = messageText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

// STRICT 3-INPUT VALIDATION
if (lines.length !== 3) {
  let errorMessage = `❌ Must provide exactly 3 inputs!\n\n`;
  errorMessage += `You provided: ${lines.length} input(s)\n`;
  errorMessage += `Required: 3 inputs\n\n`;
  errorMessage += `📝 Accepted formats:\n\n`;
  errorMessage += `**Format 1 (Structured):**\n`;
  errorMessage += `Link: https://company.com/jobs/123\n`;
  errorMessage += `Company: Google\n`;
  errorMessage += `Engagement: LinkedIn\n\n`;
  errorMessage += `**Format 2 (Simple 3 lines):**\n`;
  errorMessage += `https://company.com/jobs/123\n`;
  errorMessage += `Google\n`;
  errorMessage += `LinkedIn\n\n`;
  errorMessage += `**Note:** Any order combination works!`;
  
  return [{
    json: {
      error: true,
      message: errorMessage,
      chat_id: $input.first().json.message.chat.id
    }
  }];
}

// METHOD 1: Try structured format first (Link:, Company:, Engagement:)
for (const line of lines) {
  // Extract Link - Multiple format support
  if (line.toLowerCase().match(/^(link|url|job|position|apply):/i)) {
    jobLink = line.split(':').slice(1).join(':').trim();
  }
  
  // Extract Company - Multiple format support
  if (line.toLowerCase().match(/^(company|employer|organization|firm|corp):/i)) {
    companyName = line.split(':').slice(1).join(':').trim();
  }
  
  // Extract Engagement - Multiple format support
  if (line.toLowerCase().match(/^(engagement|source|method|via|through|found|applied):/i)) {
    engagementWay = line.split(':').slice(1).join(':').trim();
  }
}

// METHOD 2: If structured format didn't work, try 3-line simple format
if (!jobLink || !companyName || !engagementWay) {
  // Reset variables for 3-line detection
  jobLink = '';
  companyName = '';
  engagementWay = '';
  
  // Arrays to track what we've found
  let foundUrl = false;
  let foundEngagement = false;
  
  // Known engagement keywords
  const engagementKeywords = [
    'linkedin', 'indeed', 'glassdoor', 'direct', 'referral', 'website', 
    'email', 'recruiter', 'facebook', 'twitter', 'instagram', 'whatsapp',
    'friend', 'family', 'colleague', 'manager', 'boss', 'network',
    'cold', 'application', 'portal', 'career', 'site'
  ];
  
  for (const line of lines) {
    // Detect URL
    if (line.match(/^https?:\/\/.+/i) && !foundUrl) {
      jobLink = line;
      foundUrl = true;
    }
    // Detect Engagement (check against known keywords)
    else if (!foundEngagement) {
      const lowerLine = line.toLowerCase();
      let isEngagement = false;
      
      for (const keyword of engagementKeywords) {
        if (lowerLine.includes(keyword)) {
          engagementWay = line;
          foundEngagement = true;
          isEngagement = true;
          break;
        }
      }
      
      // If not URL and not engagement keyword, assume it's company
      if (!isEngagement && !foundUrl) {
        // But first check if this might be a URL without protocol
        if (line.includes('.com') || line.includes('.org') || line.includes('.net')) {
          jobLink = 'https://' + line;
          foundUrl = true;
        } else {
          companyName = line;
        }
      } else if (!isEngagement && foundUrl && !companyName) {
        companyName = line;
      }
    }
    // Remaining line becomes company if not set
    else if (!companyName) {
      companyName = line;
    }
  }
  
  // Handle remaining unassigned lines
  for (const line of lines) {
    if (line !== jobLink && line !== engagementWay && !companyName) {
      companyName = line;
      break;
    }
  }
}

// Clean up extracted data
if (jobLink) jobLink = jobLink.replace(/[<>]/g, '').trim();
if (companyName) companyName = companyName.replace(/[<>]/g, '').trim();
if (engagementWay) engagementWay = engagementWay.replace(/[<>]/g, '').trim();

// Final validation - all 3 must be present
const missingFields = [];
if (!jobLink) missingFields.push('Link/URL');
if (!companyName) missingFields.push('Company');
if (!engagementWay) missingFields.push('Engagement/Source');

if (missingFields.length > 0) {
  let errorMessage = `❌ Could not identify: ${missingFields.join(', ')}\n\n`;
  errorMessage += `📝 Your 3 inputs:\n`;
  lines.forEach((line, index) => {
    errorMessage += `${index + 1}. ${line}\n`;
  });
  errorMessage += `\n🔍 Detected:\n`;
  if (jobLink) errorMessage += `✅ URL: ${jobLink}\n`;
  if (companyName) errorMessage += `✅ Company: ${companyName}\n`;
  if (engagementWay) errorMessage += `✅ Engagement: ${engagementWay}\n`;
  
  errorMessage += `\n💡 Tips:\n`;
  errorMessage += `• URL must start with http:// or https://\n`;
  errorMessage += `• Use clear engagement terms: LinkedIn, Indeed, Direct, Referral, etc.\n`;
  errorMessage += `• Company name should be recognizable\n\n`;
  errorMessage += `**Example formats:**\n`;
  errorMessage += `Link: https://google.com/jobs\nCompany: Google\nEngagement: LinkedIn\n\n`;
  errorMessage += `OR simple 3 lines:\nhttps://google.com/jobs\nGoogle\nLinkedIn`;
  
  return [{
    json: {
      error: true,
      message: errorMessage,
      chat_id: $input.first().json.message.chat.id
    }
  }];
}

// Validate URL format
const urlRegex = /^https?:\/\/.+/i;
if (!urlRegex.test(jobLink)) {
  return [{
    json: {
      error: true,
      message: `❌ Invalid URL format: ${jobLink}\n\nPlease include http:// or https://`,
      chat_id: $input.first().json.message.chat.id
    }
  }];
}

// Create timestamp in Bangladesh timezone
const currentDate = new Date();
const formattedDate = currentDate.toLocaleDateString('en-US', {
  timeZone: 'Asia/Dhaka'
}); // MM/DD/YYYY format
const formattedTime = currentDate.toLocaleTimeString('en-US', { 
  hour: '2-digit', 
  minute: '2-digit',
  timeZone: 'Asia/Dhaka'
});

// Prepare data for Google Sheets
return [{
  json: {
    // Parsed data
    date: formattedDate,
    time: formattedTime,
    jobLink: jobLink,
    companyName: companyName,
    engagementWay: engagementWay,
    applicationStatus: "Applied", // Default status
    
    // Original message data for confirmation
    originalMessage: messageText,
    chat_id: $input.first().json.message.chat.id,
    user_name: $input.first().json.message.from.first_name || 'User',
    
    // Success indicator
    error: false
  }
}];
