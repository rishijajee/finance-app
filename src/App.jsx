import { useState } from 'react';
import StockLookup from './components/StockLookup';
import StockPrice from './components/StockPrice';
import OptionsTable from './components/OptionsTable';
import NavigationMenu from './components/NavigationMenu';
import TopCallOptions from './components/TopCallOptions';
import YahooFinanceService from './services/yahooFinanceService';
import './App.css';

function App() {
  const [stockData, setStockData] = useState(null);
  const [optionsData, setOptionsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('home');

  const handleSearch = async (symbol) => {
    setIsLoading(true);
    setError(null);
    setStockData(null);
    setOptionsData(null);

    const service = new YahooFinanceService();

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
        <p className="app-subtitle">Get instant stock quotes and options data powered by Yahoo Finance</p>
      </header>

      <main className="app-main">
        <NavigationMenu onNavigate={handleNavigate} currentView={currentView} />

        <div className="content-section">
          {currentView === 'home' && (
            <>
              <div className="search-section">
                <StockLookup onSearch={handleSearch} isLoading={isLoading} />

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
            <TopCallOptions />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Powered by Yahoo Finance API | Real-time data refreshes on each search</p>
      </footer>
    </div>
  );
}

export default App;
