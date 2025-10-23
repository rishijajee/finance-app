# Market Hours Feature

## Overview

The app now includes intelligent market hours detection that automatically informs users about data freshness based on US stock market hours.

---

## How It Works

### Market Hours Detection

The app checks the current time in **Eastern Time (ET)** and determines market status:

**Market Open:**
- Monday - Friday
- 9:30 AM - 4:00 PM ET
- Status: Green indicator with "Market Open"
- Message: "Displaying real-time prices"

**Market Closed - After Hours:**
- Monday - Friday after 4:00 PM ET
- Status: Red indicator with "Market Closed (After-Hours)"
- Message: "Showing latest closing prices from today's trading session"

**Market Closed - Pre-Market:**
- Monday - Friday before 9:30 AM ET
- Status: Red indicator with "Market Closed (Pre-Market)"
- Message: "Showing latest closing prices from previous trading session"

**Market Closed - Weekend:**
- Saturday and Sunday
- Status: Red indicator with "Market Closed (Weekend)"
- Message: "Showing latest available prices from last trading session"

---

## Visual Indicators

### Status Banner

A prominent banner appears in the header showing:

**When Market is Open (Green):**
```
🟢 Market Open
Displaying real-time prices
Last Updated: Oct 23, 2025, 2:45 PM ET
```

**When Market is Closed (Red):**
```
🔴 Market Closed (After-Hours)
Showing latest closing prices from today's trading session
Last Updated: Oct 23, 2025, 5:30 PM ET
```

### Visual Elements:
- **Pulsing dot** - Green (open) or Red (closed)
- **Status message** - Clear indication of market state
- **Explanation** - What data is being shown
- **Timestamp** - When data was last fetched

---

## Data Freshness Rules

### During Market Hours (9:30 AM - 4:00 PM ET):
✅ **Real-time data**
- Stock prices update with every refresh
- Options prices reflect current market
- All data is live and current

### After Market Hours (After 4:00 PM ET):
⏱️ **Latest closing prices**
- Stock prices show closing values from today
- Options prices show last traded values
- Data is from the most recent trading session
- Still accurate for analysis and planning

### Pre-Market (Before 9:30 AM ET):
⏱️ **Previous session closing prices**
- Stock prices show yesterday's closing values
- Options prices show previous session's last values
- Data is from the most recent completed session

### Weekends:
⏱️ **Last trading day's prices**
- Stock prices show Friday's closing values
- Options prices show Friday's last values
- Data is from the most recent trading session

---

## Why This Matters

### Transparency
Users know exactly what they're looking at - whether it's live data or closing prices.

### Trust
Clear communication about data freshness builds confidence in recommendations.

### Planning
Even after hours, users can analyze positions using the latest available prices.

### Accuracy
The app always shows the most recent data available from Yahoo Finance, whether the market is open or not.

---

## Implementation Details

### Timezone Handling
```javascript
// All times converted to ET
const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
```

### Market Hours Check
```javascript
// Market hours: 9:30 AM - 4:00 PM ET
const marketOpen = 9 * 60 + 30;  // 9:30 AM
const marketClose = 16 * 60;      // 4:00 PM
```

### Weekend Detection
```javascript
const day = et.getDay();
if (day === 0 || day === 6) {
  // Weekend - market closed
}
```

---

## User Experience

### Clear Communication
- Users are never confused about whether data is live or historical
- Timestamp shows exactly when data was fetched
- Status message explains what prices represent

### No Surprises
- If using app on weekend, users know they're seeing Friday's prices
- If using after hours, users know they're seeing closing prices
- No misleading "real-time" claims when market is closed

### Still Useful
- Even with closing prices, analysis and strategies remain valid
- Users can plan trades for the next session
- Historical data is still accurate for decision-making

---

## Technical Features

### Automatic Detection
- No user configuration needed
- Automatically checks market status on every data refresh
- Updates in real-time

### Eastern Time
- All times in ET (US stock market timezone)
- Accurate for users anywhere in the world
- No confusion about timezones

### Persistent Display
- Status banner always visible in header
- Updates with each refresh
- Includes precise timestamp

---

## Example Scenarios

### Scenario 1: Trading During Market Hours
**Time:** Tuesday, 2:30 PM ET
**Display:** 🟢 Market Open
**Message:** "Displaying real-time prices"
**Result:** All prices are live and current

### Scenario 2: Planning After Hours
**Time:** Tuesday, 7:00 PM ET
**Display:** 🔴 Market Closed (After-Hours)
**Message:** "Showing latest closing prices from today's trading session"
**Result:** Prices from 4:00 PM close, still accurate for planning

### Scenario 3: Weekend Research
**Time:** Saturday, 10:00 AM ET
**Display:** 🔴 Market Closed (Weekend)
**Message:** "Showing latest available prices from last trading session"
**Result:** Friday's closing prices, perfect for weekend analysis

### Scenario 4: Early Morning Check
**Time:** Monday, 8:00 AM ET
**Display:** 🔴 Market Closed (Pre-Market)
**Message:** "Showing latest closing prices from previous trading session"
**Result:** Friday's closing prices until market opens at 9:30 AM

---

## Build Status

✅ **Build Successful** (2.47s)

### Updated Files:
- `src/services/optionsRecommendationService.js` - Added market hours detection
- `src/App.jsx` - Added market status display
- `src/App.css` - Added status banner styles

---

## Summary

The market hours feature ensures users always know:
1. ✅ Whether the market is currently open or closed
2. ✅ What time zone is being used (ET)
3. ✅ What the displayed prices represent (live vs closing)
4. ✅ When the data was last updated

This transparency builds trust and helps users make informed decisions regardless of when they use the app.
