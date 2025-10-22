import { useState } from 'react';
import AlphaVantageService from '../services/alphaVantageService';

function TopCallOptions({ apiKey }) {
  const [symbol, setSymbol] = useState('');
  const [callOptions, setCallOptions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol.trim()) return;

    setIsLoading(true);
    setError(null);
    setCallOptions(null);

    try {
      const service = new AlphaVantageService(apiKey);
      const options = await service.getTopOptions(symbol.toUpperCase());

      if (options && options.calls) {
        setCallOptions(options.calls);
      } else {
        setError('No call options data available for this symbol');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch options data');
      console.error('Error fetching options:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="top-call-options">
      <h2>Top Call Options</h2>
      <p className="section-description">
        View the most active call options for any stock symbol
      </p>

      <form onSubmit={handleSubmit} className="options-search-form">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Enter stock symbol (e.g., AAPL)"
          className="options-search-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="options-search-button"
          disabled={isLoading || !symbol.trim()}
        >
          {isLoading ? 'Loading...' : 'Get Call Options'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {callOptions && (
        <div className="call-options-table-container">
          <h3>Call Options for {symbol}</h3>
          <table className="options-table">
            <thead>
              <tr>
                <th>Strike Price</th>
                <th>Premium</th>
                <th>Volume</th>
                <th>Open Interest</th>
                <th>Implied Volatility</th>
              </tr>
            </thead>
            <tbody>
              {callOptions.map((option, index) => (
                <tr key={index}>
                  <td>${option.strikePrice.toFixed(2)}</td>
                  <td>${option.premium.toFixed(2)}</td>
                  <td>{option.volume.toLocaleString()}</td>
                  <td>{option.openInterest.toLocaleString()}</td>
                  <td>{option.impliedVolatility}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!callOptions && !error && !isLoading && (
        <div className="empty-state">
          <p>Enter a stock symbol above to view top call options</p>
          <p className="empty-state-examples">Popular symbols: AAPL, GOOGL, MSFT, TSLA, AMZN</p>
        </div>
      )}
    </div>
  );
}

export default TopCallOptions;
