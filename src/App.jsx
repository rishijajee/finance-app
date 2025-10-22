import { useState } from 'react';
import StockLookup from './components/StockLookup';
import StockPrice from './components/StockPrice';
import OptionsTable from './components/OptionsTable';
import NavigationMenu from './components/NavigationMenu';
import TopCallOptions from './components/TopCallOptions';
import AlphaVantageService from './services/alphaVantageService';
import './App.css';

function App() {
  const [stockData, setStockData] = useState(null);
  const [optionsData, setOptionsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);
  const [currentView, setCurrentView] = useState('home');

  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setShowApiInput(false);
      setError(null);
    }
  };

  const handleSearch = async (symbol) => {
    if (!apiKey) {
      setError('Please enter your Alpha Vantage API key');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStockData(null);
    setOptionsData(null);

    const service = new AlphaVantageService(apiKey);

    try {
      // Fetch stock quote
      const quote = await service.getStockQuote(symbol);
      setStockData(quote);

      // Fetch options data
      const options = await service.getTopOptions(symbol);
      setOptionsData(options);
    } catch (err) {
      setError(err.message || 'Failed to fetch stock data');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
    // Reset data when navigating
    setStockData(null);
    setOptionsData(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📈 Real-Time Stock & Options Tracker</h1>
        <p className="app-subtitle">Get instant stock quotes and options data</p>
      </header>

      <main className="app-main">
        {showApiInput ? (
          <div className="api-key-container">
            <div className="api-key-card">
              <h2>Welcome!</h2>
              <p>To get started, enter your Alpha Vantage API key.</p>
              <p className="api-key-note">
                Don't have one? Get a free API key at{' '}
                <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer">
                  alphavantage.co
                </a>
              </p>
              <form onSubmit={handleApiKeySubmit}>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="api-key-input"
                />
                <button type="submit" className="api-key-button" disabled={!apiKey.trim()}>
                  Continue
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            <NavigationMenu onNavigate={handleNavigate} currentView={currentView} />

            <div className="content-section">
              {currentView === 'home' && (
                <>
                  <div className="search-section">
                    <StockLookup onSearch={handleSearch} isLoading={isLoading} />
                    <button onClick={() => setShowApiInput(true)} className="change-api-key">
                      Change API Key
                    </button>
                  </div>

                  {error && (
                    <div className="error-message">
                      <strong>Error:</strong> {error}
                    </div>
                  )}

                  {stockData && (
                    <div className="results-section">
                      <StockPrice stockData={stockData} />
                      <OptionsTable optionsData={optionsData} />
                    </div>
                  )}

                  {!stockData && !error && !isLoading && (
                    <div className="empty-state">
                      <p>Enter a stock symbol above to get started</p>
                      <p className="empty-state-examples">Try: AAPL, GOOGL, MSFT, TSLA, AMZN</p>
                    </div>
                  )}
                </>
              )}

              {currentView === 'topCallOptions' && (
                <TopCallOptions apiKey={apiKey} />
              )}
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by Alpha Vantage API | Data refreshes on each search</p>
      </footer>
    </div>
  );
}

export default App;
