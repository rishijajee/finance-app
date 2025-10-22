function OptionsTable({ optionsData }) {
  if (!optionsData) return null;

  const renderOptionsTable = (options, type) => {
    return (
      <div className="options-section">
        <h3 className="options-type-header">{type}</h3>
        <div className="table-wrapper">
          <table className="options-table">
            <thead>
              <tr>
                <th>Strike Price</th>
                <th>Premium</th>
                <th>Bid</th>
                <th>Ask</th>
                <th>Volume</th>
                <th>Open Interest</th>
                <th>Implied Volatility</th>
              </tr>
            </thead>
            <tbody>
              {options.map((option, index) => {
                return (
                  <tr key={index} className="option-row">
                    <td className="strike-cell">${option.strikePrice.toFixed(2)}</td>
                    <td className="premium-cell">${option.premium.toFixed(2)}</td>
                    <td className="price-cell">{option.bid ? `$${option.bid.toFixed(2)}` : 'N/A'}</td>
                    <td className="price-cell">{option.ask ? `$${option.ask.toFixed(2)}` : 'N/A'}</td>
                    <td className="volume-cell">{option.volume.toLocaleString()}</td>
                    <td className="oi-cell">{option.openInterest.toLocaleString()}</td>
                    <td className="iv-cell">{option.impliedVolatility}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="options-container">
      <div className="options-header">
        <h2>Options Chain for {optionsData.symbol}</h2>
        {optionsData.expirationDate && (
          <p className="expiration-info">Expiration Date: {optionsData.expirationDate}</p>
        )}
        {optionsData.note && <p className="options-note">{optionsData.note}</p>}
      </div>

      <div className="options-grid">
        {renderOptionsTable(optionsData.calls, 'Call Options')}
        {renderOptionsTable(optionsData.puts, 'Put Options')}
      </div>
    </div>
  );
}

export default OptionsTable;
