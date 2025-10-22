# Real-Time Stock & Options Tracker

A React-based finance application that provides real-time stock quotes and options data using the Alpha Vantage API.

## Features

- Real-time stock price quotes
- Comprehensive stock data (open, close, high, low, volume)
- Top options data display (calls and puts) in tabular format
- Clean, modern, and responsive UI
- Error handling and loading states
- API key management

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Alpha Vantage API key (free tier available)

## Getting Started

### 1. Get Your API Key

Sign up for a free Alpha Vantage API key at:
https://www.alphavantage.co/support/#api-key

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### 4. Enter Your API Key

When you first launch the application, you'll be prompted to enter your Alpha Vantage API key. You can change it anytime using the "Change API Key" button.

## Usage

1. Enter your Alpha Vantage API key
2. Type a stock symbol (e.g., AAPL, GOOGL, MSFT, TSLA)
3. Click "Get Quote" to fetch real-time data
4. View stock price, changes, and detailed options data

## Project Structure

```
finance-app/
├── src/
│   ├── components/
│   │   ├── StockLookup.jsx      # Stock symbol input component
│   │   ├── StockPrice.jsx       # Stock price display component
│   │   └── OptionsTable.jsx     # Options data table component
│   ├── services/
│   │   └── alphaVantageService.js  # API service layer
│   ├── App.jsx                  # Main application component
│   ├── App.css                  # Application styles
│   └── main.jsx                 # Application entry point
├── package.json
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Rate Limits

Alpha Vantage free tier has rate limits:
- 25 API calls per day
- 5 API calls per minute

For production use, consider upgrading to a paid tier or implementing caching.

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **Alpha Vantage API** - Stock market data

## Notes

- Options data in the current implementation is simulated, as Alpha Vantage's free tier doesn't include options chains
- For real options data, consider integrating with Tradier, CBOE, or upgrading to Alpha Vantage's premium tier
- The app stores the API key in component state (not persisted). For production, consider using secure storage

## Future Enhancements

- Price history charts
- Multiple stock tracking
- Auto-refresh functionality
- Portfolio management
- Real options data integration
- Local storage for API key
- Historical price comparisons
