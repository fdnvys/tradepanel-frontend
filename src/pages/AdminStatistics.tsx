import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPairStatistics,
  getUserStatistics,
  getUserPairStatistics,
  getUserStatisticsWithDate,
  getUserPairStatisticsWithDate,
  getUserAccountStatistics,
  getPairs,
} from "../services/api";
import { adminApi } from "../services/api";

interface PairStat {
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

interface UserStatistics {
  user: {
    id: number;
    username: string;
    refund_rate: number;
  };
  statistics: {
    total_accounts: number;
    total_pairs: number;
    total_volume: number;
    total_cost: number;
    total_refund: number;
    total_reward: number;
    completed_pairs: number;
    active_pairs: number;
    avg_trade: number;
    total_selled_dolar: number;
    efficiency: number;
    profit: number;
  };
}

interface UserPairStatistics {
  pair_id: number;
  pair_name: string;
  pair_reward: number;
  account_count: number;
  total_volume: number;
  total_cost: number;
  total_refund: number;
  total_reward: number;
  avg_trade: number;
  total_selled_dolar: number;
  completed_accounts: number;
  active_accounts: number;
  first_started: string | null;
  last_completed: string | null;
  efficiency: number;
  profit: number;
}

interface AccountStatistics {
  account_id: number;
  account_name: string;
  vip: number;
  account_created_at: string;
  total_pairs: number;
  total_volume: number;
  total_cost: number;
  total_refund: number;
  total_reward: number;
  completed_pairs: number;
  active_pairs: number;
  avg_trade: number;
  total_selled_dolar: number;
  first_trade_date: string | null;
  last_completed_date: string | null;
  efficiency: number;
  profit: number;
}

const AdminStatistics: React.FC = () => {
  const [pairStats, setPairStats] = useState<PairStat[]>([]);
  const [selectedPairForStats, setSelectedPairForStats] = useState<
    number | null
  >(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userStatistics, setUserStatistics] = useState<UserStatistics | null>(
    null
  );
  const [userPairStatistics, setUserPairStatistics] = useState<
    UserPairStatistics[]
  >([]);
  const [pairStatsLoading, setPairStatsLoading] = useState(false);
  const [userStatsLoading, setUserStatsLoading] = useState(false);
  const [statisticsView, setStatisticsView] = useState<"pair" | "user">("pair");
  const [pairs, setPairs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Yeni state'ler
  const [accountStatistics, setAccountStatistics] = useState<
    AccountStatistics[]
  >([]);
  const [accountStatsLoading, setAccountStatsLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showPairDropdown, setShowPairDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchPairs();
    fetchUsers();
    fetchPairStatistics();
  }, []);

  // Dropdown'ları dışına tıklandığında kapatma
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".dropdown-container")) {
        setShowPairDropdown(false);
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchPairs = async () => {
    try {
      const pairs = await getPairs();
      setPairs(pairs);
    } catch (error) {
      console.error("Pariteler yüklenirken hata:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminApi.getUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPairStatistics = async () => {
    setPairStatsLoading(true);
    try {
      const data = await getPairStatistics();
      setPairStats(data.statistics || []);
    } catch (error) {
      console.error("Parite istatistikleri yüklenirken hata:", error);
    } finally {
      setPairStatsLoading(false);
    }
  };

  const fetchUserStatistics = async (userId: number) => {
    setUserStatsLoading(true);
    try {
      const data = await getUserStatistics(userId);
      setUserStatistics(data);
    } catch (error) {
      console.error("Kullanıcı istatistikleri yüklenirken hata:", error);
    } finally {
      setUserStatsLoading(false);
    }
  };

  const fetchUserPairStatistics = async (userId: number) => {
    try {
      const data = await getUserPairStatistics(userId);
      setUserPairStatistics(data.pair_statistics || []);
    } catch (error) {
      console.error("Kullanıcı parite istatistikleri yüklenirken hata:", error);
    }
  };

  const handleUserSelect = (userId: number) => {
    setSelectedUser(userId);
    fetchUserStatistics(userId);
    fetchUserPairStatistics(userId);
    fetchAccountStatistics(userId);
  };

  const fetchAccountStatistics = async (userId: number) => {
    setAccountStatsLoading(true);
    try {
      console.log("fetchAccountStatistics çağrıldı, userId:", userId);
      console.log("Date filters:", { startDate, endDate });

      const data = await getUserAccountStatistics(userId, startDate, endDate);
      console.log("Account statistics data:", data);

      setAccountStatistics(data.account_statistics || []);
    } catch (error) {
      console.error("Hesap istatistikleri yüklenirken hata:", error);
    } finally {
      setAccountStatsLoading(false);
    }
  };

  const handleDateFilter = async () => {
    if (selectedUser) {
      setUserStatsLoading(true);
      setAccountStatsLoading(true);
      try {
        const [userData, pairData, accountData] = await Promise.all([
          getUserStatisticsWithDate(selectedUser, startDate, endDate),
          getUserPairStatisticsWithDate(selectedUser, startDate, endDate),
          getUserAccountStatistics(selectedUser, startDate, endDate),
        ]);
        setUserStatistics(userData);
        setUserPairStatistics(pairData.pair_statistics || []);
        setAccountStatistics(accountData.account_statistics || []);
      } catch (error) {
        console.error("Tarih filtresi uygulanırken hata:", error);
      } finally {
        setUserStatsLoading(false);
        setAccountStatsLoading(false);
      }
    }
  };

  const clearDateFilter = async () => {
    setStartDate("");
    setEndDate("");
    if (selectedUser) {
      setUserStatsLoading(true);
      setAccountStatsLoading(true);
      try {
        const [userData, pairData, accountData] = await Promise.all([
          getUserStatistics(selectedUser),
          getUserPairStatistics(selectedUser),
          getUserAccountStatistics(selectedUser),
        ]);
        setUserStatistics(userData);
        setUserPairStatistics(pairData.pair_statistics || []);
        setAccountStatistics(accountData.account_statistics || []);
      } catch (error) {
        console.error("Filtre temizlenirken hata:", error);
      } finally {
        setUserStatsLoading(false);
        setAccountStatsLoading(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin-login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center"></div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Ana Sayfa
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Görünüm Seçimi */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">İstatistik Görünümü</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setStatisticsView("pair")}
                className={`px-4 py-2 font-semibold rounded-lg ${
                  statisticsView === "pair"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Parite Bazlı
              </button>
              <button
                onClick={() => setStatisticsView("user")}
                className={`px-4 py-2 font-semibold rounded-lg ${
                  statisticsView === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Kullanıcı Bazlı
              </button>
            </div>
          </div>

          {/* Parite Bazlı İstatistikler */}
          {statisticsView === "pair" && (
            <div className="space-y-6">
              {/* Parite Seçimi */}
              <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Parite Seçimi</h3>
                <div className="relative dropdown-container">
                  <button
                    onClick={() => setShowPairDropdown(!showPairDropdown)}
                    className="w-full md:w-64 bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                  >
                    <span>
                      {selectedPairForStats === null
                        ? "Tüm Pariteler"
                        : pairs.find((p) => p.id === selectedPairForStats)
                            ?.name || "Parite Seçin"}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        showPairDropdown ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showPairDropdown && (
                    <div className="absolute z-10 w-full md:w-64 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSelectedPairForStats(null);
                          setShowPairDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-600 text-white border-b border-gray-600"
                      >
                        Tüm Pariteler
                      </button>
                      {pairs.map((pair) => (
                        <button
                          key={pair.id}
                          onClick={() => {
                            setSelectedPairForStats(pair.id);
                            setShowPairDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-600 text-white border-b border-gray-600 last:border-b-0"
                        >
                          {pair.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Parite İstatistikleri Tablosu */}
              <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold">
                    Parite İstatistikleri
                    {selectedPairForStats && (
                      <span className="text-blue-400 ml-2">
                        -{" "}
                        {pairs.find((p) => p.id === selectedPairForStats)?.name}
                      </span>
                    )}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Kullanıcı
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Hesap
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          VIP
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Parite
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Hacim
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Masraf
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          İade
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Satılan
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Ortalama
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Verimlilik
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Kar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {pairStatsLoading ? (
                        <tr>
                          <td colSpan={12} className="px-6 py-4 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                          </td>
                        </tr>
                      ) : (
                        pairStats
                          .filter(
                            (stat) =>
                              !selectedPairForStats ||
                              stat.pair_id === selectedPairForStats
                          )
                          .map((stat, index) => {
                            const efficiency =
                              stat.total_cost > 0
                                ? (stat.selled_dolar + stat.total_refund) /
                                    stat.total_cost -
                                  1
                                : 0;
                            const profit = stat.total_cost * efficiency;

                            return (
                              <tr key={index} className="hover:bg-gray-700">
                                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-white">
                                  {stat.user_name}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {stat.account_name}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-purple-400">
                                  {stat.vip || 0}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-blue-300 font-semibold">
                                  {stat.pair_name}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      stat.is_completed
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {stat.is_completed ? "Tamamlandı" : "Aktif"}
                                  </span>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {stat.total_volume?.toLocaleString() || "0"}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {stat.total_cost?.toLocaleString() || "0"}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {stat.total_refund?.toLocaleString() || "0"}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {stat.selled_dolar?.toLocaleString() || "0"}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {stat.avg_trade?.toFixed(4) || "0"}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm">
                                  <span
                                    className={
                                      efficiency >= 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }
                                  >
                                    {efficiency.toFixed(4)}
                                  </span>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm">
                                  <span
                                    className={
                                      profit >= 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }
                                  >
                                    ${profit.toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Toplam Tablosu */}
              {pairStats.length > 0 && (
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold">Toplam Özet</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Hacim
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Masraf
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            İade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Satılan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Ortalama
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Verimlilik
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Kar
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-semibold">
                            {(() => {
                              const filteredStats = pairStats.filter(
                                (stat) =>
                                  !selectedPairForStats ||
                                  stat.pair_id === selectedPairForStats
                              );
                              const totalVolume = filteredStats.reduce(
                                (sum: number, stat: PairStat) =>
                                  sum + (stat.total_volume || 0),
                                0
                              );
                              return totalVolume.toLocaleString();
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-semibold">
                            $
                            {(() => {
                              const filteredStats = pairStats.filter(
                                (stat) =>
                                  !selectedPairForStats ||
                                  stat.pair_id === selectedPairForStats
                              );
                              const totalCost = filteredStats.reduce(
                                (sum: number, stat: PairStat) =>
                                  sum + (stat.total_cost || 0),
                                0
                              );
                              return totalCost.toFixed(2);
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-semibold">
                            $
                            {(() => {
                              const filteredStats = pairStats.filter(
                                (stat) =>
                                  !selectedPairForStats ||
                                  stat.pair_id === selectedPairForStats
                              );
                              const totalRefund = filteredStats.reduce(
                                (sum: number, stat: PairStat) =>
                                  sum + (stat.total_refund || 0),
                                0
                              );
                              return totalRefund.toFixed(2);
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-semibold">
                            $
                            {(() => {
                              const filteredStats = pairStats.filter(
                                (stat) =>
                                  !selectedPairForStats ||
                                  stat.pair_id === selectedPairForStats
                              );
                              const totalSelled = filteredStats.reduce(
                                (sum: number, stat: PairStat) =>
                                  sum + (stat.selled_dolar || 0),
                                0
                              );
                              return totalSelled.toFixed(2);
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-semibold">
                            {(() => {
                              const filteredStats = pairStats.filter(
                                (stat) =>
                                  !selectedPairForStats ||
                                  stat.pair_id === selectedPairForStats
                              );
                              const totalVolume = filteredStats.reduce(
                                (sum: number, stat: PairStat) =>
                                  sum + (stat.total_volume || 0),
                                0
                              );
                              const totalCost = filteredStats.reduce(
                                (sum: number, stat: PairStat) =>
                                  sum + (stat.total_cost || 0),
                                0
                              );
                              const avgTrade =
                                totalVolume > 0
                                  ? totalCost / (totalVolume / 1000)
                                  : 0;
                              return avgTrade.toFixed(4);
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                            <span
                              className={(() => {
                                const filteredStats = pairStats.filter(
                                  (stat) =>
                                    !selectedPairForStats ||
                                    stat.pair_id === selectedPairForStats
                                );
                                const totalCost = filteredStats.reduce(
                                  (sum: number, stat: PairStat) =>
                                    sum + (stat.total_cost || 0),
                                  0
                                );
                                const totalRefund = filteredStats.reduce(
                                  (sum: number, stat: PairStat) =>
                                    sum + (stat.total_refund || 0),
                                  0
                                );
                                const totalSelled = filteredStats.reduce(
                                  (sum: number, stat: PairStat) =>
                                    sum + (stat.selled_dolar || 0),
                                  0
                                );
                                const efficiency =
                                  totalCost > 0
                                    ? (totalRefund + totalSelled) / totalCost -
                                      1
                                    : 0;
                                return efficiency >= 0
                                  ? "text-green-400"
                                  : "text-red-400";
                              })()}
                            >
                              {(() => {
                                const filteredStats = pairStats.filter(
                                  (stat) =>
                                    !selectedPairForStats ||
                                    stat.pair_id === selectedPairForStats
                                );
                                const totalCost = filteredStats.reduce(
                                  (sum: number, stat: PairStat) =>
                                    sum + (stat.total_cost || 0),
                                  0
                                );
                                const totalRefund = filteredStats.reduce(
                                  (sum: number, stat: PairStat) =>
                                    sum + (stat.total_refund || 0),
                                  0
                                );
                                const totalSelled = filteredStats.reduce(
                                  (sum: number, stat: PairStat) =>
                                    sum + (stat.selled_dolar || 0),
                                  0
                                );
                                const efficiency =
                                  totalCost > 0
                                    ? (totalRefund + totalSelled) / totalCost -
                                      1
                                    : 0;
                                return efficiency.toFixed(4);
                              })()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                            <span
                              className={(() => {
                                const filteredStats = pairStats.filter(
                                  (stat) =>
                                    !selectedPairForStats ||
                                    stat.pair_id === selectedPairForStats
                                );
                                const totalCost = filteredStats.reduce(
                                  (sum: number, stat: PairStat) =>
                                    sum + (stat.total_cost || 0),
                                  0
                                );
                                const totalRefund = filteredStats.reduce(
                                  (sum: number, stat: PairStat) =>
                                    sum + (stat.total_refund || 0),
                                  0
                                );
                                const totalSelled = filteredStats.reduce(
                                  (sum: number, stat: PairStat) =>
                                    sum + (stat.selled_dolar || 0),
                                  0
                                );
                                const profit =
                                  totalSelled + totalRefund - totalCost;
                                return profit >= 0
                                  ? "text-green-400"
                                  : "text-red-400";
                              })()}
                            >
                              $
                              {(() => {
                                const filteredStats = pairStats.filter(
                                  (stat) =>
                                    !selectedPairForStats ||
                                    stat.pair_id === selectedPairForStats
                                );
                                const totalCost = filteredStats.reduce(
                                  (sum: number, stat: PairStat) =>
                                    sum + (stat.total_cost || 0),
                                  0
                                );
                                const totalRefund = filteredStats.reduce(
                                  (sum: number, stat: PairStat) =>
                                    sum + (stat.total_refund || 0),
                                  0
                                );
                                const totalSelled = filteredStats.reduce(
                                  (sum: number, stat: PairStat) =>
                                    sum + (stat.selled_dolar || 0),
                                  0
                                );
                                const profit =
                                  totalSelled + totalRefund - totalCost;
                                return profit.toFixed(2);
                              })()}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Kullanıcı Bazlı İstatistikler */}
          {statisticsView === "user" && (
            <div className="space-y-6">
              {/* Kullanıcı Seçimi */}
              <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Kullanıcı Seçimi</h3>
                <div className="relative dropdown-container">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="w-full md:w-64 bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                  >
                    <span>
                      {selectedUser === null
                        ? "Kullanıcı Seçin"
                        : users.find((u) => u.id === selectedUser)?.username ||
                          "Kullanıcı Seçin"}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        showUserDropdown ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showUserDropdown && (
                    <div className="absolute z-10 w-full md:w-64 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {users.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            handleUserSelect(user.id);
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-600 text-white border-b border-gray-600 last:border-b-0"
                        >
                          {user.username}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Seçili Kullanıcı İstatistikleri */}
              {selectedUser && userStatistics && (
                <div className="space-y-6">
                  {/* Zaman Filtreleri */}
                  <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Zaman Filtreleri
                    </h3>
                    <div className="flex flex-wrap gap-4 items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Başlangıç Tarihi
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Bitiş Tarihi
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDateFilter}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                        >
                          Filtrele
                        </button>
                        <button
                          onClick={clearDateFilter}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                        >
                          Temizle
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Toplam Özet Tablosu */}
                  <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-700">
                      <h3 className="text-lg font-semibold">Toplam Özet</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Toplam Hacim
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Toplam Masraf
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Toplam İade
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Toplam Satılan
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Ortalama Trade
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Verimlilik
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Kar/Zarar
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {userStatistics.statistics.total_volume.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              ${userStatistics.statistics.total_cost.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              $
                              {userStatistics.statistics.total_refund.toFixed(
                                2
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              $
                              {userStatistics.statistics.total_selled_dolar.toFixed(
                                2
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {userStatistics.statistics.avg_trade.toFixed(4)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={
                                  userStatistics.statistics.efficiency >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                {userStatistics.statistics.efficiency.toFixed(
                                  4
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={
                                  userStatistics.statistics.profit >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                ${userStatistics.statistics.profit.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Genel İstatistikler */}
                  <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      {userStatistics.user.username} - Genel İstatistikler
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-sm text-gray-400">
                          Toplam Hesaplar
                        </div>
                        <div className="text-2xl font-bold text-blue-400">
                          {userStatistics.statistics.total_accounts}
                        </div>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-sm text-gray-400">
                          Toplam Pariteler
                        </div>
                        <div className="text-2xl font-bold text-purple-400">
                          {userStatistics.statistics.total_pairs}
                        </div>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-sm text-gray-400">
                          Aktif Pariteler
                        </div>
                        <div className="text-2xl font-bold text-yellow-400">
                          {userStatistics.statistics.active_pairs}
                        </div>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-sm text-gray-400">Tamamlanan</div>
                        <div className="text-2xl font-bold text-green-400">
                          {userStatistics.statistics.completed_pairs}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parite Bazlı İstatistikler */}
                  <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-700">
                      <h3 className="text-lg font-semibold">
                        {userStatistics.user.username} - Parite Bazlı
                        İstatistikler
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Parite
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Hacim
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Masraf
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              İade
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Satılan
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Ortalama
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Verimlilik
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Kar
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Durum
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                          {userStatsLoading ? (
                            <tr>
                              <td colSpan={9} className="px-6 py-4 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                              </td>
                            </tr>
                          ) : (
                            userPairStatistics.map((stat, index) => (
                              <tr key={index} className="hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-300">
                                  {stat.pair_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {stat.total_volume.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                  ${stat.total_cost.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                  ${stat.total_refund.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                  ${stat.total_selled_dolar.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {stat.avg_trade.toFixed(4)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span
                                    className={
                                      stat.efficiency >= 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }
                                  >
                                    {(stat.efficiency || 0).toFixed(4)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span
                                    className={
                                      stat.profit >= 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }
                                  >
                                    ${stat.profit.toFixed(2)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-xs text-yellow-400">
                                      Aktif: {stat.active_accounts}
                                    </span>
                                    <span className="text-xs text-green-400">
                                      Tamamlanan: {stat.completed_accounts}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Hesap Bazlı İstatistikler */}
                  <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        {userStatistics.user.username} - Hesap Bazlı
                        İstatistikler
                      </h3>
                      <button
                        onClick={() =>
                          setShowAccountDetails(!showAccountDetails)
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        {showAccountDetails ? "Gizle" : "Göster"}
                      </button>
                    </div>
                    {showAccountDetails && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                          <thead className="bg-gray-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Hesap Adı
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                VIP
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Parite Sayısı
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Hacim
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Masraf
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                İade
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Satılan
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Ortalama
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Verimlilik
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Kar
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Durum
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {accountStatsLoading ? (
                              <tr>
                                <td
                                  colSpan={11}
                                  className="px-6 py-4 text-center"
                                >
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                </td>
                              </tr>
                            ) : (
                              accountStatistics.map((stat, index) => (
                                <tr key={index} className="hover:bg-gray-700">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-300">
                                    {stat.account_name || "N/A"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-400">
                                    {stat.vip || 0}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {stat.total_pairs || 0}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {(stat.total_volume || 0).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    ${(stat.total_cost || 0).toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    ${(stat.total_refund || 0).toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    ${(stat.total_selled_dolar || 0).toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {(stat.avg_trade || 0).toFixed(4)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span
                                      className={
                                        (stat.efficiency || 0) >= 0
                                          ? "text-green-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {(stat.efficiency || 0).toFixed(4)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span
                                      className={
                                        (stat.profit || 0) >= 0
                                          ? "text-green-400"
                                          : "text-red-400"
                                      }
                                    >
                                      ${(stat.profit || 0).toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs text-yellow-400">
                                        Aktif: {stat.active_pairs || 0}
                                      </span>
                                      <span className="text-xs text-green-400">
                                        Tamamlanan: {stat.completed_pairs || 0}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;
