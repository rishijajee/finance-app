import { useState } from 'react';
import OptionsService from '../services/optionsService';

function TopCallOptions() {
  const [symbol, setSymbol] = useState('');
  const [putOptions, setPutOptions] = useState(null);
  const [stockPrice, setStockPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol.trim()) return;

    setIsLoading(true);
    setError(null);
    setPutOptions(null);
    setStockPrice(null);

    try {
      const service = new OptionsService();
      const data = await service.getTopSellPutOptions(symbol.toUpperCase());

      if (data && data.options && data.options.length > 0) {
        setPutOptions(data.options);
        setStockPrice(data.stockPrice);
      } else {
        setError('No put options data available for this symbol');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch options data');
      console.error('Error fetching options:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel) {
      case 'Low':
        return 'risk-badge risk-low';
      case 'Medium':
        return 'risk-badge risk-medium';
      case 'High':
        return 'risk-badge risk-high';
      default:
        return 'risk-badge';
    }
  };

  return (
    <div className="top-call-options">
      <h2>Top Sell Put Options</h2>
      <p className="section-description">
        Real-time top sell put options for the week with execution strategies.
        Sell put strategy profits when stock stays above strike price.
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
          {isLoading ? 'Loading...' : 'Get Top Sell Puts'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {putOptions && (
        <div className="call-options-table-container">
          <div className="options-header-info">
            <h3>Top Sell Put Options for {symbol}</h3>
            <div className="stock-price-badge">
              Current Stock Price: <strong>${stockPrice?.toFixed(2)}</strong>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="options-table sell-puts-table">
              <thead>
                <tr>
                  <th>Strike Price</th>
                  <th>Stock Price</th>
                  <th>Option Price</th>
                  <th>Premium</th>
                  <th>Volume</th>
                  <th>Open Interest</th>
                  <th>IV</th>
                  <th>Delta</th>
                  <th>Return %</th>
                  <th>Days to Exp</th>
                  <th>Prob of Profit</th>
                  <th>Risk</th>
                  <th>Execution Strategy</th>
                </tr>
              </thead>
              <tbody>
                {putOptions.map((option, index) => (
                  <tr key={index} className="option-row">
                    <td className="strike-cell">${option.strikePrice.toFixed(2)}</td>
                    <td className="stock-price-cell">${option.stockPrice.toFixed(2)}</td>
                    <td className="price-cell">${option.optionPrice.toFixed(2)}</td>
                    <td className="premium-cell">${option.premium.toFixed(2)}</td>
                    <td className="volume-cell">{option.volume.toLocaleString()}</td>
                    <td className="oi-cell">{option.openInterest.toLocaleString()}</td>
                    <td>{option.impliedVolatility}%</td>
                    <td>{option.delta}</td>
                    <td className="return-cell">{option.returnOnCapital}%</td>
                    <td>{option.daysToExpiration}</td>
                    <td className="prob-cell">{option.probProfit}%</td>
                    <td>
                      <span className={getRiskBadgeClass(option.riskLevel)}>
                        {option.riskLevel}
                      </span>
                    </td>
                    <td className="strategy-cell">{option.strategy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="options-footer-note">
            <p><strong>Note:</strong> Data is real-time from Yahoo Finance. Premium = Option Price × 100 shares.
            Return % = (Premium / Capital Required) × 100. Higher return and volume indicate better opportunities.</p>
          </div>
        </div>
      )}

      {!putOptions && !error && !isLoading && (
        <div className="empty-state">
          <p>Enter a stock symbol above to view top sell put options</p>
          <p className="empty-state-examples">Popular symbols: AAPL, GOOGL, MSFT, TSLA, AMZN</p>
        </div>
      )}
    </div>
  );
}

export default TopCallOptions;
