import { useState, useEffect } from 'react';
import RealTimeOptionsService from '../services/realTimeOptionsService';

function TopCallOptions() {
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState({});

  // Load real-time recommendations on component mount
  useEffect(() => {
    loadRealTimeRecommendations();
  }, []);

  // Apply filters whenever search term or column filters change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, columnFilters, allRecommendations]);

  const loadRealTimeRecommendations = async () => {
    setIsLoading(true);

    try {
      const service = new RealTimeOptionsService();
      const recommendations = await service.generateRealTimeRecommendations();

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

    // Apply search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(rec =>
        rec.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.sector.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply column filters
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
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const clearColumnFilter = (column) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
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

  const handleRowClick = (recommendation) => {
    setSelectedRecommendation(recommendation);
  };

  const closeModal = () => {
    setSelectedRecommendation(null);
  };

  const getActiveFilterCount = () => {
    return Object.keys(columnFilters).filter(key => columnFilters[key]).length;
  };

  return (
    <div className="top-call-options">
      <div className="options-page-header">
        <div>
          <h2>Top 100 Real-Time Options Recommendations</h2>
          <p className="section-description">
            Live market data for 50 stocks with both Sell Put and Sell Call recommendations.
            All prices, volumes, and metrics are fetched in real-time from Yahoo Finance API.
          </p>
        </div>
        <button onClick={loadRealTimeRecommendations} className="refresh-button" disabled={isLoading}>
          {isLoading ? 'Loading Live Data...' : '🔄 Refresh Real-Time Data'}
        </button>
      </div>

      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by symbol, company, or sector..."
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
          <p>Fetching real-time data from Yahoo Finance for 50 stocks...</p>
          <p className="loading-subtext">This may take 30-60 seconds as we fetch live prices and options data</p>
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
                    Company
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.companyName || ''}
                      onChange={(e) => handleColumnFilterChange('companyName', e.target.value)}
                    />
                  </th>
                  <th>
                    Option Type
                    <select
                      className="column-filter"
                      value={columnFilters.optionType || ''}
                      onChange={(e) => handleColumnFilterChange('optionType', e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="Sell Put">Sell Put</option>
                      <option value="Sell Call">Sell Call</option>
                    </select>
                  </th>
                  <th>
                    Sector
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.sector || ''}
                      onChange={(e) => handleColumnFilterChange('sector', e.target.value)}
                    />
                  </th>
                  <th>
                    Current Price
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.currentPrice || ''}
                      onChange={(e) => handleColumnFilterChange('currentPrice', e.target.value)}
                    />
                  </th>
                  <th>
                    Strike Price
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
                    Days
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.daysToExpiry || ''}
                      onChange={(e) => handleColumnFilterChange('daysToExpiry', e.target.value)}
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
                    Return %
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.returnOnCapital || ''}
                      onChange={(e) => handleColumnFilterChange('returnOnCapital', e.target.value)}
                    />
                  </th>
                  <th>
                    Annual. %
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.annualizedReturn || ''}
                      onChange={(e) => handleColumnFilterChange('annualizedReturn', e.target.value)}
                    />
                  </th>
                  <th>
                    Risk
                    <select
                      className="column-filter"
                      value={columnFilters.riskLevel || ''}
                      onChange={(e) => handleColumnFilterChange('riskLevel', e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </th>
                  <th>
                    Recommendation
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="column-filter"
                      value={columnFilters.recommendation || ''}
                      onChange={(e) => handleColumnFilterChange('recommendation', e.target.value)}
                    />
                  </th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecommendations.map((rec, index) => (
                  <tr key={`${rec.symbol}-${rec.optionType}-${index}`} className="recommendation-row">
                    <td className="rank-cell">{rec.rank}</td>
                    <td className="symbol-cell">{rec.symbol}</td>
                    <td className="company-cell">{rec.companyName}</td>
                    <td className={`option-type-cell ${rec.optionType === 'Sell Put' ? 'put-option' : 'call-option'}`}>
                      {rec.optionType}
                    </td>
                    <td className="sector-cell">{rec.sector}</td>
                    <td className="price-cell">${rec.currentPrice.toFixed(2)}</td>
                    <td className="strike-cell">${rec.strikePrice.toFixed(2)}</td>
                    <td className="expiration-cell">{rec.expirationDate}</td>
                    <td className="days-cell">{rec.daysToExpiry}</td>
                    <td className="premium-cell">${rec.premium.toFixed(2)}</td>
                    <td className="total-premium-cell">${rec.totalPremium.toFixed(2)}</td>
                    <td className="return-cell">{rec.returnOnCapital}%</td>
                    <td className="annual-return-cell">{rec.annualizedReturn}%</td>
                    <td>
                      <span className={getRiskBadgeClass(rec.riskLevel)}>
                        {rec.riskLevel}
                      </span>
                    </td>
                    <td className="recommendation-cell">{rec.recommendation}</td>
                    <td>
                      <button
                        className="view-analysis-btn"
                        onClick={() => handleRowClick(rec)}
                      >
                        View Analysis
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="options-footer-note">
            <p><strong>Real-Time Data:</strong> All stock prices, options prices, volumes, and implied volatility are fetched live from Yahoo Finance.
            Use column filters to narrow down recommendations by any criteria.</p>
            <p className="strategy-note"><strong>Sell Put:</strong> Collect premium, obligated to buy if assigned.
            <strong> Sell Call:</strong> Collect premium, obligated to sell if assigned.</p>
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
        <div className="modal-overlay" onClick={closeModal}>
          <div className="analysis-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>✕</button>

            <div className="modal-header">
              <h2>{selectedRecommendation.symbol} - {selectedRecommendation.companyName}</h2>
              <div className="modal-badges">
                <span className={`option-type-badge ${selectedRecommendation.optionType === 'Sell Put' ? 'put-badge' : 'call-badge'}`}>
                  {selectedRecommendation.optionType}
                </span>
                <span className={getRiskBadgeClass(selectedRecommendation.riskLevel)}>
                  {selectedRecommendation.riskLevel} Risk
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
                    <span className="detail-label">Option Type:</span>
                    <span className="detail-value">{selectedRecommendation.optionType}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Current Price:</span>
                    <span className="detail-value">${selectedRecommendation.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Strike Price:</span>
                    <span className="detail-value">${selectedRecommendation.strikePrice.toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Expiration Date:</span>
                    <span className="detail-value">{selectedRecommendation.expirationDate}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Days to Expiry:</span>
                    <span className="detail-value">{selectedRecommendation.daysToExpiry} days</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Premium per Share:</span>
                    <span className="detail-value">${selectedRecommendation.premium.toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Premium:</span>
                    <span className="detail-value">${selectedRecommendation.totalPremium.toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Return on Capital:</span>
                    <span className="detail-value">{selectedRecommendation.returnOnCapital}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Annualized Return:</span>
                    <span className="detail-value">{selectedRecommendation.annualizedReturn}%</span>
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
                    <span className="detail-value">{selectedRecommendation.impliedVolatility}%</span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3>Summary Analysis</h3>
                <p className="analysis-text">{selectedRecommendation.analysis.summary}</p>
              </div>

              <div className="modal-section">
                <h3>Market Trend Analysis</h3>
                <p className="analysis-text">{selectedRecommendation.analysis.marketTrend}</p>
              </div>

              <div className="modal-section">
                <h3>Economic Conditions</h3>
                <p className="analysis-text">{selectedRecommendation.analysis.economicConditions}</p>
              </div>

              <div className="modal-section">
                <h3>Technical Analysis</h3>
                <p className="analysis-text">{selectedRecommendation.analysis.technicalAnalysis}</p>
              </div>

              <div className="modal-section">
                <h3>Fundamental Analysis</h3>
                <p className="analysis-text">{selectedRecommendation.analysis.fundamentalAnalysis}</p>
              </div>

              <div className="modal-section">
                <h3>Execution Strategy</h3>
                <p className="analysis-text strategy-highlight">{selectedRecommendation.analysis.strategy}</p>
              </div>

              <div className="modal-section">
                <h3>Risk Assessment</h3>
                <p className="analysis-text">{selectedRecommendation.analysis.riskAssessment}</p>
              </div>

              <div className="modal-section recommendation-section">
                <h3>Final Recommendation</h3>
                <p className="recommendation-highlight">{selectedRecommendation.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TopCallOptions;
