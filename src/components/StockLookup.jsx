import { useState } from 'react';

function StockLookup({ onSearch, isLoading }) {
  const [symbol, setSymbol] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (symbol.trim()) {
      onSearch(symbol.trim().toUpperCase());
    }
  };

  return (
    <div className="stock-lookup">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Enter stock symbol (e.g., AAPL, GOOGL, MSFT)"
            className="stock-input"
            disabled={isLoading}
          />
          <button type="submit" className="search-button" disabled={isLoading || !symbol.trim()}>
            {isLoading ? 'Loading...' : 'Get Quote'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default StockLookup;
