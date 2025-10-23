import { useState, useEffect } from 'react';
import './App.css';
import OptionsRecommendationService from './services/optionsRecommendationService';

function App() {
  const [recommendations, setRecommendations] = useState([]);
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
      setRecommendations(data);
    } catch (err) {
      setError('Failed to load recommendations. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const groupByStrategy = () => {
    const groups = {
      'Buy Call': [],
      'Buy Put': [],
      'Sell Put': [],
      'Sell Call': [],
      'Bull Call Spread': []
    };

    recommendations.forEach(rec => {
      if (groups[rec.optionStrategy]) {
        groups[rec.optionStrategy].push(rec);
      }
    });

    return groups;
  };

  const strategyGroups = groupByStrategy();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Options Trading Recommendations</h1>
        <p className="subtitle">Real-time analysis of top options opportunities</p>
        <button onClick={loadRecommendations} disabled={isLoading} className="refresh-btn">
          {isLoading ? 'Loading...' : '🔄 Refresh Data'}
        </button>
      </header>

      <main className="app-main">
        {isLoading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Fetching real-time stock and options data from Yahoo Finance...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p>{error}</p>
            <button onClick={loadRecommendations}>Try Again</button>
          </div>
        )}

        {!isLoading && !error && (
          <div className="recommendations-wrapper">
            {Object.entries(strategyGroups).map(([strategy, recs]) => (
              <section key={strategy} className="strategy-section">
                <h2 className="strategy-title">{strategy}</h2>
                <p className="strategy-count">Top {recs.length} Recommendations</p>

                {recs.length > 0 ? (
                  <div className="table-container">
                    <table className="recommendations-table">
                      <thead>
                        <tr>
                          <th>Stock Symbol</th>
                          <th>Current Stock Price</th>
                          <th>Option Strategy</th>
                          <th>Strike Price</th>
                          <th>Expiration Date</th>
                          <th>Reason for Recommendation</th>
                          <th>How to Trade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recs.map((rec, index) => (
                          <tr key={`${rec.stockSymbol}-${index}`}>
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
                ) : (
                  <div className="no-data">
                    <p>No recommendations available for this strategy</p>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {!isLoading && !error && recommendations.length === 0 && (
          <div className="no-data">
            <p>No recommendations available at this time</p>
            <button onClick={loadRecommendations}>Refresh</button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>All data is fetched in real-time from Yahoo Finance API</p>
      </footer>
    </div>
  );
}

export default App;
