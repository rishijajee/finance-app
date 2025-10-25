import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import AutomatedTestingService from '../services/automatedTestingService';

function TestingToolsDirectory() {
  const [tools, setTools] = useState([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadTestingTools();
  }, []);

  const loadTestingTools = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const service = new AutomatedTestingService();
      const data = await service.getAllTestingTools();

      console.log('Testing tools data received:', data);
      console.log('Tools count:', data.tools?.length || 0);

      setTools(data.tools || []);
      setLastUpdateTime(data.lastUpdateTime);
    } catch (err) {
      setError('Failed to load testing tools. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique categories
  const categories = ['All', ...new Set(tools.map(tool => tool.category))];

  // Filter tools by selected category
  const filteredTools = selectedCategory === 'All'
    ? tools
    : tools.filter(tool => tool.category === selectedCategory);

  return (
    <div className="app">
      <header className="app-header">
        <h1>LLM-Directory: Automated Testing Tools</h1>
        <p className="subtitle">Comprehensive Directory of {tools.length} Testing Platforms & Tools</p>

        <div className="header-actions">
          <Link to="/" className="back-btn">
            ← Back to Options Trading
          </Link>
          <button onClick={loadTestingTools} disabled={isLoading} className="refresh-btn">
            {isLoading ? 'Loading...' : '🔄 Refresh Data'}
          </button>
        </div>

        {lastUpdateTime && (
          <div className="update-info">
            <p>Last Updated: {lastUpdateTime}</p>
          </div>
        )}

        {/* Category Filter */}
        <div className="category-filter">
          <label htmlFor="category-select">Filter by Category:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category} {category === 'All' ? `(${tools.length})` : `(${tools.filter(t => t.category === category).length})`}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="app-main">
        {isLoading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading testing tools directory...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p>{error}</p>
            <button onClick={loadTestingTools}>Try Again</button>
          </div>
        )}

        {!isLoading && !error && filteredTools.length > 0 && (
          <div className="single-table-wrapper">
            <h2 className="table-title">
              {selectedCategory === 'All'
                ? `All Testing Tools (${filteredTools.length} Total)`
                : `${selectedCategory} (${filteredTools.length} Tools)`}
            </h2>
            <p className="table-subtitle">From unit testing to performance testing and beyond</p>

            <div className="table-container">
              <table className="recommendations-table testing-tools-table">
                <thead>
                  <tr>
                    <th>Tool Name</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Languages</th>
                    <th>Platforms</th>
                    <th>Best For</th>
                    <th>Pricing</th>
                    <th>Key Features</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTools.map((tool, index) => (
                    <tr key={index}>
                      <td className="tool-name-col">
                        <strong>{tool.toolName}</strong>
                      </td>
                      <td className="category-col">
                        <span className={`category-badge ${tool.category.toLowerCase().replace(/[& ]/g, '-')}`}>
                          {tool.category}
                        </span>
                      </td>
                      <td className="description-col">{tool.description}</td>
                      <td className="languages-col">{tool.supportedLanguages}</td>
                      <td className="platforms-col">{tool.platforms}</td>
                      <td className="bestfor-col">{tool.bestFor}</td>
                      <td className="pricing-col">
                        <span className={`pricing-badge ${tool.pricing.toLowerCase().includes('free') ? 'pricing-free' : 'pricing-paid'}`}>
                          {tool.pricing}
                        </span>
                      </td>
                      <td className="features-col">{tool.features}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && !error && filteredTools.length === 0 && (
          <div className="no-data">
            <p>No testing tools available for the selected category</p>
            <button onClick={() => setSelectedCategory('All')} className="refresh-btn">Show All</button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Comprehensive directory of automated testing tools and platforms</p>
      </footer>
    </div>
  );
}

export default TestingToolsDirectory;
