import { Event, Trade } from "../types";

// Anlık ödül hesaplama
export const calculateEstimatedReward = (event: Event): number => {
  if (event.total_volume <= 0) return 0;

  const currentValue = event.total_volume * event.current_price;
  return currentValue - event.total_cost;
};

// Toplam ödül hesaplama (satış işlemleri dahil)
export const calculateTotalReward = (event: Event): number => {
  const estimatedReward = calculateEstimatedReward(event);
  return estimatedReward + event.rebate_received;
};

// Risk/Reward oranı hesaplama
export const calculateRiskRewardRatio = (event: Event): number => {
  if (event.total_cost <= 0) return 0;

  const totalReward = calculateTotalReward(event);
  return totalReward / event.total_cost;
};

// Kar yüzdesi hesaplama
export const calculateProfitPercentage = (event: Event): number => {
  if (event.total_cost <= 0) return 0;

  const totalReward = calculateTotalReward(event);
  return (totalReward / event.total_cost) * 100;
};

// Ortalama alış fiyatı hesaplama
export const calculateAverageBuyPrice = (event: Event): number => {
  const buyTrades = event.trades.filter((trade) => trade.trade_type === "buy");

  if (buyTrades.length === 0) return 0;

  const totalAmount = buyTrades.reduce((sum, trade) => sum + trade.amount, 0);
  const totalValue = buyTrades.reduce(
    (sum, trade) => sum + trade.amount * trade.price,
    0
  );

  return totalValue / totalAmount;
};

// Ortalama satış fiyatı hesaplama
export const calculateAverageSellPrice = (event: Event): number => {
  const sellTrades = event.trades.filter(
    (trade) => trade.trade_type === "sell"
  );

  if (sellTrades.length === 0) return 0;

  const totalAmount = sellTrades.reduce((sum, trade) => sum + trade.amount, 0);
  const totalValue = sellTrades.reduce(
    (sum, trade) => sum + trade.amount * trade.price,
    0
  );

  return totalValue / totalAmount;
};

// Kalan token miktarı hesaplama
export const calculateRemainingTokens = (event: Event): number => {
  const buyAmount = event.trades
    .filter((trade) => trade.trade_type === "buy")
    .reduce((sum, trade) => sum + trade.amount, 0);

  const sellAmount = event.trades
    .filter((trade) => trade.trade_type === "sell")
    .reduce((sum, trade) => sum + trade.amount, 0);

  return buyAmount - sellAmount;
};

// Toplam satış geliri hesaplama
export const calculateTotalSalesRevenue = (event: Event): number => {
  return event.trades
    .filter((trade) => trade.trade_type === "sell")
    .reduce((sum, trade) => sum + trade.amount * trade.price, 0);
};

// Net kar/zarar hesaplama
export const calculateNetProfitLoss = (event: Event): number => {
  const totalSalesRevenue = calculateTotalSalesRevenue(event);
  const remainingTokensValue =
    calculateRemainingTokens(event) * event.current_price;

  return totalSalesRevenue + remainingTokensValue - event.total_cost;
};

// Masraf hesaplama (varsayılan %0.1)
export const calculateCommission = (
  amount: number,
  price: number,
  commissionRate: number = 0.001
): number => {
  return amount * price * commissionRate;
};

// İade hesaplama (varsayılan %0.05)
export const calculateRebate = (
  amount: number,
  price: number,
  rebateRate: number = 0.0005
): number => {
  return amount * price * rebateRate;
};
