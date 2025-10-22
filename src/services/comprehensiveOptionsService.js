import axios from 'axios';
import MarketScreenerService from './marketScreenerService.js';

/**
 * Comprehensive Options Service
 * Fetches real-time options data and generates 6 different strategy recommendations
 * NO HARDCODED SYMBOLS - fetches actively traded stocks dynamically
 */
class ComprehensiveOptionsService {
  constructor() {
    this.symbols = null; // Will be fetched dynamically
    this.marketScreener = new MarketScreenerService();
  }

  /**
   * Fetch real-time stock quote and options chain
   */
  async fetchRealTimeData(symbol) {
    try {
      // Fetch stock price
      const quoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      const quoteResponse = await axios.get(quoteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://finance.yahoo.com'
        }
      });

      if (!quoteResponse.data?.chart?.result?.[0]) {
        return null;
      }

      const result = quoteResponse.data.chart.result[0];
      const meta = result.meta;
      const stockPrice = meta.regularMarketPrice || meta.previousClose;

      // Fetch options chain
      const optionsUrl = `https://query2.finance.yahoo.com/v7/finance/options/${symbol}`;
      const optionsResponse = await axios.get(optionsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://finance.yahoo.com'
        }
      });

      if (!optionsResponse.data?.optionChain?.result?.[0]) {
        return { symbol, stockPrice, options: null, expirations: [] };
      }

      const optionChain = optionsResponse.data.optionChain.result[0];

      return {
        symbol,
        stockPrice,
        options: optionChain.options || [],
        expirations: optionChain.expirationDates || []
      };
    } catch (error) {
      console.warn(`Failed to fetch ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Generate all strategy recommendations with real-time data
   * Dynamically fetches active stocks - NO HARDCODING
   */
  async generateAllRecommendations() {
    const allRecommendations = [];

    // Fetch active stocks dynamically from Yahoo Finance screener
    console.log('Fetching actively traded stocks from Yahoo Finance...');
    this.symbols = await this.marketScreener.getActiveStocks();
    console.log(`Analyzing ${this.symbols.length} stocks for options strategies...`);

    // Process in batches to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < this.symbols.length; i += batchSize) {
      const batch = this.symbols.slice(i, i + batchSize);
      const promises = batch.map(symbol => this.processSymbol(symbol));
      const results = await Promise.all(promises);

      results.forEach(recs => {
        if (recs && recs.length > 0) {
          allRecommendations.push(...recs);
        }
      });

      // Small delay between batches to respect rate limits
      if (i + batchSize < this.symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Sort by score (best recommendations first)
    allRecommendations.sort((a, b) => b.score - a.score);
    allRecommendations.forEach((rec, idx) => rec.rank = idx + 1);

    console.log(`Generated ${allRecommendations.length} real-time recommendations`);
    return allRecommendations;
  }

  /**
   * Process single symbol and generate all 6 strategies
   */
  async processSymbol(symbol) {
    const data = await this.fetchRealTimeData(symbol);
    if (!data || !data.options || data.options.length === 0) {
      return [];
    }

    const recommendations = [];
    const { stockPrice, options, expirations } = data;

    // Use first expiration date (nearest)
    const optionData = options[0];
    if (!optionData || (!optionData.calls && !optionData.puts)) {
      return [];
    }

    const expirationTimestamp = expirations[0];
    const expirationDate = new Date(expirationTimestamp * 1000);
    const daysToExpiry = Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24));

    // Strategy 1: Sell Put
    const sellPut = this.analyzeSellPut(symbol, stockPrice, optionData.puts, expirationDate, daysToExpiry);
    if (sellPut) recommendations.push(sellPut);

    // Strategy 2: Sell Call
    const sellCall = this.analyzeSellCall(symbol, stockPrice, optionData.calls, expirationDate, daysToExpiry);
    if (sellCall) recommendations.push(sellCall);

    // Strategy 3: Buy Call
    const buyCall = this.analyzeBuyCall(symbol, stockPrice, optionData.calls, expirationDate, daysToExpiry);
    if (buyCall) recommendations.push(buyCall);

    // Strategy 4: Buy Put
    const buyPut = this.analyzeBuyPut(symbol, stockPrice, optionData.puts, expirationDate, daysToExpiry);
    if (buyPut) recommendations.push(buyPut);

    // Strategy 5: Covered Call
    const coveredCall = this.analyzeCoveredCall(symbol, stockPrice, optionData.calls, expirationDate, daysToExpiry);
    if (coveredCall) recommendations.push(coveredCall);

    // Strategy 6: Bull Call Spread
    const spread = this.analyzeBullCallSpread(symbol, stockPrice, optionData.calls, expirationDate, daysToExpiry);
    if (spread) recommendations.push(spread);

    return recommendations;
  }

  /**
   * Strategy 1: Sell Put (Cash-Secured Put)
   */
  analyzeSellPut(symbol, stockPrice, puts, expiration, days) {
    if (!puts || puts.length === 0) return null;

    // Find OTM put with good premium (strike below current price)
    const viablePuts = puts.filter(p =>
      p.strike < stockPrice &&
      p.strike > stockPrice * 0.90 &&
      p.volume > 10 &&
      p.lastPrice > 0.5
    );

    if (viablePuts.length === 0) return null;

    const bestPut = viablePuts.reduce((best, p) => {
      const score = p.lastPrice * Math.log(p.volume + 1);
      const bestScore = best.lastPrice * Math.log(best.volume + 1);
      return score > bestScore ? p : best;
    });

    const premium = bestPut.lastPrice || bestPut.bid;
    const returnPercent = ((premium * 100) / (bestPut.strike * 100)) * 100;
    const annualReturn = (returnPercent / days) * 365;

    return this.createRecommendation({
      symbol,
      strategy: 'Sell Put',
      stockPrice,
      strikePrice: bestPut.strike,
      premium,
      expiration,
      days,
      volume: bestPut.volume,
      openInterest: bestPut.openInterest || 0,
      iv: (bestPut.impliedVolatility || 0.3) * 100,
      bid: bestPut.bid,
      ask: bestPut.ask,
      returnPercent,
      annualReturn,
      tradingStrategy: `SELL PUT (Cash-Secured): Sell 1 ${symbol} put contract at $${bestPut.strike.toFixed(2)} strike. Collect $${(premium * 100).toFixed(2)} premium upfront. You're obligated to BUY 100 shares at $${bestPut.strike.toFixed(2)} if assigned. Break-even: $${(bestPut.strike - premium).toFixed(2)}. Maximum profit: $${(premium * 100).toFixed(2)}. Best for: Bullish/neutral outlook, willing to own stock at lower price.`,
      risk: this.assessRisk(bestPut.impliedVolatility * 100, stockPrice, bestPut.strike, 'put')
    });
  }

  /**
   * Strategy 2: Sell Call (Naked Call)
   */
  analyzeSellCall(symbol, stockPrice, calls, expiration, days) {
    if (!calls || calls.length === 0) return null;

    // Find OTM call with good premium (strike above current price)
    const viableCalls = calls.filter(c =>
      c.strike > stockPrice &&
      c.strike < stockPrice * 1.10 &&
      c.volume > 10 &&
      c.lastPrice > 0.5
    );

    if (viableCalls.length === 0) return null;

    const bestCall = viableCalls.reduce((best, c) => {
      const score = c.lastPrice * Math.log(c.volume + 1);
      const bestScore = best.lastPrice * Math.log(best.volume + 1);
      return score > bestScore ? c : best;
    });

    const premium = bestCall.lastPrice || bestCall.bid;
    const returnPercent = ((premium * 100) / (stockPrice * 100)) * 100;
    const annualReturn = (returnPercent / days) * 365;

    return this.createRecommendation({
      symbol,
      strategy: 'Sell Call',
      stockPrice,
      strikePrice: bestCall.strike,
      premium,
      expiration,
      days,
      volume: bestCall.volume,
      openInterest: bestCall.openInterest || 0,
      iv: (bestCall.impliedVolatility || 0.3) * 100,
      bid: bestCall.bid,
      ask: bestCall.ask,
      returnPercent,
      annualReturn,
      tradingStrategy: `SELL CALL (Naked): Sell 1 ${symbol} call contract at $${bestCall.strike.toFixed(2)} strike. Collect $${(premium * 100).toFixed(2)} premium upfront. You're obligated to SELL 100 shares at $${bestCall.strike.toFixed(2)} if assigned. Maximum profit: $${(premium * 100).toFixed(2)}. Risk: Unlimited if stock rises significantly. Best for: Bearish/neutral outlook, high risk tolerance.`,
      risk: 'High'
    });
  }

  /**
   * Strategy 3: Buy Call (Long Call)
   */
  analyzeBuyCall(symbol, stockPrice, calls, expiration, days) {
    if (!calls || calls.length === 0) return null;

    // Find slightly OTM or ATM calls
    const viableCalls = calls.filter(c =>
      c.strike >= stockPrice * 0.98 &&
      c.strike <= stockPrice * 1.05 &&
      c.volume > 10 &&
      c.lastPrice > 1
    );

    if (viableCalls.length === 0) return null;

    const bestCall = viableCalls.reduce((best, c) => {
      const score = c.volume * (1 / c.lastPrice);
      const bestScore = best.volume * (1 / best.lastPrice);
      return score > bestScore ? c : best;
    });

    const cost = bestCall.lastPrice || bestCall.ask;
    const breakEven = bestCall.strike + cost;
    const potentialReturn = ((stockPrice * 1.10 - bestCall.strike - cost) / cost) * 100;

    return this.createRecommendation({
      symbol,
      strategy: 'Buy Call',
      stockPrice,
      strikePrice: bestCall.strike,
      premium: cost,
      expiration,
      days,
      volume: bestCall.volume,
      openInterest: bestCall.openInterest || 0,
      iv: (bestCall.impliedVolatility || 0.3) * 100,
      bid: bestCall.bid,
      ask: bestCall.ask,
      returnPercent: potentialReturn,
      annualReturn: (potentialReturn / days) * 365,
      tradingStrategy: `BUY CALL (Long): Buy 1 ${symbol} call contract at $${bestCall.strike.toFixed(2)} strike for $${(cost * 100).toFixed(2)} total cost. Break-even at expiration: $${breakEven.toFixed(2)}. Profit potential: Unlimited above break-even. Maximum loss: $${(cost * 100).toFixed(2)} (premium paid). Best for: Bullish outlook, limited capital, want leverage.`,
      risk: this.assessRisk(bestCall.impliedVolatility * 100, stockPrice, bestCall.strike, 'call-buy')
    });
  }

  /**
   * Strategy 4: Buy Put (Long Put)
   */
  analyzeBuyPut(symbol, stockPrice, puts, expiration, days) {
    if (!puts || puts.length === 0) return null;

    // Find slightly OTM or ATM puts
    const viablePuts = puts.filter(p =>
      p.strike >= stockPrice * 0.95 &&
      p.strike <= stockPrice * 1.02 &&
      p.volume > 10 &&
      p.lastPrice > 1
    );

    if (viablePuts.length === 0) return null;

    const bestPut = viablePuts.reduce((best, p) => {
      const score = p.volume * (1 / p.lastPrice);
      const bestScore = best.volume * (1 / best.lastPrice);
      return score > bestScore ? p : best;
    });

    const cost = bestPut.lastPrice || bestPut.ask;
    const breakEven = bestPut.strike - cost;
    const potentialReturn = ((bestPut.strike - stockPrice * 0.90 - cost) / cost) * 100;

    return this.createRecommendation({
      symbol,
      strategy: 'Buy Put',
      stockPrice,
      strikePrice: bestPut.strike,
      premium: cost,
      expiration,
      days,
      volume: bestPut.volume,
      openInterest: bestPut.openInterest || 0,
      iv: (bestPut.impliedVolatility || 0.3) * 100,
      bid: bestPut.bid,
      ask: bestPut.ask,
      returnPercent: potentialReturn,
      annualReturn: (potentialReturn / days) * 365,
      tradingStrategy: `BUY PUT (Long): Buy 1 ${symbol} put contract at $${bestPut.strike.toFixed(2)} strike for $${(cost * 100).toFixed(2)} total cost. Break-even at expiration: $${breakEven.toFixed(2)}. Profits if stock falls below break-even. Maximum loss: $${(cost * 100).toFixed(2)} (premium paid). Best for: Bearish outlook, portfolio protection, limited risk.`,
      risk: this.assessRisk(bestPut.impliedVolatility * 100, stockPrice, bestPut.strike, 'put-buy')
    });
  }

  /**
   * Strategy 5: Covered Call
   */
  analyzeCoveredCall(symbol, stockPrice, calls, expiration, days) {
    if (!calls || calls.length === 0) return null;

    // Find OTM calls for covered call
    const viableCalls = calls.filter(c =>
      c.strike > stockPrice &&
      c.strike < stockPrice * 1.08 &&
      c.volume > 10 &&
      c.lastPrice > 0.3
    );

    if (viableCalls.length === 0) return null;

    const bestCall = viableCalls.reduce((best, c) => {
      const score = c.lastPrice * Math.log(c.volume + 1);
      const bestScore = best.lastPrice * Math.log(best.volume + 1);
      return score > bestScore ? c : best;
    });

    const premium = bestCall.lastPrice || bestCall.bid;
    const stockCost = stockPrice * 100;
    const returnPercent = ((premium * 100) / stockCost) * 100;
    const annualReturn = (returnPercent / days) * 365;
    const maxReturn = ((bestCall.strike - stockPrice + premium) / stockPrice) * 100;

    return this.createRecommendation({
      symbol,
      strategy: 'Covered Call',
      stockPrice,
      strikePrice: bestCall.strike,
      premium,
      expiration,
      days,
      volume: bestCall.volume,
      openInterest: bestCall.openInterest || 0,
      iv: (bestCall.impliedVolatility || 0.3) * 100,
      bid: bestCall.bid,
      ask: bestCall.ask,
      returnPercent: maxReturn,
      annualReturn,
      tradingStrategy: `COVERED CALL: Own 100 shares of ${symbol} (cost: $${stockCost.toFixed(2)}), SELL 1 call at $${bestCall.strike.toFixed(2)} strike. Collect $${(premium * 100).toFixed(2)} premium immediately. If stock stays below $${bestCall.strike.toFixed(2)}, keep premium + stock. If assigned, sell stock at $${bestCall.strike.toFixed(2)} (total profit: $${((bestCall.strike - stockPrice + premium) * 100).toFixed(2)}). Best for: Stock owners wanting income, neutral/slightly bullish outlook.`,
      risk: 'Low to Medium'
    });
  }

  /**
   * Strategy 6: Bull Call Spread
   */
  analyzeBullCallSpread(symbol, stockPrice, calls, expiration, days) {
    if (!calls || calls.length < 2) return null;

    // Find two calls for spread (buy lower strike, sell higher strike)
    const atmCalls = calls.filter(c =>
      c.strike >= stockPrice * 0.98 &&
      c.strike <= stockPrice * 1.02 &&
      c.volume > 5 &&
      c.lastPrice > 1
    );

    const otmCalls = calls.filter(c =>
      c.strike > stockPrice * 1.02 &&
      c.strike < stockPrice * 1.10 &&
      c.volume > 5 &&
      c.lastPrice > 0.5
    );

    if (atmCalls.length === 0 || otmCalls.length === 0) return null;

    const buyCall = atmCalls[0];
    const sellCall = otmCalls[0];

    const netCost = (buyCall.lastPrice || buyCall.ask) - (sellCall.lastPrice || sellCall.bid);
    const maxProfit = (sellCall.strike - buyCall.strike) - netCost;
    const returnPercent = (maxProfit / netCost) * 100;
    const annualReturn = (returnPercent / days) * 365;

    return this.createRecommendation({
      symbol,
      strategy: 'Bull Call Spread',
      stockPrice,
      strikePrice: buyCall.strike,
      premium: netCost,
      expiration,
      days,
      volume: Math.min(buyCall.volume, sellCall.volume),
      openInterest: Math.min(buyCall.openInterest || 0, sellCall.openInterest || 0),
      iv: ((buyCall.impliedVolatility + sellCall.impliedVolatility) / 2 || 0.3) * 100,
      bid: buyCall.bid,
      ask: buyCall.ask,
      returnPercent,
      annualReturn,
      tradingStrategy: `BULL CALL SPREAD: BUY 1 call at $${buyCall.strike.toFixed(2)} (pay $${(buyCall.lastPrice * 100).toFixed(2)}), SELL 1 call at $${sellCall.strike.toFixed(2)} (collect $${(sellCall.lastPrice * 100).toFixed(2)}). Net cost: $${(netCost * 100).toFixed(2)}. Maximum profit: $${(maxProfit * 100).toFixed(2)} if stock ≥ $${sellCall.strike.toFixed(2)}. Maximum loss: $${(netCost * 100).toFixed(2)} (net cost). Best for: Moderately bullish, want to reduce cost of long call.`,
      risk: 'Medium'
    });
  }

  createRecommendation(data) {
    const { symbol, strategy, stockPrice, strikePrice, premium, expiration, days, volume, openInterest, iv, bid, ask, returnPercent, annualReturn, tradingStrategy, risk } = data;

    const score = this.calculateScore(returnPercent, volume, iv, days);

    return {
      symbol,
      strategy,
      stockPrice: Math.round(stockPrice * 100) / 100,
      strikePrice: Math.round(strikePrice * 100) / 100,
      expirationDate: expiration.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      premium: Math.round(premium * 100) / 100,
      totalPremium: Math.round(premium * 100 * 100) / 100,
      volume,
      openInterest,
      iv: iv.toFixed(1),
      bid: bid ? bid.toFixed(2) : 'N/A',
      ask: ask ? ask.toFixed(2) : 'N/A',
      returnPercent: returnPercent.toFixed(2),
      annualReturn: annualReturn.toFixed(1),
      risk,
      tradingStrategy,
      score,
      timestamp: new Date().toISOString()
    };
  }

  assessRisk(iv, stockPrice, strikePrice, type) {
    if (type === 'put') {
      const distance = ((stockPrice - strikePrice) / stockPrice) * 100;
      if (iv < 30 && distance > 7) return 'Low';
      if (iv > 50 || distance < 4) return 'High';
      return 'Medium';
    }
    if (type === 'call-buy' || type === 'put-buy') {
      if (iv < 30) return 'Low';
      if (iv > 50) return 'High';
      return 'Medium';
    }
    return 'Medium';
  }

  calculateScore(returnPercent, volume, iv, days) {
    let score = returnPercent * 5;
    score += Math.min(Math.log(volume + 1) * 2, 15);
    score -= (iv - 30) * 0.3;
    score += (30 - Math.abs(days - 30)) * 0.5;
    return Math.max(0, score);
  }
}

export default ComprehensiveOptionsService;
