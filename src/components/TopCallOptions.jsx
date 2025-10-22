import { useState, useEffect } from 'react';
import OptionsService from '../services/optionsService';

function TopCallOptions() {
  const [symbol, setSymbol] = useState('AAPL');
  const [putOptions, setPutOptions] = useState(null);
  const [stockPrice, setStockPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load options data on component mount
  useEffect(() => {
    loadOptions('AAPL');
  }, []);

  const loadOptions = async (ticker) => {
    setIsLoading(true);
    setError(null);
    setPutOptions(null);
    setStockPrice(null);

    try {
      const service = new OptionsService();
      const data = await service.getTopSellPutOptions(ticker);

      if (data && data.options && data.options.length > 0) {
        setPutOptions(data.options);
        setStockPrice(data.stockPrice);
        setSymbol(ticker);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    await loadOptions(symbol.toUpperCase());
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

  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META'];

  return (
    <div className="top-call-options">
      <h2>Top Sell Put Options</h2>
      <p className="section-description">
        Real-time top sell put options for the week with execution strategies.
        Sell put strategy profits when stock stays above strike price.
      </p>

      <div className="stock-selector">
        <div className="popular-stocks">
          <span className="popular-label">Popular:</span>
          {popularStocks.map((stock) => (
            <button
              key={stock}
              onClick={() => loadOptions(stock)}
              className={`stock-chip ${symbol === stock ? 'active' : ''}`}
              disabled={isLoading}
            >
              {stock}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="options-search-form">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Or enter custom symbol"
            className="options-search-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="options-search-button"
            disabled={isLoading || !symbol.trim()}
          >
            {isLoading ? 'Loading...' : 'Search'}
          </button>
        </form>
      </div>

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
            <p><strong>Note:</strong> Attempting to fetch real-time data from Yahoo Finance API. Due to CORS restrictions in browsers,
            the app may fall back to realistic mock data for demonstration. Premium = Option Price × 100 shares.
            Return % = (Premium / Capital Required) × 100. Higher return and volume indicate better opportunities.</p>
            <p className="strategy-note"><strong>Sell Put Strategy:</strong> You collect the premium upfront. If the stock stays
            above the strike price at expiration, you keep the full premium as profit. If it falls below, you may be assigned
            the stock at the strike price.</p>
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
