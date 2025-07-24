import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getStatistics, getUserPairList } from "../services/api";
import { StatisticsRow } from "../types";

interface PairListItem {
  pair_id: number;
  pair_name: string;
  is_completed: number;
}

interface UserSummary {
  account_name: string;
  user_name: string;
  total_volume: number;
  total_cost: number;
  avg_trade: number;
  active_volume: number;
  active_cost: number;
  completed_volume: number;
  completed_cost: number;
}

const Statistics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"genel" | "parite">("parite");
  const [statistics, setStatistics] = useState<StatisticsRow[]>([]);
  const [pairList, setPairList] = useState<{
    activePairs: PairListItem[];
    completedPairs: PairListItem[];
  }>({ activePairs: [], completedPairs: [] });
  const [selectedPairId, setSelectedPairId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Zaman aralığı seçimi için state'ler
  const [dateRange, setDateRange] = useState<
    "7gün" | "30gün" | "3ay" | "6ay" | "1yıl" | "tümü"
  >("tümü");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [useCustomRange, setUseCustomRange] = useState<boolean>(false);

  // Parite listesi ve istatistikleri çek
  useEffect(() => {
    setLoading(true);
    getUserPairList()
      .then((res) => {
        setPairList(res);
        // Varsayılan olarak ilk aktif pariteyi seç
        if (res.activePairs && res.activePairs.length > 0) {
          setSelectedPairId(res.activePairs[0].pair_id);
        } else if (res.completedPairs && res.completedPairs.length > 0) {
          setSelectedPairId(res.completedPairs[0].pair_id);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("getUserPairList error:", error);
        setError("Parite listesi alınamadı: " + error.message);
        setLoading(false);
      });
  }, []);

  // Sekme başlığını ayarla
  useEffect(() => {
    document.title = "İstatistikler";
    return () => {
      document.title = "Trade Panel";
    };
  }, []);

  // Seçili pariteye ait istatistikleri çek
  useEffect(() => {
    if (activeTab !== "parite") return;
    if (selectedPairId == null) return;
    setLoading(true);
    setError(null);
    getStatistics(selectedPairId)
      .then((res) => {
        setStatistics(res.statistics || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("getStatistics error:", error);
        setError("Veriler alınamadı: " + error.message);
        setLoading(false);
      });
  }, [selectedPairId, activeTab]);

  // Tüm istatistikleri çek (genel istatistikler için)
  useEffect(() => {
    if (activeTab === "genel") {
      setLoading(true);
      setError(null);
      getStatistics() // Genel istatistikler için pairId gönderme
        .then((res) => {
          setStatistics(res.statistics || []);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Genel istatistikler error:", error);
          setError("Veriler alınamadı: " + error.message);
          setLoading(false);
        });
    }
  }, [activeTab, dateRange, useCustomRange, customStartDate, customEndDate]);

  // Seçili pariteye ait istatistikler
  const filtered = statistics.filter((row) => row.pair_id === selectedPairId);

  // Toplamlar
  const total = filtered.reduce(
    (acc, row) => {
      acc.total_volume += row.total_volume || 0;
      acc.total_cost += row.total_cost || 0;
      acc.total_refund += row.total_refund || 0;
      acc.selled_dolar += row.selled_dolar || 0;
      acc.avg_trade += row.avg_trade || 0;
      return acc;
    },
    {
      total_volume: 0,
      total_cost: 0,
      total_refund: 0,
      selled_dolar: 0,
      avg_trade: 0,
    }
  );

  // Toplam satırı için verimlilik ve trade ortalaması
  const totalVerimlilik = total.total_cost
    ? (total.selled_dolar + total.total_refund) / total.total_cost - 1
    : 0;
  const totalAvgTrade = total.total_volume
    ? (total.total_cost / total.total_volume) * 1000
    : 0;

  // Net kar hesaplama: toplam masraf * toplam verimlilik
  const netKar = total.total_cost * totalVerimlilik;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18192a] to-[#23243a] text-gray-100 flex flex-col">
      <Navbar onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}>
        <Link
          to="/istatistikler"
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 md:px-6 py-2 rounded-xl font-semibold shadow transition text-sm md:text-base"
        >
          İstatistikler
        </Link>
      </Navbar>

      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed md:relative inset-y-0 left-0 z-10 w-64 md:w-72 bg-[#20213a] border-r border-[#2d2e4a] flex flex-col p-4 md:p-6 min-h-screen pt-16 md:pt-12 transition-transform duration-300 ease-in-out`}
        >
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute top-4 right-4 p-2 rounded-lg bg-[#23243a] hover:bg-[#2d2e4a] transition"
          >
            <svg
              className="w-5 h-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <button
            className={`w-full mb-3 md:mb-4 py-2.5 md:py-3 rounded-xl font-semibold text-sm md:text-base transition shadow ${
              activeTab === "genel"
                ? "bg-blue-600 text-white"
                : "bg-[#23243a] text-blue-300 hover:bg-blue-700/40"
            }`}
            onClick={() => {
              setActiveTab("genel");
              setSidebarOpen(false);
            }}
          >
            Genel İstatistikler
          </button>
          <button
            className={`w-full mb-3 md:mb-4 py-2.5 md:py-3 rounded-xl font-semibold text-sm md:text-base transition shadow ${
              activeTab === "parite"
                ? "bg-blue-600 text-white"
                : "bg-[#23243a] text-blue-300 hover:bg-blue-700/40"
            }`}
            onClick={() => {
              setActiveTab("parite");
              setSidebarOpen(false);
            }}
          >
            Parite Bazlı İstatistikler
          </button>
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-15"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Ana İçerik */}
        <div className="flex-1 flex flex-col min-h-screen bg-transparent">
          {/* Başlık */}
          <div className="flex items-center w-full justify-center mt-4 md:mt-8 mb-4 px-4">
            <h1 className="text-lg md:text-2xl font-extrabold text-blue-200 tracking-wide text-center">
              {activeTab === "genel"
                ? "Genel İstatistikler"
                : "Parite Bazlı İstatistikler"}
            </h1>
          </div>

          {/* Hata Mesajı */}
          {error && (
            <div className="mx-6 mb-6 p-4 bg-red-600 rounded-lg text-white">
              {error}
            </div>
          )}

          {/* İçerik */}
          <div className="flex flex-col xl:flex-row w-full justify-center px-3 md:px-6 gap-4">
            {/* Parite Listesi */}
            {activeTab === "parite" && (
              <div className="w-full xl:w-64 min-h-[250px] xl:min-h-[400px] bg-[#20213a] border border-[#2d2e4a] xl:border-r xl:border-b-0 flex flex-col p-3 md:p-4 rounded-xl shadow-lg h-fit self-start">
                <div className="mb-2 text-sm md:text-base font-bold text-green-300">
                  AKTİF PARİTELER
                </div>
                <div className="flex flex-col gap-1 mb-4 md:mb-6">
                  {pairList.activePairs && pairList.activePairs.length > 0 ? (
                    pairList.activePairs.map((pair) => (
                      <button
                        key={pair.pair_id}
                        className={`text-left px-2 md:px-3 py-1.5 md:py-2 rounded-lg font-semibold transition border-none outline-none text-xs md:text-sm ${
                          selectedPairId === pair.pair_id
                            ? "bg-blue-700 text-white"
                            : "text-green-400 hover:bg-blue-900/30"
                        }`}
                        onClick={() => setSelectedPairId(pair.pair_id)}
                      >
                        {pair.pair_name}
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 px-2 py-1">
                      Aktif parite bulunamadı
                    </div>
                  )}
                </div>
                <div className="mb-2 text-sm md:text-base font-bold text-red-300">
                  BİTEN PARİTELER
                </div>
                <div className="flex flex-col gap-1">
                  {pairList.completedPairs &&
                  pairList.completedPairs.length > 0 ? (
                    pairList.completedPairs.map((pair) => (
                      <button
                        key={pair.pair_id}
                        className={`text-left px-2 md:px-3 py-1.5 md:py-2 rounded-lg font-semibold transition border-none outline-none text-xs md:text-sm ${
                          selectedPairId === pair.pair_id
                            ? "bg-blue-700 text-white"
                            : "text-red-400 hover:bg-blue-900/30"
                        }`}
                        onClick={() => setSelectedPairId(pair.pair_id)}
                      >
                        {pair.pair_name}
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 px-2 py-1">
                      Biten parite bulunamadı
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tablo Alanı */}
            <div className="flex-1 flex flex-col items-center justify-start w-full max-w-7xl mx-auto m-0 p-0">
              {activeTab === "parite" && (
                <div className="w-full px-0 m-0">
                  {loading ? (
                    <div className="bg-[#20213a] rounded-xl shadow-lg border border-[#2d2e4a] p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                      <div className="text-gray-400">
                        İstatistikler yükleniyor...
                      </div>
                    </div>
                  ) : selectedPairId === null ? (
                    <div className="bg-[#20213a] rounded-xl shadow-lg border border-[#2d2e4a] p-8 text-center">
                      <div className="text-gray-400">
                        Lütfen bir parite seçin
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl shadow-lg border border-[#2d2e4a] bg-[#20213a] m-0">
                      <table className="min-w-full text-xs md:text-sm text-center m-0">
                        <thead>
                          <tr className="bg-[#23243a] text-blue-200">
                            <th className="py-2 md:py-3 px-1 md:px-2 whitespace-nowrap">
                              Hesap
                            </th>
                            <th className="py-2 md:py-3 px-1 md:px-2 whitespace-nowrap">
                              Hacim
                            </th>
                            <th className="py-2 md:py-3 px-1 md:px-2 whitespace-nowrap">
                              Masraf
                            </th>
                            <th className="py-2 md:py-3 px-1 md:px-2 whitespace-nowrap">
                              İade
                            </th>
                            <th className="py-2 md:py-3 px-1 md:px-2 whitespace-nowrap">
                              Satılan
                            </th>
                            <th className="py-2 md:py-3 px-1 md:px-2 whitespace-nowrap">
                              Ortalama
                            </th>
                            <th className="py-2 md:py-3 px-1 md:px-2 whitespace-nowrap">
                              Verimlilik
                            </th>
                            <th className="py-2 md:py-3 px-1 md:px-2 whitespace-nowrap">
                              Durum
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((row, i) => {
                            const verimlilik = row.total_cost
                              ? (row.selled_dolar + row.total_refund) /
                                  row.total_cost -
                                1
                              : 0;
                            return (
                              <tr
                                key={row.id}
                                className="border-b border-[#23243a] hover:bg-[#23243a]/60 transition"
                              >
                                <td className="py-2 px-1 md:px-2 font-semibold text-blue-100 text-xs md:text-sm whitespace-nowrap">
                                  {row.account_name}
                                </td>
                                <td className="py-2 px-1 md:px-2 text-xs md:text-sm whitespace-nowrap">
                                  {row.total_volume?.toLocaleString("tr-TR", {
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="py-2 px-1 md:px-2 text-xs md:text-sm whitespace-nowrap">
                                  {row.total_cost?.toLocaleString("tr-TR", {
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="py-2 px-1 md:px-2 text-xs md:text-sm whitespace-nowrap">
                                  {row.total_refund?.toLocaleString("tr-TR", {
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="py-2 px-1 md:px-2 text-xs md:text-sm whitespace-nowrap">
                                  {row.selled_dolar?.toLocaleString("tr-TR", {
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="py-2 px-1 md:px-2 text-xs md:text-sm whitespace-nowrap">
                                  {row.avg_trade?.toFixed(4)}
                                </td>
                                <td
                                  className={`py-2 px-1 md:px-2 font-bold text-xs md:text-sm whitespace-nowrap ${
                                    verimlilik > 0
                                      ? "text-green-400"
                                      : verimlilik < 0
                                      ? "text-red-400"
                                      : "text-gray-300"
                                  }`}
                                >
                                  {verimlilik.toFixed(4)}
                                </td>
                                <td
                                  className={`py-2 px-1 md:px-2 font-bold text-xs md:text-sm whitespace-nowrap ${
                                    row.is_completed
                                      ? "text-red-400"
                                      : "text-green-400"
                                  }`}
                                >
                                  {row.is_completed ? "Bitti" : "Aktif"}
                                </td>
                              </tr>
                            );
                          })}
                          {/* Toplam satırı */}
                          <tr className="bg-[#23243a] text-yellow-300 font-extrabold border-t-2 border-blue-700">
                            <td className="py-2 px-1 md:px-2 text-xs md:text-sm whitespace-nowrap">
                              TOPLAM
                            </td>
                            <td className="py-2 px-1 md:px-2 text-xs md:text-sm whitespace-nowrap">
                              {total.total_volume.toLocaleString("tr-TR", {
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-2 px-1 md:px-2 text-xs md:text-sm whitespace-nowrap">
                              {total.total_cost.toLocaleString("tr-TR", {
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-2 px-1 md:px-2 text-xs md:text-sm whitespace-nowrap">
                              {total.total_refund.toLocaleString("tr-TR", {
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-2 px-1 md:px-2 text-xs md:text-sm whitespace-nowrap">
                              {total.selled_dolar.toLocaleString("tr-TR", {
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-2 px-1 md:px-2 text-xs md:text-sm whitespace-nowrap">
                              {totalAvgTrade.toFixed(4)}
                            </td>
                            <td
                              className={`py-2 px-1 md:px-2 font-bold text-xs md:text-sm whitespace-nowrap ${
                                totalVerimlilik > 0
                                  ? "text-green-400"
                                  : totalVerimlilik < 0
                                  ? "text-red-400"
                                  : "text-gray-300"
                              }`}
                            >
                              {totalVerimlilik.toFixed(4)}
                            </td>
                            <td
                              className="py-2 px-1 md:px-2 text-xs md:text-sm"
                              colSpan={2}
                            ></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* Net Kar */}
                  {selectedPairId && !loading && (
                    <div className="w-full flex justify-end mt-2 pr-2">
                      <span className="text-sm md:text-lg font-bold text-yellow-300 bg-[#23243a] rounded-lg px-3 md:px-4 py-2 shadow">
                        Net Kar ={" "}
                        {netKar.toLocaleString("tr-TR", {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "genel" && (
                <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 mt-2 md:mt-4">
                  {/* Hesap İstatistikleri */}
                  <div className="bg-[#23243a] rounded-2xl shadow-lg p-6">
                    <div className="text-xl font-bold text-center text-blue-200 mb-4">
                      Hesap İstatistikleri
                    </div>
                    <table className="min-w-full text-sm text-center">
                      <thead>
                        <tr className="bg-[#20213a] text-blue-100">
                          <th className="py-2 px-4">Hesap</th>
                          <th className="py-2 px-4">Toplam Hacim</th>
                          <th className="py-2 px-4">Toplam Masraf</th>
                          <th className="py-2 px-4">Trade Ortalaması</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statistics.length > 0 ? (
                          statistics
                            .reduce(
                              (
                                acc: {
                                  account_name: string;
                                  total_volume: number;
                                  total_cost: number;
                                  avg_trade: number;
                                }[],
                                row
                              ) => {
                                // Her hesap için tek satır (parite bağımsız)
                                const found = acc.find(
                                  (a) => a.account_name === row.account_name
                                );
                                if (!found) {
                                  acc.push({
                                    account_name: row.account_name,
                                    total_volume: row.total_volume || 0,
                                    total_cost: row.total_cost || 0,
                                    avg_trade: 0, // Başlangıçta 0, sonra hesaplanacak
                                  });
                                } else {
                                  found.total_volume += row.total_volume || 0;
                                  found.total_cost += row.total_cost || 0;
                                }
                                return acc;
                              },
                              []
                            )
                            .map((row, i) => {
                              // Trade ortalamasını doğru formülle hesapla
                              const avgTrade =
                                row.total_volume > 0
                                  ? (row.total_cost / row.total_volume) * 1000
                                  : 0;
                              return (
                                <tr
                                  key={i}
                                  className="border-b border-[#20213a]"
                                >
                                  <td className="py-2 px-4 font-semibold text-blue-100">
                                    {row.account_name}
                                  </td>
                                  <td className="py-2 px-4">
                                    {row.total_volume.toLocaleString("tr-TR")}
                                  </td>
                                  <td className="py-2 px-4">
                                    {row.total_cost.toLocaleString("tr-TR")}
                                  </td>
                                  <td className="py-2 px-4">
                                    {avgTrade.toFixed(4)}
                                  </td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-4 text-gray-400">
                              Veri yok
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Aktif Pariteler */}
                  <div className="bg-[#23243a] rounded-2xl shadow-lg p-6">
                    <div className="text-xl font-bold text-center text-green-300 mb-4">
                      Aktif Pariteler
                    </div>
                    <table className="min-w-full text-sm text-center">
                      <thead>
                        <tr className="bg-[#20213a] text-blue-100">
                          <th className="py-2 px-4">Hesap</th>
                          <th className="py-2 px-4">Toplam Hacim</th>
                          <th className="py-2 px-4">Toplam Masraf</th>
                          <th className="py-2 px-4">Trade Ortalaması</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statistics.filter((row) => row.is_completed === 0)
                          .length > 0 ? (
                          statistics
                            .filter((row) => row.is_completed === 0)
                            .reduce(
                              (
                                acc: {
                                  account_name: string;
                                  total_volume: number;
                                  total_cost: number;
                                  avg_trade: number;
                                }[],
                                row
                              ) => {
                                const found = acc.find(
                                  (a) => a.account_name === row.account_name
                                );
                                if (!found) {
                                  acc.push({
                                    account_name: row.account_name,
                                    total_volume: row.total_volume || 0,
                                    total_cost: row.total_cost || 0,
                                    avg_trade: 0, // Başlangıçta 0, sonra hesaplanacak
                                  });
                                } else {
                                  found.total_volume += row.total_volume || 0;
                                  found.total_cost += row.total_cost || 0;
                                }
                                return acc;
                              },
                              []
                            )
                            .map((row, i) => {
                              // Trade ortalamasını doğru formülle hesapla
                              const avgTrade =
                                row.total_volume > 0
                                  ? (row.total_cost / row.total_volume) * 1000
                                  : 0;
                              return (
                                <tr
                                  key={i}
                                  className="border-b border-[#20213a]"
                                >
                                  <td className="py-2 px-4 font-semibold text-blue-100">
                                    {row.account_name}
                                  </td>
                                  <td className="py-2 px-4">
                                    {row.total_volume.toLocaleString("tr-TR")}
                                  </td>
                                  <td className="py-2 px-4">
                                    {row.total_cost.toLocaleString("tr-TR")}
                                  </td>
                                  <td className="py-2 px-4">
                                    {avgTrade.toFixed(4)}
                                  </td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-4 text-gray-400">
                              Veri yok
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Biten Pariteler */}
                  <div className="bg-[#23243a] rounded-2xl shadow-lg p-6">
                    <div className="text-xl font-bold text-center text-red-300 mb-4">
                      Biten Pariteler
                    </div>
                    <table className="min-w-full text-sm text-center">
                      <thead>
                        <tr className="bg-[#20213a] text-blue-100">
                          <th className="py-2 px-4">Hesap</th>
                          <th className="py-2 px-4">Toplam Hacim</th>
                          <th className="py-2 px-4">Toplam Masraf</th>
                          <th className="py-2 px-4">Trade Ortalaması</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statistics.filter((row) => row.is_completed === 1)
                          .length > 0 ? (
                          statistics
                            .filter((row) => row.is_completed === 1)
                            .reduce(
                              (
                                acc: {
                                  account_name: string;
                                  total_volume: number;
                                  total_cost: number;
                                  avg_trade: number;
                                }[],
                                row
                              ) => {
                                const found = acc.find(
                                  (a) => a.account_name === row.account_name
                                );
                                if (!found) {
                                  acc.push({
                                    account_name: row.account_name,
                                    total_volume: row.total_volume || 0,
                                    total_cost: row.total_cost || 0,
                                    avg_trade: 0, // Başlangıçta 0, sonra hesaplanacak
                                  });
                                } else {
                                  found.total_volume += row.total_volume || 0;
                                  found.total_cost += row.total_cost || 0;
                                }
                                return acc;
                              },
                              []
                            )
                            .map((row, i) => {
                              // Trade ortalamasını doğru formülle hesapla
                              const avgTrade =
                                row.total_volume > 0
                                  ? (row.total_cost / row.total_volume) * 1000
                                  : 0;
                              return (
                                <tr
                                  key={i}
                                  className="border-b border-[#20213a]"
                                >
                                  <td className="py-2 px-4 font-semibold text-blue-100">
                                    {row.account_name}
                                  </td>
                                  <td className="py-2 px-4">
                                    {row.total_volume.toLocaleString("tr-TR")}
                                  </td>
                                  <td className="py-2 px-4">
                                    {row.total_cost.toLocaleString("tr-TR")}
                                  </td>
                                  <td className="py-2 px-4">
                                    {avgTrade.toFixed(4)}
                                  </td>
                                </tr>
                              );
                            })
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-4 text-gray-400">
                              Veri yok
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Genel istatistikler için net kar */}
      {activeTab === "genel" && statistics.length > 0 && (
        <div className="w-full flex justify-end mt-2 pr-2">
          <span className="text-sm md:text-lg font-bold text-yellow-300 bg-[#23243a] rounded-lg px-3 md:px-4 py-2 shadow">
            Net Kar ={" "}
            {(() => {
              const totalCost = statistics.reduce(
                (sum, row) => sum + (row.total_cost || 0),
                0
              );
              const totalRefund = statistics.reduce(
                (sum, row) => sum + (row.total_refund || 0),
                0
              );
              const totalSelled = statistics.reduce(
                (sum, row) => sum + (row.selled_dolar || 0),
                0
              );
              const verimlilik = totalCost
                ? (totalSelled + totalRefund) / totalCost - 1
                : 0;
              const netKar = totalCost * verimlilik;
              return netKar.toLocaleString("tr-TR", {
                maximumFractionDigits: 2,
              });
            })()}
          </span>
        </div>
      )}
    </div>
  );
};

export default Statistics;
