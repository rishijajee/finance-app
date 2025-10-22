# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based finance application that provides real-time stock quotes and options data using the Alpha Vantage API. The app features a clean UI with stock price display and tabular options data (calls/puts).

## Development Commands

### Start Development Server
```bash
npm run dev
```
Runs on `http://localhost:5173` with hot module replacement (HMR).

### Build for Production
```bash
npm run build
```
Outputs to `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

## Architecture

### Component Structure

The application follows a component-based architecture with clear separation of concerns:

- **App.jsx** - Root component that manages application state (API key, stock data, options data, loading, errors). Orchestrates data fetching and renders child components conditionally based on state.

- **StockLookup** - Controlled form component for stock symbol input. Accepts `onSearch` callback and `isLoading` prop.

- **StockPrice** - Presentational component that displays comprehensive stock data including current price, change indicators, and key metrics (open, high, low, volume, previous close).

- **OptionsTable** - Renders two side-by-side tables (calls and puts) with strike prices, premiums, volume, and open interest data.

### Service Layer

**alphaVantageService.js** - API service class that encapsulates all Alpha Vantage API interactions:
- `getStockQuote(symbol)` - Fetches real-time stock quotes using GLOBAL_QUOTE endpoint
- `getTopOptions(symbol)` - Returns mock options data (Alpha Vantage free tier doesn't support real options)
- Handles API errors, rate limiting, and data transformation

### State Management

State is managed in the root App component using React hooks:
- `stockData` - Current stock quote data
- `optionsData` - Options chain data (calls/puts)
- `isLoading` - Loading state for API calls
- `error` - Error messages
- `apiKey` - User's Alpha Vantage API key
- `showApiInput` - Toggle between API key input and main app view

### API Integration

The app uses Alpha Vantage API with the following considerations:
- **Free tier limits**: 25 calls/day, 5 calls/minute
- API key is required and stored in component state (not persisted)
- Error handling for rate limits, invalid symbols, and network errors
- The `GLOBAL_QUOTE` function provides real-time stock data
- Options data is currently mocked (free tier limitation)

## Styling Architecture

- Single CSS file (`App.css`) with BEM-inspired naming
- Responsive design with mobile breakpoints at 768px and 1024px
- Gradient background with card-based layout for content
- Color-coded price changes (green for positive, red for negative)
- Hover effects and transitions for interactive elements

## Key Implementation Details

### API Response Transformation
The `getStockQuote` method transforms Alpha Vantage's verbose JSON keys (e.g., "01. symbol", "05. price") into clean JavaScript property names.

### Error Handling
Multiple error scenarios are handled:
- API rate limit exceeded
- Invalid stock symbols
- Network errors
- Empty/missing data

### Options Data Note
The options data is currently simulated. To integrate real options data:
1. Use a different API (Tradier, CBOE, etc.)
2. Upgrade to Alpha Vantage premium tier
3. Modify `getTopOptions` in alphaVantageService.js

## Adding New Features

When adding features to this codebase:

1. **New API endpoints**: Add methods to `alphaVantageService.js` class
2. **New data displays**: Create new components in `src/components/`
3. **State changes**: Update App.jsx state management
4. **Styling**: Add styles to App.css following existing naming conventions

## Common Tasks

### Change API Provider
Modify or extend `src/services/alphaVantageService.js` to integrate different data sources.

### Add Real Options Data
Replace the mock data in `getTopOptions()` with real API integration from a provider that supports options chains.

### Add Charts
Consider integrating Chart.js or Recharts library and create a new component for historical price visualization.

### Persist API Key
Implement localStorage or sessionStorage to save the API key between sessions (ensure secure practices).

## Important Notes

- API key is entered through the UI on first load
- Stock symbols must be valid US stock tickers
- The app makes 2 API calls per search (quote + options)
- Options data is currently for demonstration purposes only
