import axios from 'axios';

/**
 * Clean, simple options recommendation service
 * Fetches top 5 recommendations for each of 5 strategies
 */
class OptionsRecommendationService {
  constructor() {
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    };

    // Popular liquid stocks for options trading
    this.stockPool = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META',
      'JPM', 'BAC', 'WFC', 'GS', 'C', 'V', 'MA',
      'JNJ', 'UNH', 'PFE', 'ABBV', 'LLY',
      'WMT', 'HD', 'DIS', 'MCD', 'COST',
      'XOM', 'CVX', 'BA', 'CAT'
    ];
  }

  /**
   * Get all recommendations - 5 for each strategy (25 total)
   */
  async getAllRecommendations() {
    console.log('Fetching recommendations...');

    const allRecs = [];

    // Process stocks one by one
    for (const symbol of this.stockPool) {
      const stockData = await this.getStockData(symbol);
      if (!stockData) continue;

      const optionsData = await this.getOptionsData(symbol);
      if (!optionsData) continue;

      // Analyze all strategies for this stock
      const recs = this.analyzeAllStrategies(symbol, stockData, optionsData);
      allRecs.push(...recs);

      // Stop early if we have enough data
      if (allRecs.length >= 100) break;

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Get top 5 for each strategy
    const final = this.selectTop5PerStrategy(allRecs);
    console.log(`Generated ${final.length} recommendations`);
    return final;
  }

  /**
   * Get stock price
   */
  async getStockData(symbol) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      const response = await axios.get(url, { headers: this.headers });
      const meta = response.data?.chart?.result?.[0]?.meta;

      if (!meta) return null;

      return {
        symbol,
        price: meta.regularMarketPrice || meta.previousClose
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get options chain
   */
  async getOptionsData(symbol) {
    try {
      const url = `https://query2.finance.yahoo.com/v7/finance/options/${symbol}`;
      const response = await axios.get(url, { headers: this.headers });

      const chain = response.data?.optionChain?.result?.[0];
      if (!chain?.options?.[0]) return null;

      const options = chain.options[0];
      const expTimestamp = chain.expirationDates?.[0];

      if (!expTimestamp) return null;

      const expDate = new Date(expTimestamp * 1000);
      const daysToExp = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));

      if (daysToExp <= 0 || daysToExp > 180) return null;

      return {
        calls: options.calls || [],
        puts: options.puts || [],
        expirationDate: expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        daysToExp
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Analyze all 5 strategies for a stock
   */
  analyzeAllStrategies(symbol, stockData, optionsData) {
    const recs = [];

    // 1. Buy Calls
    const buyCall = this.analyzeBuyCall(symbol, stockData, optionsData);
    if (buyCall) recs.push(buyCall);

    // 2. Buy Puts
    const buyPut = this.analyzeBuyPut(symbol, stockData, optionsData);
    if (buyPut) recs.push(buyPut);

    // 3. Sell Puts
    const sellPut = this.analyzeSellPut(symbol, stockData, optionsData);
    if (sellPut) recs.push(sellPut);

    // 4. Sell Calls
    const sellCall = this.analyzeSellCall(symbol, stockData, optionsData);
    if (sellCall) recs.push(sellCall);

    // 5. Option Spreads
    const spread = this.analyzeSpread(symbol, stockData, optionsData);
    if (spread) recs.push(spread);

    return recs;
  }

  /**
   * 1. Buy Calls - Bullish directional play
   */
  analyzeBuyCall(symbol, stockData, optionsData) {
    const calls = optionsData.calls.filter(c =>
      c.strike >= stockData.price * 0.95 &&
      c.strike <= stockData.price * 1.05 &&
      c.volume > 10 &&
      c.lastPrice > 0.5
    );

    if (calls.length === 0) return null;

    const best = calls.sort((a, b) => b.volume - a.volume)[0];
    const cost = best.lastPrice;
    const breakeven = best.strike + cost;

    return {
      stockSymbol: symbol,
      currentStockPrice: stockData.price.toFixed(2),
      optionStrategy: 'Buy Call',
      strikePrice: best.strike.toFixed(2),
      expirationDate: optionsData.expirationDate,
      reason: `Stock at $${stockData.price.toFixed(2)}. Betting on upward move. Break-even at $${breakeven.toFixed(2)}.`,
      howToTrade: `Buy to open 1 ${symbol} ${optionsData.expirationDate} $${best.strike} call for $${(cost * 100).toFixed(2)}. Max risk: premium paid. Profit if stock rises above break-even.`,
      score: best.volume * (1 / cost)
    };
  }

  /**
   * 2. Buy Puts - Bearish or hedge
   */
  analyzeBuyPut(symbol, stockData, optionsData) {
    const puts = optionsData.puts.filter(p =>
      p.strike >= stockData.price * 0.95 &&
      p.strike <= stockData.price * 1.05 &&
      p.volume > 10 &&
      p.lastPrice > 0.5
    );

    if (puts.length === 0) return null;

    const best = puts.sort((a, b) => b.volume - a.volume)[0];
    const cost = best.lastPrice;
    const breakeven = best.strike - cost;

    return {
      stockSymbol: symbol,
      currentStockPrice: stockData.price.toFixed(2),
      optionStrategy: 'Buy Put',
      strikePrice: best.strike.toFixed(2),
      expirationDate: optionsData.expirationDate,
      reason: `Stock at $${stockData.price.toFixed(2)}. Betting on downward move or hedging. Break-even at $${breakeven.toFixed(2)}.`,
      howToTrade: `Buy to open 1 ${symbol} ${optionsData.expirationDate} $${best.strike} put for $${(cost * 100).toFixed(2)}. Max risk: premium paid. Profit if stock falls below break-even.`,
      score: best.volume * (1 / cost)
    };
  }

  /**
   * 3. Sell Puts - Collect premium, willing to own stock
   */
  analyzeSellPut(symbol, stockData, optionsData) {
    const puts = optionsData.puts.filter(p =>
      p.strike < stockData.price &&
      p.strike > stockData.price * 0.90 &&
      p.volume > 10 &&
      p.lastPrice > 0.5
    );

    if (puts.length === 0) return null;

    const best = puts.sort((a, b) => (b.lastPrice * b.volume) - (a.lastPrice * a.volume))[0];
    const premium = best.lastPrice;
    const returnPct = ((premium / best.strike) * 100).toFixed(2);

    return {
      stockSymbol: symbol,
      currentStockPrice: stockData.price.toFixed(2),
      optionStrategy: 'Sell Put',
      strikePrice: best.strike.toFixed(2),
      expirationDate: optionsData.expirationDate,
      reason: `Collect $${(premium * 100).toFixed(2)} premium. ${returnPct}% return on capital. Willing to buy stock at $${best.strike.toFixed(2)}.`,
      howToTrade: `Sell to open 1 ${symbol} ${optionsData.expirationDate} $${best.strike} put. Collect $${(premium * 100).toFixed(2)} now. If assigned, buy 100 shares at $${best.strike}.`,
      score: parseFloat(returnPct) * Math.log(best.volume + 1)
    };
  }

  /**
   * 4. Sell Calls - Bearish or neutral income
   */
  analyzeSellCall(symbol, stockData, optionsData) {
    const calls = optionsData.calls.filter(c =>
      c.strike > stockData.price &&
      c.strike < stockData.price * 1.10 &&
      c.volume > 10 &&
      c.lastPrice > 0.5
    );

    if (calls.length === 0) return null;

    const best = calls.sort((a, b) => (b.lastPrice * b.volume) - (a.lastPrice * a.volume))[0];
    const premium = best.lastPrice;
    const returnPct = ((premium / stockData.price) * 100).toFixed(2);

    return {
      stockSymbol: symbol,
      currentStockPrice: stockData.price.toFixed(2),
      optionStrategy: 'Sell Call',
      strikePrice: best.strike.toFixed(2),
      expirationDate: optionsData.expirationDate,
      reason: `Collect $${(premium * 100).toFixed(2)} premium. ${returnPct}% return. Betting stock won't rise above $${best.strike.toFixed(2)}.`,
      howToTrade: `Sell to open 1 ${symbol} ${optionsData.expirationDate} $${best.strike} call. Collect $${(premium * 100).toFixed(2)} now. Risk: unlimited if stock rises sharply.`,
      score: parseFloat(returnPct) * Math.log(best.volume + 1) * 0.7
    };
  }

  /**
   * 5. Option Spreads - Limited risk/reward
   */
  analyzeSpread(symbol, stockData, optionsData) {
    const atmCalls = optionsData.calls.filter(c =>
      c.strike >= stockData.price * 0.97 &&
      c.strike <= stockData.price * 1.03 &&
      c.volume > 5
    );

    const otmCalls = optionsData.calls.filter(c =>
      c.strike > stockData.price * 1.03 &&
      c.strike < stockData.price * 1.10 &&
      c.volume > 5
    );

    if (atmCalls.length === 0 || otmCalls.length === 0) return null;

    const buyLeg = atmCalls[0];
    const sellLeg = otmCalls[0];
    const netCost = buyLeg.lastPrice - sellLeg.lastPrice;

    if (netCost <= 0) return null;

    const maxProfit = sellLeg.strike - buyLeg.strike - netCost;
    const returnPct = ((maxProfit / netCost) * 100).toFixed(2);

    return {
      stockSymbol: symbol,
      currentStockPrice: stockData.price.toFixed(2),
      optionStrategy: 'Bull Call Spread',
      strikePrice: `${buyLeg.strike.toFixed(2)}/${sellLeg.strike.toFixed(2)}`,
      expirationDate: optionsData.expirationDate,
      reason: `Limited risk spread. Max profit: $${(maxProfit * 100).toFixed(2)} (${returnPct}% return). Max loss: $${(netCost * 100).toFixed(2)}.`,
      howToTrade: `Buy ${symbol} $${buyLeg.strike} call, sell $${sellLeg.strike} call. Net cost: $${(netCost * 100).toFixed(2)}. Best if stock moves to $${sellLeg.strike}.`,
      score: parseFloat(returnPct) * Math.log(Math.min(buyLeg.volume, sellLeg.volume) + 1) * 0.8
    };
  }

  /**
   * Select top 5 for each strategy
   */
  selectTop5PerStrategy(allRecs) {
    const strategies = ['Buy Call', 'Buy Put', 'Sell Put', 'Sell Call', 'Bull Call Spread'];
    const result = [];

    strategies.forEach(strategy => {
      const filtered = allRecs
        .filter(r => r.optionStrategy === strategy)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      result.push(...filtered);
    });

    return result;
  }
}

export default OptionsRecommendationService;
