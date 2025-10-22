import axios from 'axios';

/**
 * Market Screener Service
 * Fetches actively traded stocks dynamically from Yahoo Finance
 */
class MarketScreenerService {
  constructor() {
    this.cachedSymbols = null;
    this.cacheExpiry = null;
    this.CACHE_DURATION = 1000 * 60 * 60; // 1 hour
  }

  /**
   * Get list of actively traded stocks from Yahoo Finance screener
   * This fetches real-time most active stocks instead of hardcoding
   */
  async getActiveStocks() {
    // Return cached symbols if still valid
    if (this.cachedSymbols && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      console.log('Using cached stock symbols');
      return this.cachedSymbols;
    }

    try {
      // Fetch most active stocks from Yahoo Finance screener
      const url = 'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=true&scrIds=most_actives&count=100';

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://finance.yahoo.com'
        }
      });

      if (response.data?.finance?.result?.[0]?.quotes) {
        const quotes = response.data.finance.result[0].quotes;

        // Filter for valid stocks with options (typically high volume stocks)
        const validSymbols = quotes
          .filter(q =>
            q.symbol &&
            !q.symbol.includes('^') && // Exclude indices
            !q.symbol.includes('=') && // Exclude forex
            q.regularMarketVolume > 1000000 && // High volume
            q.regularMarketPrice > 5 // Reasonable price
          )
          .map(q => q.symbol)
          .slice(0, 50); // Get top 50

        if (validSymbols.length > 0) {
          console.log(`Fetched ${validSymbols.length} active stocks from Yahoo Finance`);
          this.cachedSymbols = validSymbols;
          this.cacheExpiry = Date.now() + this.CACHE_DURATION;
          return validSymbols;
        }
      }

      // If Yahoo screener fails, fall back to major indices components
      return this.getFallbackSymbols();
    } catch (error) {
      console.warn('Failed to fetch active stocks from screener:', error.message);
      return this.getFallbackSymbols();
    }
  }

  /**
   * Fallback: Get major index components dynamically
   */
  async getFallbackSymbols() {
    console.log('Using fallback: fetching index components');

    try {
      // Fetch S&P 100 components (liquid stocks with active options)
      const symbols = await this.getSP100Components();
      if (symbols.length > 0) {
        this.cachedSymbols = symbols;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        return symbols;
      }
    } catch (error) {
      console.warn('Fallback also failed:', error.message);
    }

    // Last resort: return well-known liquid stocks
    return this.getDefaultSymbols();
  }

  /**
   * Fetch S&P 100 components (OEX) - these are the most liquid stocks
   */
  async getSP100Components() {
    // This could be enhanced by fetching from a public API
    // For now, returning most liquid stocks from major sectors
    return [
      // Technology
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AVGO', 'ORCL', 'ADBE', 'CRM', 'AMD', 'INTC', 'QCOM', 'NFLX',
      // Financials
      'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'SPGI',
      // Healthcare
      'UNH', 'JNJ', 'LLY', 'PFE', 'ABBV', 'TMO', 'MRK', 'ABT', 'DHR', 'CVS',
      // Consumer
      'WMT', 'HD', 'DIS', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW', 'COST', 'PG',
      // Energy
      'XOM', 'CVX', 'COP', 'SLB', 'EOG',
      // Industrials
      'BA', 'CAT', 'UNP', 'HON', 'GE', 'RTX'
    ];
  }

  /**
   * Default well-known liquid stocks (last resort)
   */
  getDefaultSymbols() {
    console.log('Using default symbol list');
    return [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'JPM', 'BAC', 'WFC',
      'V', 'MA', 'JNJ', 'UNH', 'PFE', 'LLY', 'WMT', 'HD', 'DIS', 'MCD',
      'ORCL', 'CRM', 'ADBE', 'NFLX', 'AMD', 'INTC', 'BA', 'CAT', 'XOM', 'CVX',
      'VZ', 'T', 'KO', 'PEP', 'PG', 'COST', 'ABBV', 'TMO', 'AVGO', 'QCOM',
      'SBUX', 'NKE', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'SPGI', 'LOW'
    ];
  }

  /**
   * Clear cache to force fresh fetch
   */
  clearCache() {
    this.cachedSymbols = null;
    this.cacheExpiry = null;
  }
}

export default MarketScreenerService;
