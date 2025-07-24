// Kullanıcı tipi
export interface User {
  id: number;
  username: string;
  created_at: string;
}

// Event (Parite) tipi
export interface Event {
  id: number;
  user_id: number;
  token_name: string;
  total_volume: number;
  total_cost: number;
  rebate_received: number;
  estimated_reward: number;
  total_reward: number;
  current_price: number;
  current_balance: number;
  sold_tokens_usdt: number;
  is_finished: boolean;
  start_date: string;
  trades: Trade[];
}

// Trade (İşlem) tipi
export interface Trade {
  id: number;
  event_id: number;
  trade_type: "buy" | "sell";
  amount: number;
  price: number;
  timestamp: string;
  notes?: string;
}

// Yeni event oluşturma formu
export interface NewEventForm {
  token_name: string;
  total_volume: number;
  total_cost: number;
}

// Yeni trade ekleme formu
export interface NewTradeForm {
  trade_type: "buy" | "sell";
  amount: number;
  price: number;
  notes?: string;
}

// Fiyat güncelleme formu
export interface PriceUpdateForm {
  price: number;
}

// İstatistikler
export interface Stats {
  total_volume: number;
  total_cost: number;
  total_reward: number;
  total_rebate: number;
  active_events_count: number;
  finished_events_count: number;
}

export interface Pair {
  id: number;
  name: string;
  reward: number;
}

// Parite ve kullanıcı bazlı istatistik satırı tipi
export interface StatisticsRow {
  id: number;
  user_name: string;
  account_id: number;
  user_id: number;
  vip: number;
  account_created_at: string;
  account_name: string;
  pair_id: number;
  pair_name: string;
  is_active: number;
  is_completed: number;
  reward_amount: number;
  completed_at: string | null;
  total_volume: number;
  total_cost: number;
  total_refund: number;
  avg_trade: number;
  selled_dolar: number;
  first_trade_date: string | null;
  last_trade_date: string | null;
}
