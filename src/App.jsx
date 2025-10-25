import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import OptionsRecommendationService from './services/optionsRecommendationService';

function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [marketStatus, setMarketStatus] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const service = new OptionsRecommendationService();
      const data = await service.getAllRecommendations();

      console.log('Data received:', data);
      console.log('Recommendations count:', data.recommendations?.length || 0);

      setRecommendations(data.recommendations || []);
      setMarketStatus(data.marketStatus);
      setLastUpdateTime(data.lastUpdateTime);
      setUsingFallback(data.usingFallback);
    } catch (err) {
      setError('Failed to load recommendations. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Options Trading Recommendations</h1>
        <p className="subtitle">Top 25 Options Opportunities</p>

        {marketStatus && (
          <div className={`market-status-banner ${marketStatus.isOpen ? 'market-open' : 'market-closed'}`}>
            <div className="status-indicator">
              <span className={`status-dot ${marketStatus.isOpen ? 'dot-green' : 'dot-red'}`}></span>
              <strong>{marketStatus.message}</strong>
            </div>
            <div className="status-details">
              <p>{marketStatus.note}</p>
              {marketStatus.dataTime && (
                <p className="data-time-info">
                  <strong>Data Period:</strong> {marketStatus.dataTime}
                </p>
              )}
              {lastUpdateTime && (
                <p className="update-time">Last Fetched: {lastUpdateTime} ET</p>
              )}
            </div>
          </div>
        )}

        {usingFallback && (
          <div className="fallback-warning">
            ⚠️ Yahoo Finance API access limited in browser. Showing demo data with realistic prices.
            For live data, deploy to a server or use during market hours.
          </div>
        )}

        <div className="header-actions">
          <button onClick={loadRecommendations} disabled={isLoading} className="refresh-btn">
            {isLoading ? 'Loading...' : '🔄 Refresh Data'}
          </button>
          <Link to="/testing-tools" className="llm-directory-link">
            LLM-Directory →
          </Link>
        </div>
      </header>

      <main className="app-main">
        {isLoading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Fetching real-time stock and options data...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p>{error}</p>
            <button onClick={loadRecommendations}>Try Again</button>
          </div>
        )}

        {!isLoading && !error && recommendations.length > 0 && (
          <div className="single-table-wrapper">
            <h2 className="table-title">All Recommendations (25 Total)</h2>
            <p className="table-subtitle">Top 5 for each of 5 strategies</p>

            <div className="table-container">
              <table className="recommendations-table">
                <thead>
                  <tr>
                    <th>Stock Symbol</th>
                    <th>Current Price</th>
                    <th>Strategy</th>
                    <th>Strike Price</th>
                    <th>Expiration</th>
                    <th>Reason</th>
                    <th>How to Trade</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((rec, index) => (
                    <tr key={index}>
                      <td className="symbol-col">
                        <strong>{rec.stockSymbol}</strong>
                      </td>
                      <td className="price-col">${rec.currentStockPrice}</td>
                      <td className="strategy-col">
                        <span className={`strategy-badge ${rec.optionStrategy.toLowerCase().replace(' ', '-')}`}>
                          {rec.optionStrategy}
                        </span>
                      </td>
                      <td className="strike-col">${rec.strikePrice}</td>
                      <td className="exp-col">{rec.expirationDate}</td>
                      <td className="reason-col">{rec.reason}</td>
                      <td className="trade-col">{rec.howToTrade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && !error && recommendations.length === 0 && (
          <div className="no-data">
            <p>No recommendations available at this time</p>
            <button onClick={loadRecommendations} className="refresh-btn">Refresh</button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Real-time data from Yahoo Finance API</p>
      </footer>
    </div>
  );
}

export default App;
