// Para formatlaması
export const formatCurrency = (
  amount: number,
  currency: string = "USDT"
): string => {
  // Kripto para birimleri için özel formatlama
  if (currency === "USDT" || currency === "BTC" || currency === "ETH") {
    return (
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }).format(amount) + ` ${currency}`
    );
  }

  // Normal para birimleri için standart formatlama
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);
};

// Sayı formatlaması
export const formatNumber = (number: number, decimals: number = 2): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

// Yüzde formatlaması
export const formatPercentage = (
  percentage: number,
  decimals: number = 2
): string => {
  return `${formatNumber(percentage, decimals)}%`;
};

// Tarih formatlaması - Türkiye saati ile
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(date);
};

// Kısa tarih formatlaması - Türkiye saati ile
export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("tr-TR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(date);
};

// Token miktarı formatlaması
export const formatTokenAmount = (amount: number): string => {
  if (amount >= 1000000) {
    return `${formatNumber(amount / 1000000, 2)}M`;
  } else if (amount >= 1000) {
    return `${formatNumber(amount / 1000, 2)}K`;
  } else {
    return formatNumber(amount, 6);
  }
};

// Fiyat formatlaması
export const formatPrice = (price: number): string => {
  if (price < 0.000001) {
    return price.toExponential(2);
  } else if (price < 0.01) {
    return formatNumber(price, 8);
  } else if (price < 1) {
    return formatNumber(price, 6);
  } else if (price < 100) {
    return formatNumber(price, 4);
  } else {
    return formatNumber(price, 2);
  }
};

// Renk sınıfları (kar/zarar için)
export const getProfitLossColor = (value: number): string => {
  if (value > 0) return "text-green-600";
  if (value < 0) return "text-red-600";
  return "text-gray-600";
};

// Renk sınıfları (yüzde için)
export const getPercentageColor = (percentage: number): string => {
  if (percentage > 5) return "text-green-600";
  if (percentage > 0) return "text-blue-600";
  if (percentage < -5) return "text-red-600";
  if (percentage < 0) return "text-orange-600";
  return "text-gray-600";
};
