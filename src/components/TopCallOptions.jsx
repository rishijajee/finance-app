import { useState, useEffect } from 'react';
import SimplifiedOptionsService from '../services/simplifiedOptionsService';

function TopCallOptions() {
  const [recommendations, setRecommendations] = useState([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    stockSymbol: '',
    currentPrice: '',
    optionRecommended: '',
    strikePrice: '',
    expirationDate: '',
    analysis: ''
  });

  useEffect(() => {
    loadRecommendations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, recommendations]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const service = new SimplifiedOptionsService();
      const data = await service.getTop10Recommendations();
      setRecommendations(data);
      setFilteredRecommendations(data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...recommendations];

    // Apply each filter
    Object.keys(filters).forEach(key => {
      const filterValue = filters[key];
      if (filterValue && filterValue.trim() !== '') {
        filtered = filtered.filter(rec => {
          const value = String(rec[key]).toLowerCase();
          return value.includes(filterValue.toLowerCase());
        });
      }
    });

    setFilteredRecommendations(filtered);
  };

  const handleFilterChange = (column, value) => {
    setFilters(prev => ({ ...prev, [column]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      stockSymbol: '',
      currentPrice: '',
      optionRecommended: '',
      strikePrice: '',
      expirationDate: '',
      analysis: ''
    });
  };

  const getStrategyClass = (strategy) => {
    const classes = {
      'Sell Put': 'strategy-sell-put',
      'Sell Call': 'strategy-sell-call',
      'Buy Call': 'strategy-buy-call',
      'Buy Put': 'strategy-buy-put',
      'Covered Call': 'strategy-covered-call',
      'Bull Call Spread': 'strategy-spread'
    };
    return classes[strategy] || 'strategy-default';
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(v => v && v.trim() !== '');
  };

  return (
    <div className="top-call-options">
      <div className="options-page-header">
        <div>
          <h2>Top 10 Stock Options Recommendations</h2>
          <p className="section-description">
            Real-time analysis of actively traded stocks. Each stock shows the BEST option strategy
            out of 6 possibilities: Sell Put, Sell Call, Buy Call, Buy Put, Covered Call, or Bull Call Spread.
            All data is fetched live from Yahoo Finance - no hardcoded symbols.
          </p>
        </div>
        <button
          onClick={loadRecommendations}
          className="refresh-button"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : '🔄 Refresh Data'}
        </button>
      </div>

      {hasActiveFilters() && (
        <div className="filter-info-bar">
          <span>
            Showing {filteredRecommendations.length} of {recommendations.length} recommendations
          </span>
          <button onClick={clearAllFilters} className="clear-filters-btn">
            Clear All Filters
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Fetching real-time options data from Yahoo Finance...</p>
          <p className="loading-subtext">
            Analyzing top 10 actively traded stocks (not hardcoded)
          </p>
        </div>
      )}

      {!isLoading && filteredRecommendations.length > 0 && (
        <div className="recommendations-container">
          <div className="table-wrapper">
            <table className="simple-recommendations-table">
              <thead>
                <tr>
                  <th>
                    <div className="column-header">
                      <span>Stock Symbol</span>
                      <input
                        type="text"
                        className="column-filter"
                        placeholder="Filter..."
                        value={filters.stockSymbol}
                        onChange={(e) => handleFilterChange('stockSymbol', e.target.value)}
                      />
                    </div>
                  </th>
                  <th>
                    <div className="column-header">
                      <span>Current Price</span>
                      <input
                        type="text"
                        className="column-filter"
                        placeholder="Filter..."
                        value={filters.currentPrice}
                        onChange={(e) => handleFilterChange('currentPrice', e.target.value)}
                      />
                    </div>
                  </th>
                  <th>
                    <div className="column-header">
                      <span>Option Recommended</span>
                      <select
                        className="column-filter"
                        value={filters.optionRecommended}
                        onChange={(e) => handleFilterChange('optionRecommended', e.target.value)}
                      >
                        <option value="">All Strategies</option>
                        <option value="Sell Put">Sell Put</option>
                        <option value="Sell Call">Sell Call</option>
                        <option value="Buy Call">Buy Call</option>
                        <option value="Buy Put">Buy Put</option>
                        <option value="Covered Call">Covered Call</option>
                        <option value="Bull Call Spread">Bull Call Spread</option>
                      </select>
                    </div>
                  </th>
                  <th>
                    <div className="column-header">
                      <span>Strike Price</span>
                      <input
                        type="text"
                        className="column-filter"
                        placeholder="Filter..."
                        value={filters.strikePrice}
                        onChange={(e) => handleFilterChange('strikePrice', e.target.value)}
                      />
                    </div>
                  </th>
                  <th>
                    <div className="column-header">
                      <span>Expiration Date</span>
                      <input
                        type="text"
                        className="column-filter"
                        placeholder="Filter..."
                        value={filters.expirationDate}
                        onChange={(e) => handleFilterChange('expirationDate', e.target.value)}
                      />
                    </div>
                  </th>
                  <th>
                    <div className="column-header">
                      <span>Analysis</span>
                      <input
                        type="text"
                        className="column-filter"
                        placeholder="Filter..."
                        value={filters.analysis}
                        onChange={(e) => handleFilterChange('analysis', e.target.value)}
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecommendations.map((rec, index) => (
                  <tr key={`${rec.stockSymbol}-${index}`}>
                    <td className="symbol-cell">
                      <strong>{rec.stockSymbol}</strong>
                    </td>
                    <td className="price-cell">${rec.currentPrice}</td>
                    <td className="strategy-cell">
                      <span className={`strategy-badge ${getStrategyClass(rec.optionRecommended)}`}>
                        {rec.optionRecommended}
                      </span>
                    </td>
                    <td className="strike-cell">${rec.strikePrice}</td>
                    <td className="expiration-cell">{rec.expirationDate}</td>
                    <td className="analysis-cell">{rec.analysis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="options-footer-note">
            <p>
              <strong>Real-Time Data:</strong> All prices, strikes, and expiration dates are
              fetched live from Yahoo Finance API. Stock symbols are dynamically selected from
              actively traded stocks - not hardcoded.
            </p>
            <p>
              <strong>Strategy Selection:</strong> Each stock shows the BEST option strategy
              based on current market conditions, volume, and potential returns.
            </p>
          </div>
        </div>
      )}

      {!isLoading && filteredRecommendations.length === 0 && recommendations.length > 0 && (
        <div className="empty-state">
          <p>No recommendations match your filters</p>
          <button onClick={clearAllFilters} className="clear-search-button-large">
            Clear All Filters
          </button>
        </div>
      )}

      {!isLoading && recommendations.length === 0 && (
        <div className="empty-state">
          <p>No recommendations available at this time</p>
          <button onClick={loadRecommendations} className="refresh-button">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default TopCallOptions;
