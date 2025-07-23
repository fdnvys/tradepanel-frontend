// Vercel cache temizliği için dummy değişiklik
import {
  Event,
  Trade,
  NewEventForm,
  NewTradeForm,
  PriceUpdateForm,
  Stats,
} from "../types";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://web-production-2a27.up.railway.app/api";

// API istekleri için yardımcı fonksiyon
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // POST isteklerinde Content-Type'ı zorla application/json yap
  const headers = new Headers(options.headers);

  // JWT token'ı ekle
  const token = localStorage.getItem("token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Eğer body varsa ve Content-Type belirtilmemişse, application/json ekle
  if (
    options.body &&
    !headers.get("Content-Type") &&
    !headers.get("content-type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const config: RequestInit = {
    headers,
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// Event (Parite) API'leri
export const eventApi = {
  // Tüm eventleri getir
  getAll: async (): Promise<Event[]> => {
    return apiRequest("/events");
  },

  // Aktif eventleri getir
  getActive: async (): Promise<Event[]> => {
    return apiRequest("/events/active");
  },

  // Biten eventleri getir
  getFinished: async (): Promise<Event[]> => {
    return apiRequest("/events/finished");
  },

  // Tek bir event getir
  getById: async (id: number): Promise<Event> => {
    return apiRequest(`/events/${id}`);
  },

  // Yeni event oluştur
  create: async (eventData: NewEventForm): Promise<Event> => {
    return apiRequest("/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  },

  // Event güncelle
  update: async (id: number, eventData: Partial<Event>): Promise<Event> => {
    return apiRequest(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    });
  },

  // Event'i bitir
  finish: async (id: number): Promise<Event> => {
    return apiRequest(`/events/${id}/finish`, {
      method: "POST",
    });
  },

  // Event sil
  delete: async (id: number): Promise<void> => {
    return apiRequest(`/events/${id}`, {
      method: "DELETE",
    });
  },
};

// Trade API'leri
export const tradeApi = {
  // Event'e trade ekle
  addToEvent: async (
    eventId: number,
    tradeData: NewTradeForm
  ): Promise<Trade> => {
    return apiRequest(`/events/${eventId}/trades`, {
      method: "POST",
      body: JSON.stringify(tradeData),
    });
  },

  // Trade güncelle
  update: async (id: number, tradeData: Partial<Trade>): Promise<Trade> => {
    return apiRequest(`/trades/${id}`, {
      method: "PUT",
      body: JSON.stringify(tradeData),
    });
  },

  // Trade sil
  delete: async (id: number): Promise<void> => {
    return apiRequest(`/trades/${id}`, {
      method: "DELETE",
    });
  },
};

// Fiyat API'leri
export const priceApi = {
  // Fiyat güncelle
  update: async (
    eventId: number,
    priceData: PriceUpdateForm
  ): Promise<{ success: boolean; estimated_reward: number }> => {
    return apiRequest(`/events/${eventId}/price`, {
      method: "POST",
      body: JSON.stringify(priceData),
    });
  },

  // Otomatik fiyat çek (Binance API'den)
  fetchFromBinance: async (symbol: string): Promise<number> => {
    return apiRequest(`/price/binance/${symbol}`);
  },
};

// İstatistik API'leri
export const statsApi = {
  // Genel istatistikler
  getGeneral: async (): Promise<Stats> => {
    return apiRequest("/stats/general");
  },

  // Event bazlı istatistikler
  getByEvent: async (eventId: number): Promise<any> => {
    return apiRequest(`/stats/event/${eventId}`);
  },
};

// Kullanıcı API'leri
export const userApi = {
  // Giriş
  login: async (
    username: string,
    password: string
  ): Promise<{ user: any; token: string }> => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  // Kayıt
  register: async (
    username: string,
    password: string
  ): Promise<{ user: any; token: string }> => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  // Çıkış
  logout: async (): Promise<void> => {
    return apiRequest("/auth/logout", {
      method: "POST",
    });
  },

  // Mevcut kullanıcı bilgileri
  getCurrent: async (): Promise<any> => {
    return apiRequest("/auth/me");
  },
};

// Admin API'leri
export const adminApi = {
  // Admin girişi
  login: async (
    username: string,
    password: string
  ): Promise<{ user: any; token: string }> => {
    return apiRequest("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  // Tüm kullanıcıları listele
  getUsers: async (): Promise<{ users: any[] }> => {
    return apiRequest("/auth/admin/users");
  },

  // Kullanıcıyı onayla
  approveUser: async (
    userId: number
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest("/auth/admin/approve", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },

  // Kullanıcıyı sil
  deleteUser: async (
    userId: number
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest(`/auth/admin/users/${userId}`, {
      method: "DELETE",
    });
  },

  // Kullanıcıyı pro yap/kaldır
  setPro: async (
    userId: number,
    isPro: boolean
  ): Promise<{ success: boolean; message: string }> => {
    return apiRequest("/auth/admin/setpro", {
      method: "POST",
      body: JSON.stringify({ userId, isPro }),
    });
  },

  // Kullanıcının refund_rate bilgisini getir
  getUserRefundRate: async (userId: number) => {
    return apiRequest(`/users/${userId}/refund-rate`);
  },

  // Kullanıcının refund_rate bilgisini güncelle
  updateUserRefundRate: async (userId: number, refund_rate: number) => {
    return apiRequest(`/users/${userId}/refund-rate`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refund_rate }),
    });
  },
};

// Hesap API'leri
export const accountsApi = {
  // Hesapları listele
  getAll: async (token: string) => {
    return apiRequest("/accounts", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  // Hesap ekle
  create: async (name: string, vip: number, token: string) => {
    return apiRequest("/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, vip }),
    });
  },
  // Hesap sil
  delete: async (accountId: number, token: string) => {
    return apiRequest(`/accounts/${accountId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  // Hesap vip güncelle
  updateVip: async (accountId: number, vip: number, token: string) => {
    return apiRequest(`/accounts/${accountId}/vip`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ vip }),
    });
  },
};

// Genel API instance'ı (axios benzeri kullanım için)
export const api = {
  get: (endpoint: string) => apiRequest(endpoint),
  post: (endpoint: string, data?: any) =>
    apiRequest(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: (endpoint: string, data?: any) =>
    apiRequest(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: (endpoint: string) =>
    apiRequest(endpoint, {
      method: "DELETE",
    }),
};

// Parite yönetimi API'leri
export const createPair = async (
  name: string,
  reward: number = 0
): Promise<any> => {
  const adminToken = localStorage.getItem("adminToken");
  const response = await fetch(`${API_BASE_URL}/pairs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ name, reward }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Parite eklenirken hata oluştu");
  }

  return response.json();
};

export const getPairs = async (): Promise<any[]> => {
  const adminToken = localStorage.getItem("adminToken");
  const response = await fetch(`${API_BASE_URL}/pairs`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Pariteler yüklenirken hata oluştu");
  }

  return response.json();
};

export const getUserPairs = async (accountId: number): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/pairs/user/${accountId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Kullanıcı pariteleri yüklenirken hata oluştu");
  }

  return response.json();
};

export const completePair = async (
  pairId: number,
  accountId: number,
  rewardAmount: number
): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/pairs/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ pairId, accountId, rewardAmount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Parite bitirilirken hata oluştu");
  }

  return response.json();
};

export const getAvailablePairs = async (accountId: number): Promise<any[]> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pairs/available/${accountId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Mevcut pariteler yüklenirken hata oluştu");
  }

  return response.json();
};

export const addPairsToAccount = async (
  accountId: number,
  pairIds: number[],
  addToAllAccounts: boolean
): Promise<any> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pairs/add-to-account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ accountId, pairIds, addToAllAccounts }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Pariteler eklenirken hata oluştu");
  }

  return response.json();
};

export const togglePairStatus = async (pairId: number): Promise<any> => {
  const adminToken = localStorage.getItem("adminToken");
  const response = await fetch(`${API_BASE_URL}/pairs/${pairId}/toggle`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Parite durumu güncellenirken hata oluştu");
  }

  return response.json();
};

export const resumePair = async (
  pairId: number,
  accountId: number
): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/pairs/resume`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ pairId, accountId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Parite tekrar aktifleştirilemedi");
  }

  return response.json();
};

export const getPairDetails = async (
  accountId: number,
  pairId: number
): Promise<any> => {
  const token = localStorage.getItem("token");
  const response = await fetch(
    `${API_BASE_URL}/pairs/details/${accountId}/${pairId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Parite detayları alınamadı");
  }
  return response.json();
};

export const getBybitPrice = async (pairName: string): Promise<number> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pairs/price/${pairName}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Fiyat alınamadı");
  }
  const data = await response.json();
  return data.price;
};

export const updatePairPrice = async (
  accountId: number,
  pairId: number,
  price: number
): Promise<any> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pairs/update-price`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ accountId, pairId, price }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Fiyat güncellenemedi");
  }
  return response.json();
};

export const startTrade = async (
  accountId: number,
  pairId: number,
  entryBalance: number
): Promise<any> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pairs/trade/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      accountId,
      pairId,
      entryBalance,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Trade başlatılamadı");
  }
  return response.json();
};

export const finishTrade = async (
  tradeId: number,
  exitBalance: number,
  exitVolume: number
): Promise<any> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pairs/trade/finish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tradeId,
      exitBalance,
      exitVolume,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Trade bitirilemedi");
  }
  return response.json();
};

export const getTradeList = async (
  accountId: number,
  pairId: number
): Promise<any> => {
  const token = localStorage.getItem("token");
  const response = await fetch(
    `${API_BASE_URL}/pairs/trade/list/${accountId}/${pairId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Trade listesi alınamadı");
  }
  return response.json();
};

export const updateTrade = async (
  tradeId: number,
  updates: {
    volume?: number;
    entry_balance?: number;
    exit_balance?: number;
    exit_volume?: number;
  }
): Promise<any> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pairs/trade/${tradeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Trade güncellenemedi");
  }
  return response.json();
};

export const deleteTrade = async (tradeId: number): Promise<any> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pairs/trade/${tradeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Trade silinemedi");
  }
  return response.json();
};

export const deletePair = async (pairId: number): Promise<any> => {
  const adminToken = localStorage.getItem("adminToken");
  const response = await fetch(`${API_BASE_URL}/pairs/${pairId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Parite silinirken hata oluştu");
  }

  return response.json();
};

export const updateUserPairReward = async (
  accountId: number,
  pairId: number,
  rewardAmount: number,
  price: number
): Promise<any> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/pairs/userpair/reward`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ accountId, pairId, rewardAmount, price }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Ödül güncellenemedi");
  }
  return response.json();
};

// Yeni: Parite ve kullanıcı bazlı istatistikleri getir
export const getStatistics = async (): Promise<any> => {
  return apiRequest("/pairs/statistics");
};

// Kullanıcının aktif ve biten paritelerini getir
export const getUserPairList = async (): Promise<any> => {
  return apiRequest("/pairs/user-pair-list");
};
