import { useState, useEffect } from 'react';
import ComprehensiveOptionsService from '../services/comprehensiveOptionsService';

function TopCallOptions() {
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState({});

  useEffect(() => {
    loadRealTimeRecommendations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, columnFilters, allRecommendations]);

  const loadRealTimeRecommendations = async () => {
    setIsLoading(true);
    try {
      const service = new ComprehensiveOptionsService();
      const recommendations = await service.generateAllRecommendations();
      setAllRecommendations(recommendations);
      setFilteredRecommendations(recommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allRecommendations];

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(rec =>
        rec.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.strategy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    Object.keys(columnFilters).forEach(column => {
      const filterValue = columnFilters[column];
      if (filterValue && filterValue.trim() !== '') {
        filtered = filtered.filter(rec => {
          const value = String(rec[column]).toLowerCase();
          return value.includes(filterValue.toLowerCase());
        });
      }
    });

    setFilteredRecommendations(filtered);
  };

  const handleColumnFilterChange = (column, value) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
  };

  const getRiskBadgeClass = (riskLevel) => {
    const level = riskLevel.toLowerCase();
    if (level.includes('low')) return 'risk-badge risk-low';
    if (level.includes('high')) return 'risk-badge risk-high';
    return 'risk-badge risk-medium';
  };

  const getStrategyBadgeClass = (strategy) => {
    if (strategy === 'Sell Put') return 'strategy-badge sell-put';
    if (strategy === 'Sell Call') return 'strategy-badge sell-call';
    if (strategy === 'Buy Call') return 'strategy-badge buy-call';
    if (strategy === 'Buy Put') return 'strategy-badge buy-put';
    if (strategy === 'Covered Call') return 'strategy-badge covered-call';
    if (strategy === 'Bull Call Spread') return 'strategy-badge spread';
    return 'strategy-badge';
  };

  const getActiveFilterCount = () => {
    return Object.keys(columnFilters).filter(key => columnFilters[key]).length;
  };

  return (
    <div className="top-call-options">
      <div className="options-page-header">
        <div>
          <h2>Real-Time Options Strategy Recommendations</h2>
          <p className="section-description">
            100% real-time market data. Dynamically analyzes actively traded stocks from Yahoo Finance.
            6 strategies: Sell Put, Sell Call, Buy Call, Buy Put, Covered Call, and Bull Call Spread.
            All prices, volumes, and expiration dates are live - no hardcoded data.
          </p>
        </div>
        <button onClick={loadRealTimeRecommendations} className="refresh-button" disabled={isLoading}>
          {isLoading ? 'Loading Live Data...' : '🔄 Refresh Data'}
        </button>
      </div>

      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by symbol or strategy..."
            className="filter-input"
            disabled={isLoading}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search-button">
              ✕
            </button>
          )}
        </div>
        <div className="filter-info">
          <span className="results-count">
            Showing {filteredRecommendations.length} of {allRecommendations.length} recommendations
          </span>
          {getActiveFilterCount() > 0 && (
            <button onClick={clearAllFilters} className="clear-all-filters-btn">
              Clear All Filters ({getActiveFilterCount()})
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Fetching real-time options data from Yahoo Finance...</p>
          <p className="loading-subtext">Dynamically loading actively traded stocks and analyzing 6 strategies for each</p>
        </div>
      )}

      {!isLoading && filteredRecommendations.length > 0 && (
        <div className="recommendations-container">
          <div className="table-wrapper">
            <table className="recommendations-table">
              <thead>
                <tr>
                  <th>
                    Rank
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.rank || ''}
                      onChange={(e) => handleColumnFilterChange('rank', e.target.value)}
                    />
                  </th>
                  <th>
                    Symbol
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.symbol || ''}
                      onChange={(e) => handleColumnFilterChange('symbol', e.target.value)}
                    />
                  </th>
                  <th>
                    Strategy
                    <select
                      className="column-filter"
                      value={columnFilters.strategy || ''}
                      onChange={(e) => handleColumnFilterChange('strategy', e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="Sell Put">Sell Put</option>
                      <option value="Sell Call">Sell Call</option>
                      <option value="Buy Call">Buy Call</option>
                      <option value="Buy Put">Buy Put</option>
                      <option value="Covered Call">Covered Call</option>
                      <option value="Bull Call Spread">Bull Call Spread</option>
                    </select>
                  </th>
                  <th>
                    Stock Price
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.stockPrice || ''}
                      onChange={(e) => handleColumnFilterChange('stockPrice', e.target.value)}
                    />
                  </th>
                  <th>
                    Strike
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.strikePrice || ''}
                      onChange={(e) => handleColumnFilterChange('strikePrice', e.target.value)}
                    />
                  </th>
                  <th>
                    Expiration
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.expirationDate || ''}
                      onChange={(e) => handleColumnFilterChange('expirationDate', e.target.value)}
                    />
                  </th>
                  <th>
                    Premium
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.premium || ''}
                      onChange={(e) => handleColumnFilterChange('premium', e.target.value)}
                    />
                  </th>
                  <th>
                    Total Premium
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.totalPremium || ''}
                      onChange={(e) => handleColumnFilterChange('totalPremium', e.target.value)}
                    />
                  </th>
                  <th>
                    Volume
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.volume || ''}
                      onChange={(e) => handleColumnFilterChange('volume', e.target.value)}
                    />
                  </th>
                  <th>
                    Open Int.
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.openInterest || ''}
                      onChange={(e) => handleColumnFilterChange('openInterest', e.target.value)}
                    />
                  </th>
                  <th>
                    IV %
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.iv || ''}
                      onChange={(e) => handleColumnFilterChange('iv', e.target.value)}
                    />
                  </th>
                  <th>
                    Return %
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.returnPercent || ''}
                      onChange={(e) => handleColumnFilterChange('returnPercent', e.target.value)}
                    />
                  </th>
                  <th>
                    Annual %
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.annualReturn || ''}
                      onChange={(e) => handleColumnFilterChange('annualReturn', e.target.value)}
                    />
                  </th>
                  <th>
                    Risk
                    <select
                      className="column-filter"
                      value={columnFilters.risk || ''}
                      onChange={(e) => handleColumnFilterChange('risk', e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecommendations.map((rec, index) => (
                  <tr key={`${rec.symbol}-${rec.strategy}-${index}`} className="recommendation-row">
                    <td className="rank-cell">{rec.rank}</td>
                    <td className="symbol-cell">{rec.symbol}</td>
                    <td>
                      <span className={getStrategyBadgeClass(rec.strategy)}>
                        {rec.strategy}
                      </span>
                    </td>
                    <td className="price-cell">${rec.stockPrice.toFixed(2)}</td>
                    <td className="strike-cell">${rec.strikePrice.toFixed(2)}</td>
                    <td className="expiration-cell">{rec.expirationDate}</td>
                    <td className="premium-cell">${rec.premium.toFixed(2)}</td>
                    <td className="total-premium-cell">${rec.totalPremium.toFixed(2)}</td>
                    <td className="volume-cell">{rec.volume.toLocaleString()}</td>
                    <td className="oi-cell">{rec.openInterest.toLocaleString()}</td>
                    <td className="iv-cell">{rec.iv}%</td>
                    <td className="return-cell">{rec.returnPercent}%</td>
                    <td className="annual-return-cell">{rec.annualReturn}%</td>
                    <td>
                      <span className={getRiskBadgeClass(rec.risk)}>
                        {rec.risk}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-analysis-btn"
                        onClick={() => setSelectedRecommendation(rec)}
                      >
                        View Strategy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="options-footer-note">
            <p><strong>Real-Time Data:</strong> All prices, volumes, and expirations fetched live from Yahoo Finance API.
            Use column filters to find specific strategies, symbols, or risk levels.</p>
            <p className="strategy-note"><strong>6 Strategies:</strong> Sell Put (cash-secured), Sell Call (naked), Buy Call (long), Buy Put (long/hedge), Covered Call (income), Bull Call Spread (limited risk).</p>
          </div>
        </div>
      )}

      {!isLoading && filteredRecommendations.length === 0 && allRecommendations.length > 0 && (
        <div className="empty-state">
          <p>No options match your filters</p>
          <button onClick={clearAllFilters} className="clear-search-button-large">
            Clear All Filters
          </button>
        </div>
      )}

      {selectedRecommendation && (
        <div className="modal-overlay" onClick={() => setSelectedRecommendation(null)}>
          <div className="analysis-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedRecommendation(null)}>✕</button>

            <div className="modal-header">
              <h2>{selectedRecommendation.symbol} - {selectedRecommendation.strategy}</h2>
              <div className="modal-badges">
                <span className={getStrategyBadgeClass(selectedRecommendation.strategy)}>
                  {selectedRecommendation.strategy}
                </span>
                <span className={getRiskBadgeClass(selectedRecommendation.risk)}>
                  {selectedRecommendation.risk} Risk
                </span>
              </div>
            </div>

            <div className="modal-content">
              <div className="real-time-indicator">
                <span className="live-dot"></span>
                Real-time data from Yahoo Finance
              </div>

              <div className="modal-section">
                <h3>Trade Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Strategy:</span>
                    <span className="detail-value">{selectedRecommendation.strategy}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Stock Price:</span>
                    <span className="detail-value">${selectedRecommendation.stockPrice.toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Strike Price:</span>
                    <span className="detail-value">${selectedRecommendation.strikePrice.toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Expiration:</span>
                    <span className="detail-value">{selectedRecommendation.expirationDate}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Premium per Share:</span>
                    <span className="detail-value">${selectedRecommendation.premium.toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Premium/Cost:</span>
                    <span className="detail-value">${selectedRecommendation.totalPremium.toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Volume:</span>
                    <span className="detail-value">{selectedRecommendation.volume.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Open Interest:</span>
                    <span className="detail-value">{selectedRecommendation.openInterest.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Implied Volatility:</span>
                    <span className="detail-value">{selectedRecommendation.iv}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Return %:</span>
                    <span className="detail-value">{selectedRecommendation.returnPercent}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Annualized Return:</span>
                    <span className="detail-value">{selectedRecommendation.annualReturn}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Risk Level:</span>
                    <span className="detail-value">{selectedRecommendation.risk}</span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3>Trading Strategy</h3>
                <p className="trading-strategy-text">{selectedRecommendation.tradingStrategy}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TopCallOptions;
