// VIP seviyelerine göre fee oranları (değişmeyen sabitler)
export const VIP_FEE_RATES: { [vip: number]: number } = {
  0: 0.001, // %0,1
  1: 0.0008375, // %0,08375
  2: 0.0007125, // %0,07125
  3: 0.0006875, // %0,06875
  4: 0.00055, // %0,055
  5: 0.00045, // %0,045
};

// VIP seviyesi bilinmiyorsa default olarak 0.1 alınır
export const getFeeRateForVip = (vip: number): number => {
  return VIP_FEE_RATES[vip] ?? 0.001;
};
