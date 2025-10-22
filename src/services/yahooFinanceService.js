import axios from 'axios';

class YahooFinanceService {
  /**
   * Get real-time stock quote from Yahoo Finance
   * @param {string} symbol - Stock symbol (e.g., 'AAPL', 'GOOGL')
   * @returns {Promise} Stock quote data
   */
  async getStockQuote(symbol) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1d&range=1d`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        }
      });

      if (!response.data || !response.data.chart || !response.data.chart.result) {
        throw new Error('No data found for this symbol');
      }

      const result = response.data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];

      return {
        symbol: meta.symbol,
        price: meta.regularMarketPrice || meta.previousClose,
        change: meta.regularMarketPrice - meta.chartPreviousClose,
        changePercent: (((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100).toFixed(2) + '%',
        volume: quote.volume[quote.volume.length - 1] || 0,
        latestTradingDay: new Date(meta.regularMarketTime * 1000).toLocaleDateString(),
        previousClose: meta.chartPreviousClose,
        open: quote.open[0] || meta.regularMarketPrice,
        high: quote.high[0] || meta.regularMarketPrice,
        low: quote.low[0] || meta.regularMarketPrice,
      };
    } catch (error) {
      console.error('Yahoo Finance API error:', error);
      throw new Error('Unable to fetch stock data. Please check the symbol and try again.');
    }
  }

  /**
   * Get real-time options data from Yahoo Finance
   * @param {string} symbol - Stock symbol
   * @returns {Promise} Real options data from Yahoo Finance API
   */
  async getTopOptions(symbol) {
    try {
      const optionsUrl = `https://query2.finance.yahoo.com/v7/finance/options/${symbol.toUpperCase()}`;

      const response = await axios.get(optionsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        }
      });

      if (!response.data || !response.data.optionChain) {
        console.warn('Yahoo Finance options API failed, using fallback data');
        return this.getFallbackOptions(symbol);
      }

      const optionChain = response.data.optionChain.result[0];
      const options = optionChain.options[0];

      // Process calls
      const calls = (options.calls || []).slice(0, 5).map(call => ({
        strikePrice: call.strike,
        premium: call.lastPrice || call.ask,
        volume: call.volume || 0,
        openInterest: call.openInterest || 0,
        impliedVolatility: ((call.impliedVolatility || 0) * 100).toFixed(1),
        bid: call.bid,
        ask: call.ask,
        change: call.change,
        percentChange: call.percentChange,
      }));

      // Process puts
      const puts = (options.puts || []).slice(0, 5).map(put => ({
        strikePrice: put.strike,
        premium: put.lastPrice || put.ask,
        volume: put.volume || 0,
        openInterest: put.openInterest || 0,
        impliedVolatility: ((put.impliedVolatility || 0) * 100).toFixed(1),
        bid: put.bid,
        ask: put.ask,
        change: put.change,
        percentChange: put.percentChange,
      }));

      return {
        symbol: symbol.toUpperCase(),
        calls: calls.length > 0 ? calls : this.generateCallOptions(optionChain.quote.regularMarketPrice),
        puts: puts.length > 0 ? puts : this.generatePutOptions(optionChain.quote.regularMarketPrice),
        expirationDate: options.expirationDate ? new Date(options.expirationDate * 1000).toLocaleDateString() : 'N/A',
        note: calls.length > 0 ? 'Real-time options data from Yahoo Finance' : 'Note: Options data is simulated due to API limitations.',
      };
    } catch (error) {
      console.warn('Yahoo Finance options API error:', error.message);
      return this.getFallbackOptions(symbol);
    }
  }

  /**
   * Get fallback options data when API fails
   * @param {string} symbol - Stock symbol
   * @returns {Promise} Fallback options data
   */
  async getFallbackOptions(symbol) {
    try {
      const stockData = await this.getStockQuote(symbol);
      const stockPrice = stockData.price;

      return {
        symbol: symbol.toUpperCase(),
        calls: this.generateCallOptions(stockPrice),
        puts: this.generatePutOptions(stockPrice),
        note: 'Note: Options data is simulated. Unable to fetch real-time data due to API restrictions.',
      };
    } catch (error) {
      throw new Error('Unable to fetch stock or options data');
    }
  }

  generateCallOptions(basePrice) {
    const calls = [];
    for (let i = 0; i < 5; i++) {
      const strike = Math.round((basePrice + 5 + i * 5) * 100) / 100;
      const premium = Math.max(0.5, (basePrice - strike + 10) * Math.random());
      calls.push({
        strikePrice: strike,
        premium: premium,
        volume: Math.floor(Math.random() * 3000) + 500,
        openInterest: Math.floor(Math.random() * 5000) + 1000,
        impliedVolatility: (25 + Math.random() * 30).toFixed(1),
      });
    }
    return calls;
  }

  generatePutOptions(basePrice) {
    const puts = [];
    for (let i = 0; i < 5; i++) {
      const strike = Math.round((basePrice - 5 - i * 5) * 100) / 100;
      const premium = Math.max(0.5, (strike - basePrice + 10) * Math.random());
      puts.push({
        strikePrice: strike,
        premium: premium,
        volume: Math.floor(Math.random() * 3000) + 500,
        openInterest: Math.floor(Math.random() * 5000) + 1000,
        impliedVolatility: (25 + Math.random() * 30).toFixed(1),
      });
    }
    return puts;
  }
}

export default YahooFinanceService;
