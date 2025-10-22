function StockPrice({ stockData }) {
  if (!stockData) return null;

  const isPositive = stockData.change >= 0;
  const changeClass = isPositive ? 'positive' : 'negative';

  return (
    <div className="stock-price-container">
      <div className="stock-header">
        <h2 className="stock-symbol">{stockData.symbol}</h2>
        <p className="trading-day">As of {stockData.latestTradingDay}</p>
      </div>

      <div className="price-main">
        <div className="current-price">${stockData.price.toFixed(2)}</div>
        <div className={`price-change ${changeClass}`}>
          {isPositive ? '▲' : '▼'} ${Math.abs(stockData.change).toFixed(2)} ({stockData.changePercent})
        </div>
      </div>

      <div className="stock-details">
        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Open</span>
            <span className="detail-value">${stockData.open.toFixed(2)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Previous Close</span>
            <span className="detail-value">${stockData.previousClose.toFixed(2)}</span>
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">High</span>
            <span className="detail-value">${stockData.high.toFixed(2)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Low</span>
            <span className="detail-value">${stockData.low.toFixed(2)}</span>
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Volume</span>
            <span className="detail-value">{stockData.volume.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockPrice;
