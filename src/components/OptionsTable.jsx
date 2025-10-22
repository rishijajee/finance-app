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
                <th>Strike</th>
                <th>Last Price</th>
                <th>Change</th>
                <th>Premium</th>
                <th>Volume</th>
                <th>Open Interest</th>
              </tr>
            </thead>
            <tbody>
              {options.map((option, index) => {
                const isPositiveChange = option.change.startsWith('+');
                return (
                  <tr key={index} className="option-row">
                    <td className="strike-cell">${option.strike.toFixed(2)}</td>
                    <td className="price-cell">${option.lastPrice.toFixed(2)}</td>
                    <td className={`change-cell ${isPositiveChange ? 'positive' : 'negative'}`}>
                      {option.change}
                    </td>
                    <td className="premium-cell">${option.premium.toFixed(2)}</td>
                    <td className="volume-cell">{option.volume.toLocaleString()}</td>
                    <td className="oi-cell">{option.openInterest.toLocaleString()}</td>
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
        <h2>Top Options for {optionsData.symbol}</h2>
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
