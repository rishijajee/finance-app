import axios from 'axios';
import MarketScreenerService from './marketScreenerService.js';

/**
 * Simplified Options Service
 * Returns 10 stocks with BEST recommendation each (1 of 6 strategies)
 */
class SimplifiedOptionsService {
  constructor() {
    this.marketScreener = new MarketScreenerService();
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://finance.yahoo.com'
    };
  }

  /**
   * Get top 10 stock recommendations with best strategy each
   */
  async getTop10Recommendations() {
    console.log('Fetching actively traded stocks...');

    // Get active stocks dynamically (NOT hardcoded)
    const allSymbols = await this.marketScreener.getActiveStocks();
    console.log(`Found ${allSymbols.length} active stocks, analyzing...`);

    const recommendations = [];

    // Try to get 10 valid recommendations
    for (let i = 0; i < allSymbols.length && recommendations.length < 10; i++) {
      const symbol = allSymbols[i];

      try {
        const rec = await this.analyzeSingleStock(symbol);
        if (rec) {
          recommendations.push(rec);
          console.log(`✓ ${symbol}: ${rec.optionRecommended}`);
        }
      } catch (error) {
        console.warn(`✗ ${symbol}: ${error.message}`);
      }

      // Small delay to avoid rate limiting
      if (recommendations.length < 10 && i < allSymbols.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`Generated ${recommendations.length} recommendations`);
    return recommendations;
  }

  /**
   * Analyze single stock and return BEST recommendation
   */
  async analyzeSingleStock(symbol) {
    try {
      // 1. Get stock price
      const stockPrice = await this.getStockPrice(symbol);
      if (!stockPrice) return null;

      // 2. Get options chain
      const optionsData = await this.getOptionsChain(symbol);
      if (!optionsData || !optionsData.options || !optionsData.expirationDate) {
        return null;
      }

      // 3. Analyze all 6 strategies and pick the best one
      const strategies = [];

      if (optionsData.puts.length > 0) {
        const sellPut = this.analyzeSellPut(symbol, stockPrice, optionsData.puts, optionsData.expirationDate);
        if (sellPut) strategies.push(sellPut);

        const buyPut = this.analyzeBuyPut(symbol, stockPrice, optionsData.puts, optionsData.expirationDate);
        if (buyPut) strategies.push(buyPut);
      }

      if (optionsData.calls.length > 0) {
        const sellCall = this.analyzeSellCall(symbol, stockPrice, optionsData.calls, optionsData.expirationDate);
        if (sellCall) strategies.push(sellCall);

        const buyCall = this.analyzeBuyCall(symbol, stockPrice, optionsData.calls, optionsData.expirationDate);
        if (buyCall) strategies.push(buyCall);

        const coveredCall = this.analyzeCoveredCall(symbol, stockPrice, optionsData.calls, optionsData.expirationDate);
        if (coveredCall) strategies.push(coveredCall);

        if (optionsData.calls.length >= 2) {
          const spread = this.analyzeBullCallSpread(symbol, stockPrice, optionsData.calls, optionsData.expirationDate);
          if (spread) strategies.push(spread);
        }
      }

      // Pick the best strategy based on score
      if (strategies.length === 0) return null;

      strategies.sort((a, b) => b.score - a.score);
      return strategies[0];

    } catch (error) {
      console.warn(`Error analyzing ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Get current stock price
   */
  async getStockPrice(symbol) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      const response = await axios.get(url, { headers: this.headers });

      const result = response.data?.chart?.result?.[0];
      if (!result) return null;

      return result.meta.regularMarketPrice || result.meta.previousClose;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get options chain with VALID expiration date
   */
  async getOptionsChain(symbol) {
    try {
      const url = `https://query2.finance.yahoo.com/v7/finance/options/${symbol}`;
      const response = await axios.get(url, { headers: this.headers });

      const optionChain = response.data?.optionChain?.result?.[0];
      if (!optionChain || !optionChain.options || !optionChain.options[0]) {
        return null;
      }

      const options = optionChain.options[0];
      const expirationTimestamp = optionChain.expirationDates?.[0];

      if (!expirationTimestamp) return null;

      // Convert timestamp to date
      const expirationDate = new Date(expirationTimestamp * 1000);

      // Verify date is valid and in the future
      const today = new Date();
      const daysToExpiry = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

      if (daysToExpiry <= 0 || daysToExpiry > 365) {
        console.warn(`${symbol}: Invalid expiration (${daysToExpiry} days)`);
        return null;
      }

      return {
        calls: options.calls || [],
        puts: options.puts || [],
        expirationDate: expirationDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        daysToExpiry
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Analyze Sell Put strategy
   */
  analyzeSellPut(symbol, stockPrice, puts, expirationDate) {
    const viable = puts.filter(p =>
      p.strike < stockPrice &&
      p.strike > stockPrice * 0.90 &&
      p.volume > 10 &&
      p.lastPrice > 0.5
    );

    if (viable.length === 0) return null;

    const best = viable.reduce((a, b) =>
      (b.lastPrice * b.volume) > (a.lastPrice * a.volume) ? b : a
    );

    const premium = best.lastPrice;
    const returnPct = ((premium / best.strike) * 100).toFixed(2);

    return {
      stockSymbol: symbol,
      currentPrice: stockPrice.toFixed(2),
      optionRecommended: 'Sell Put',
      strikePrice: best.strike.toFixed(2),
      expirationDate: expirationDate,
      analysis: `Collect $${(premium * 100).toFixed(2)} premium. Obligated to buy at $${best.strike.toFixed(2)} if assigned. Return: ${returnPct}%. Good for bullish/neutral outlook.`,
      score: parseFloat(returnPct) * Math.log(best.volume + 1)
    };
  }

  /**
   * Analyze Sell Call strategy
   */
  analyzeSellCall(symbol, stockPrice, calls, expirationDate) {
    const viable = calls.filter(c =>
      c.strike > stockPrice &&
      c.strike < stockPrice * 1.10 &&
      c.volume > 10 &&
      c.lastPrice > 0.5
    );

    if (viable.length === 0) return null;

    const best = viable.reduce((a, b) =>
      (b.lastPrice * b.volume) > (a.lastPrice * a.volume) ? b : a
    );

    const premium = best.lastPrice;
    const returnPct = ((premium / stockPrice) * 100).toFixed(2);

    return {
      stockSymbol: symbol,
      currentPrice: stockPrice.toFixed(2),
      optionRecommended: 'Sell Call',
      strikePrice: best.strike.toFixed(2),
      expirationDate: expirationDate,
      analysis: `Collect $${(premium * 100).toFixed(2)} premium. Obligated to sell at $${best.strike.toFixed(2)} if assigned. Return: ${returnPct}%. High risk - for bearish outlook.`,
      score: parseFloat(returnPct) * Math.log(best.volume + 1) * 0.7 // Lower score due to risk
    };
  }

  /**
   * Analyze Buy Call strategy
   */
  analyzeBuyCall(symbol, stockPrice, calls, expirationDate) {
    const viable = calls.filter(c =>
      c.strike >= stockPrice * 0.98 &&
      c.strike <= stockPrice * 1.05 &&
      c.volume > 10 &&
      c.lastPrice > 1
    );

    if (viable.length === 0) return null;

    const best = viable.reduce((a, b) =>
      (b.volume / b.lastPrice) > (a.volume / a.lastPrice) ? b : a
    );

    const cost = best.lastPrice;
    const breakEven = best.strike + cost;
    const potentialReturn = ((stockPrice * 1.10 - best.strike - cost) / cost * 100).toFixed(2);

    return {
      stockSymbol: symbol,
      currentPrice: stockPrice.toFixed(2),
      optionRecommended: 'Buy Call',
      strikePrice: best.strike.toFixed(2),
      expirationDate: expirationDate,
      analysis: `Pay $${(cost * 100).toFixed(2)}. Break-even: $${breakEven.toFixed(2)}. Potential return: ${potentialReturn}%. Bullish bet with limited risk.`,
      score: parseFloat(potentialReturn) * Math.log(best.volume + 1) * 0.8
    };
  }

  /**
   * Analyze Buy Put strategy
   */
  analyzeBuyPut(symbol, stockPrice, puts, expirationDate) {
    const viable = puts.filter(p =>
      p.strike >= stockPrice * 0.95 &&
      p.strike <= stockPrice * 1.02 &&
      p.volume > 10 &&
      p.lastPrice > 1
    );

    if (viable.length === 0) return null;

    const best = viable.reduce((a, b) =>
      (b.volume / b.lastPrice) > (a.volume / a.lastPrice) ? b : a
    );

    const cost = best.lastPrice;
    const breakEven = best.strike - cost;
    const potentialReturn = ((best.strike - stockPrice * 0.90 - cost) / cost * 100).toFixed(2);

    return {
      stockSymbol: symbol,
      currentPrice: stockPrice.toFixed(2),
      optionRecommended: 'Buy Put',
      strikePrice: best.strike.toFixed(2),
      expirationDate: expirationDate,
      analysis: `Pay $${(cost * 100).toFixed(2)}. Break-even: $${breakEven.toFixed(2)}. Profits if stock falls. Bearish/hedge play.`,
      score: parseFloat(potentialReturn) * Math.log(best.volume + 1) * 0.8
    };
  }

  /**
   * Analyze Covered Call strategy
   */
  analyzeCoveredCall(symbol, stockPrice, calls, expirationDate) {
    const viable = calls.filter(c =>
      c.strike > stockPrice &&
      c.strike < stockPrice * 1.08 &&
      c.volume > 10 &&
      c.lastPrice > 0.3
    );

    if (viable.length === 0) return null;

    const best = viable.reduce((a, b) =>
      (b.lastPrice * b.volume) > (a.lastPrice * a.volume) ? b : a
    );

    const premium = best.lastPrice;
    const returnPct = ((premium / stockPrice) * 100).toFixed(2);

    return {
      stockSymbol: symbol,
      currentPrice: stockPrice.toFixed(2),
      optionRecommended: 'Covered Call',
      strikePrice: best.strike.toFixed(2),
      expirationDate: expirationDate,
      analysis: `Own 100 shares, collect $${(premium * 100).toFixed(2)} premium. Income generation. Return: ${returnPct}% on stock value.`,
      score: parseFloat(returnPct) * Math.log(best.volume + 1) * 0.9
    };
  }

  /**
   * Analyze Bull Call Spread strategy
   */
  analyzeBullCallSpread(symbol, stockPrice, calls, expirationDate) {
    const atmCalls = calls.filter(c =>
      c.strike >= stockPrice * 0.98 &&
      c.strike <= stockPrice * 1.02 &&
      c.volume > 5
    );

    const otmCalls = calls.filter(c =>
      c.strike > stockPrice * 1.02 &&
      c.strike < stockPrice * 1.10 &&
      c.volume > 5
    );

    if (atmCalls.length === 0 || otmCalls.length === 0) return null;

    const buyCall = atmCalls[0];
    const sellCall = otmCalls[0];

    const netCost = buyCall.lastPrice - sellCall.lastPrice;
    if (netCost <= 0) return null;

    const maxProfit = sellCall.strike - buyCall.strike - netCost;
    const returnPct = ((maxProfit / netCost) * 100).toFixed(2);

    return {
      stockSymbol: symbol,
      currentPrice: stockPrice.toFixed(2),
      optionRecommended: 'Bull Call Spread',
      strikePrice: `${buyCall.strike.toFixed(2)}/${sellCall.strike.toFixed(2)}`,
      expirationDate: expirationDate,
      analysis: `Buy $${buyCall.strike.toFixed(2)}, sell $${sellCall.strike.toFixed(2)} calls. Net cost: $${(netCost * 100).toFixed(2)}. Max profit: $${(maxProfit * 100).toFixed(2)}. Return: ${returnPct}%.`,
      score: parseFloat(returnPct) * Math.log(Math.min(buyCall.volume, sellCall.volume) + 1) * 0.85
    };
  }
}

export default SimplifiedOptionsService;
