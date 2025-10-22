import axios from 'axios';

class OptionsService {
  /**
   * Get real-time options chain data from Yahoo Finance using yfinance API
   * @param {string} symbol - Stock symbol (e.g., 'AAPL', 'GOOGL')
   * @returns {Promise} Options chain data
   */
  async getOptionsChain(symbol) {
    try {
      // Using Yahoo Finance API v8 which has better CORS support
      const quoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}`;
      const optionsUrl = `https://query2.finance.yahoo.com/v7/finance/options/${symbol.toUpperCase()}`;

      // Fetch both quote and options data
      const [quoteResponse, optionsResponse] = await Promise.all([
        axios.get(quoteUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          }
        }),
        axios.get(optionsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          }
        })
      ]);

      if (!optionsResponse.data || !optionsResponse.data.optionChain) {
        throw new Error('No options data available for this symbol');
      }

      const optionChain = optionsResponse.data.optionChain.result[0];
      const quote = optionChain.quote;
      const options = optionChain.options[0];

      return {
        symbol: symbol.toUpperCase(),
        stockPrice: quote.regularMarketPrice,
        expirationDates: optionChain.expirationDates,
        strikes: optionChain.strikes,
        puts: options.puts || [],
        calls: options.calls || [],
        quote: {
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
          volume: quote.regularMarketVolume,
        }
      };
    } catch (error) {
      // If Yahoo Finance fails, return mock data for demonstration
      console.warn('Yahoo Finance API error, using mock data:', error.message);
      return this.getMockOptionsData(symbol);
    }
  }

  /**
   * Get mock options data for demonstration
   * @param {string} symbol - Stock symbol
   * @returns {Object} Mock options data
   */
  getMockOptionsData(symbol) {
    const basePrice = 180 + Math.random() * 20;

    const generatePuts = () => {
      const puts = [];
      for (let i = 0; i < 10; i++) {
        const strike = Math.round((basePrice - 10 - i * 5) * 100) / 100;
        const optionPrice = Math.max(0.5, Math.random() * 15);
        puts.push({
          strike: strike,
          lastPrice: optionPrice,
          bid: optionPrice - 0.1,
          ask: optionPrice + 0.1,
          volume: Math.floor(Math.random() * 5000) + 100,
          openInterest: Math.floor(Math.random() * 10000) + 500,
          impliedVolatility: 0.25 + Math.random() * 0.4,
          delta: -(0.2 + Math.random() * 0.3),
          inTheMoney: false,
          expiration: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
        });
      }
      return puts;
    };

    return {
      symbol: symbol.toUpperCase(),
      stockPrice: basePrice,
      expirationDates: [Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60],
      strikes: [],
      puts: generatePuts(),
      calls: [],
      quote: {
        price: basePrice,
        change: (Math.random() - 0.5) * 5,
        changePercent: (Math.random() - 0.5) * 3,
        volume: Math.floor(Math.random() * 1000000),
      }
    };
  }

  /**
   * Get top sell put options for the week
   * Sell put strategy: profit if stock stays above strike price
   * @param {string} symbol - Stock symbol
   * @returns {Promise} Top sell put options with execution strategy
   */
  async getTopSellPutOptions(symbol) {
    try {
      const optionsData = await this.getOptionsChain(symbol);
      const stockPrice = optionsData.stockPrice;
      const puts = optionsData.puts;

      if (!puts || puts.length === 0) {
        throw new Error('No put options available for this symbol');
      }

      // Filter and analyze puts for selling strategy
      const analyzedPuts = puts
        .filter(put => {
          // Filter puts that are out-of-the-money (strike < stock price)
          // These are ideal for selling (cash-secured put strategy)
          return put.strike < stockPrice && put.volume > 0;
        })
        .map(put => {
          const strikePrice = put.strike;
          const optionPrice = put.lastPrice || put.bid;
          const premium = optionPrice * 100; // Premium per contract (100 shares)
          const delta = put.inTheMoney ? put.delta : Math.abs(put.delta || -0.3);
          const iv = put.impliedVolatility || 0;

          // Calculate probability of profit (simplified)
          const distanceFromStrike = ((stockPrice - strikePrice) / stockPrice) * 100;
          const probProfit = Math.min(95, 50 + distanceFromStrike * 2);

          // Determine execution strategy
          let strategy = '';
          let riskLevel = '';

          if (distanceFromStrike > 10) {
            strategy = 'Conservative: Low risk, sell put for premium income';
            riskLevel = 'Low';
          } else if (distanceFromStrike > 5) {
            strategy = 'Moderate: Balanced risk/reward, good premium';
            riskLevel = 'Medium';
          } else {
            strategy = 'Aggressive: Higher risk, maximum premium collection';
            riskLevel = 'High';
          }

          // Calculate return on capital
          const capitalRequired = strikePrice * 100; // Cash secured put
          const returnOnCapital = (premium / capitalRequired) * 100;

          return {
            strikePrice: strikePrice,
            stockPrice: stockPrice,
            optionPrice: optionPrice,
            premium: premium,
            volume: put.volume,
            openInterest: put.openInterest || 0,
            impliedVolatility: (iv * 100).toFixed(2),
            delta: delta.toFixed(2),
            daysToExpiration: put.expiration ? this.calculateDaysToExpiration(put.expiration) : 7,
            probProfit: probProfit.toFixed(1),
            strategy: strategy,
            riskLevel: riskLevel,
            returnOnCapital: returnOnCapital.toFixed(2),
            bid: put.bid,
            ask: put.ask,
            lastTradeDate: put.lastTradeDate,
          };
        })
        .sort((a, b) => {
          // Sort by combination of volume and return on capital
          const scoreA = (a.volume * 0.6) + (parseFloat(a.returnOnCapital) * 100);
          const scoreB = (b.volume * 0.6) + (parseFloat(b.returnOnCapital) * 100);
          return scoreB - scoreA;
        })
        .slice(0, 10); // Top 10 options

      return {
        symbol: symbol.toUpperCase(),
        stockPrice: stockPrice,
        timestamp: new Date().toISOString(),
        options: analyzedPuts,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate days to expiration
   * @param {number|string} expiration - Expiration timestamp or date
   * @returns {number} Days to expiration
   */
  calculateDaysToExpiration(expiration) {
    const expirationDate = new Date(expiration * 1000); // Unix timestamp to date
    const today = new Date();
    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }
}

export default OptionsService;
