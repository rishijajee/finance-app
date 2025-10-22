import axios from 'axios';

const BASE_URL = 'https://www.alphavantage.co/query';

class AlphaVantageService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Get real-time stock quote
   * @param {string} symbol - Stock symbol (e.g., 'AAPL', 'GOOGL')
   * @returns {Promise} Stock quote data
   */
  async getStockQuote(symbol) {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol.toUpperCase(),
          apikey: this.apiKey,
        },
      });

      if (response.data['Note']) {
        throw new Error('API rate limit exceeded. Please wait a minute and try again.');
      }

      if (response.data['Error Message']) {
        throw new Error('Invalid stock symbol or API error');
      }

      const quote = response.data['Global Quote'];

      if (!quote || Object.keys(quote).length === 0) {
        throw new Error('No data found for this symbol');
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'],
        volume: parseInt(quote['06. volume']),
        latestTradingDay: quote['07. latest trading day'],
        previousClose: parseFloat(quote['08. previous close']),
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
      };
    } catch (error) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.status}`);
      }
      throw error;
    }
  }

  /**
   * Get top options data (calls and puts)
   * Note: Alpha Vantage doesn't have a direct options endpoint in the free tier
   * This is a placeholder that returns mock data structure
   * For real options data, you'd need a different API or paid tier
   */
  async getTopOptions(symbol) {
    // Alpha Vantage free tier doesn't support options data
    // This returns a mock structure to demonstrate the table format
    // In production, you'd use a different API like Tradier, CBOE, or paid Alpha Vantage

    return {
      symbol: symbol.toUpperCase(),
      calls: [
        { strike: 180, premium: 5.20, volume: 1250, openInterest: 3500, lastPrice: 5.15, change: '+0.25' },
        { strike: 185, premium: 3.80, volume: 980, openInterest: 2800, lastPrice: 3.75, change: '+0.15' },
        { strike: 190, premium: 2.50, volume: 1500, openInterest: 4200, lastPrice: 2.45, change: '-0.10' },
        { strike: 195, premium: 1.40, volume: 750, openInterest: 1900, lastPrice: 1.38, change: '+0.05' },
        { strike: 200, premium: 0.75, volume: 2100, openInterest: 5600, lastPrice: 0.72, change: '-0.08' },
      ],
      puts: [
        { strike: 180, premium: 2.10, volume: 890, openInterest: 2400, lastPrice: 2.08, change: '-0.12' },
        { strike: 175, premium: 3.40, volume: 1120, openInterest: 3100, lastPrice: 3.42, change: '+0.18' },
        { strike: 170, premium: 5.20, volume: 1450, openInterest: 3900, lastPrice: 5.25, change: '+0.30' },
        { strike: 165, premium: 7.50, volume: 680, openInterest: 1800, lastPrice: 7.55, change: '+0.22' },
        { strike: 160, premium: 10.20, volume: 920, openInterest: 2500, lastPrice: 10.25, change: '+0.35' },
      ],
      note: 'Note: Options data is simulated. Alpha Vantage free tier does not include options chains.',
    };
  }
}

export default AlphaVantageService;
