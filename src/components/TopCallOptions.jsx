import { useState, useEffect } from 'react';
import OptionsService from '../services/optionsService';

function TopCallOptions() {
  const [allOptions, setAllOptions] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load recommended options on component mount
  useEffect(() => {
    loadRecommendedOptions();
  }, []);

  // Filter options whenever search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOptions(allOptions);
    } else {
      const filtered = allOptions.filter(option =>
        option.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, allOptions]);

  const loadRecommendedOptions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const service = new OptionsService();
      const data = await service.getRecommendedSellPutOptions();

      if (data && data.recommendations && data.recommendations.length > 0) {
        setAllOptions(data.recommendations);
        setFilteredOptions(data.recommendations);
      } else {
        setError('No recommended options available at this time');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch recommended options');
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="top-call-options">
      <div className="options-page-header">
        <div>
          <h2>Top Recommended Sell Put Options</h2>
          <p className="section-description">
            Market-analyzed recommendations for selling put options. These are selected based on
            high volume, good premiums, and favorable risk/reward ratios.
          </p>
        </div>
        <button onClick={loadRecommendedOptions} className="refresh-button" disabled={isLoading}>
          {isLoading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Filter by stock symbol or company name..."
            className="filter-input"
            disabled={isLoading}
          />
          {searchTerm && (
            <button onClick={clearSearch} className="clear-search-button">
              ✕
            </button>
          )}
        </div>
        <div className="results-count">
          Showing {filteredOptions.length} of {allOptions.length} recommendations
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing market data and loading recommendations...</p>
        </div>
      )}

      {!isLoading && filteredOptions.length > 0 && (
        <div className="options-table-container">
          <div className="table-wrapper">
            <table className="options-table sell-puts-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th>Stock Price</th>
                  <th>Strike Price</th>
                  <th>Option Price</th>
                  <th>Premium</th>
                  <th>Volume</th>
                  <th>Open Int.</th>
                  <th>IV</th>
                  <th>Delta</th>
                  <th>Return %</th>
                  <th>Days</th>
                  <th>Prob %</th>
                  <th>Risk</th>
                  <th>Strategy</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {filteredOptions.map((option, index) => (
                  <tr key={`${option.symbol}-${index}`} className="option-row">
                    <td className="symbol-cell">{option.symbol}</td>
                    <td className="company-cell">{option.companyName}</td>
                    <td className="stock-price-cell">${option.stockPrice.toFixed(2)}</td>
                    <td className="strike-cell">${option.strikePrice.toFixed(2)}</td>
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
                    <td className="recommendation-cell">{option.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="options-footer-note">
            <p><strong>How to use this data:</strong> These are recommended sell put options based on market analysis.
            Premium = Option Price × 100 shares. Return % = (Premium / Capital Required) × 100.
            Higher probability of profit indicates safer trades.</p>
            <p className="strategy-note"><strong>Sell Put Strategy:</strong> You collect the premium upfront. If the stock stays
            above the strike price at expiration, you keep the full premium as profit. If it falls below, you may be assigned
            the stock at the strike price. Only sell puts on stocks you'd be willing to own.</p>
          </div>
        </div>
      )}

      {!isLoading && filteredOptions.length === 0 && allOptions.length > 0 && (
        <div className="empty-state">
          <p>No options match your search for "{searchTerm}"</p>
          <button onClick={clearSearch} className="clear-search-button-large">
            Clear Search
          </button>
        </div>
      )}

      {!isLoading && allOptions.length === 0 && !error && (
        <div className="empty-state">
          <p>No recommendations available</p>
          <button onClick={loadRecommendedOptions} className="retry-button">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default TopCallOptions;
