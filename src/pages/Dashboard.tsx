import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  accountsApi,
  getAvailablePairs,
  addPairsToAccount,
  getUserPairs,
  completePair,
  resumePair,
  getPairDetails,
  getBybitPrice,
  updatePairPrice,
  startTrade,
  finishTrade,
  getTradeList,
  updateTrade,
  deleteTrade,
  updateUserPairReward,
} from "../services/api";
import TradeCard from "../components/TradeCard";

interface Account {
  id: number;
  name: string;
  created_at: string;
  vip?: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountVip, setNewAccountVip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showNavbarDropdown, setShowNavbarDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipModalAccountId, setVipModalAccountId] = useState<number | null>(
    null
  );
  const [vipModalValue, setVipModalValue] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPairModal, setShowPairModal] = useState(false);

  const [showActivePairs, setShowActivePairs] = useState(true);
  const [showCompletedPairs, setShowCompletedPairs] = useState(true);
  const [selectedPairs, setSelectedPairs] = useState<number[]>([]);
  const [addToAllAccounts, setAddToAllAccounts] = useState(false);
  const [pairLoading, setPairLoading] = useState(false);
  const [activePairs, setActivePairs] = useState<any[]>([]);
  const [completedPairs, setCompletedPairs] = useState<any[]>([]);
  const [availablePairs, setAvailablePairs] = useState<any[]>([]);
  const [pairDetail, setPairDetail] = useState<any | null>(null);
  const [pairDetailLoading, setPairDetailLoading] = useState(false);
  const [pairDetailError, setPairDetailError] = useState("");
  const [priceLoading, setPriceLoading] = useState(false);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeList, setTradeList] = useState<any[]>([]);
  const [entryBalance, setEntryBalance] = useState<number | "">("");

  const [showStartTradeModal, setShowStartTradeModal] = useState(false);

  const [totalReturn, setTotalReturn] = useState<number>(0);
  const [totalReturnLoading, setTotalReturnLoading] = useState<boolean>(false);
  const [pairReward, setPairReward] = useState<number>(0);
  const [instantReward, setInstantReward] = useState<number>(0);
  const [rewardInput, setRewardInput] = useState<string>("");
  const [rewardLoading, setRewardLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeModalPair, setCompleteModalPair] = useState<any>(null);
  const [soldAmount, setSoldAmount] = useState<string>("");
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeModalPair, setResumeModalPair] = useState<any>(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line
  }, []);

  const fetchAccounts = async (afterUpdateId?: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await accountsApi.getAll(token);
      console.log("Accounts response:", res.accounts); // VIP güncellendi mi kontrolü için
      setAccounts(res.accounts);
      // Seçili hesabı güncelle
      if (selectedAccount) {
        const updated = res.accounts.find(
          (a: Account) => a.id === selectedAccount.id
        );
        setSelectedAccount(updated || res.accounts[0] || null);
      } else {
        setSelectedAccount(res.accounts[0] || null);
      }
      // Başarı mesajı
      if (afterUpdateId) {
        showTimedMessage("Başarıyla güncellendi");
      }
    } catch (e) {
      setError("Hesaplar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccountName.trim() || !token) return;
    try {
      await accountsApi.create(newAccountName, newAccountVip, token);
      setNewAccountName("");
      setNewAccountVip(0);
      setShowAccountModal(false);
      fetchAccounts();
      showTimedMessage("Hesap başarıyla eklendi");
    } catch (e) {
      setError("Hesap eklenemedi.");
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!token) return;
    if (!window.confirm("Bu hesabı silmek istediğinizden emin misiniz?"))
      return;
    try {
      await accountsApi.delete(id, token);
      fetchAccounts();
      showTimedMessage("Hesap başarıyla silindi");
    } catch (e) {
      setError("Hesap silinemedi.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Sağ panelde detaylı trade paneli
  const pair = pairDetail;

  const handleOpenPairModal = async () => {
    if (!selectedAccount) {
      showTimedMessage("Önce bir hesap seçin!");
      return;
    }

    try {
      const pairs = await getAvailablePairs(selectedAccount.id);
      setAvailablePairs(pairs);
      setShowPairModal(true);
    } catch (error: any) {
      showTimedMessage(`Hata: ${error.message}`);
    }
  };

  const fetchUserPairs = async () => {
    if (!selectedAccount) return;
    try {
      const data = await getUserPairs(selectedAccount.id);
      setActivePairs(data.activePairs || []);
      setCompletedPairs(data.completedPairs || []);
    } catch (error) {
      // Hata yönetimi
    }
  };

  useEffect(() => {
    fetchUserPairs();
    // eslint-disable-next-line
  }, [selectedAccount]);

  // Hesap veya aktif pariteler değişince ilk aktif parite otomatik seçilsin
  useEffect(() => {
    if (activePairs.length > 0) {
      setSelectedPairIndex(0);
      handleSelectPair(0);
    } else {
      setSelectedPairIndex(0);
      setPairDetail(null);
    }
    // eslint-disable-next-line
  }, [selectedAccount, activePairs]);

  const handleAddPairs = async () => {
    if (!selectedAccount) {
      showTimedMessage("Hesap seçilmedi!");
      return;
    }

    if (selectedPairs.length === 0) {
      showTimedMessage("En az bir parite seçin!");
      return;
    }

    setPairLoading(true);
    try {
      const result = await addPairsToAccount(
        selectedAccount.id,
        selectedPairs,
        addToAllAccounts
      );
      showTimedMessage(
        `Pariteler başarıyla eklendi! ${result.addedPairs} parite, ${result.targetAccounts} hesaba eklendi.`
      );
      setShowPairModal(false);
      setSelectedPairs([]);
      setAddToAllAccounts(false);
      if (addToAllAccounts) {
        // Tüm hesaplar için pariteleri güncelle
        for (const acc of accounts) {
          const data = await getUserPairs(acc.id);
          if (acc.id === selectedAccount.id) {
            setActivePairs(data.activePairs || []);
          }
        }
        showTimedMessage("Tüm hesaplarınızda pariteler güncellendi!");
      } else {
        await fetchUserPairs(); // Sadece aktif hesabı güncelle
      }
    } catch (error: any) {
      showTimedMessage(`Hata: ${error.message}`);
    } finally {
      setPairLoading(false);
    }
  };

  const handleSelectPair = async (idx: number) => {
    setPairDetailLoading(true);
    setTotalReturnLoading(true);
    setPairDetailError("");
    setPairDetail(null);
    setPriceLoading(true);
    try {
      const pair = activePairs[idx];
      if (!pair || !selectedAccount) return;
      const detail = await getPairDetails(selectedAccount.id, pair.id);
      setTotalReturn(detail.totalReturn || 0);
      setPairReward(detail.totalReward || detail.reward || 0);
      setInstantReward(detail.reward_amount || detail.reward || 0);
      setRewardInput("");
      setTimeout(() => setTotalReturnLoading(false), 300);
      // Sadece backend'deki mevcut fiyatı göster
      setPairDetail(detail);
      // Trade verilerini çek
      const data = await getTradeList(selectedAccount.id, pair.id);
      setTradeList(data.trades || []);
      setSelectedPairIndex(idx);
    } catch (e: any) {
      setPairDetailError(e.message || "Detaylar alınamadı");
      setTotalReturnLoading(false);
    } finally {
      setPairDetailLoading(false);
      setPriceLoading(false);
    }
  };

  const fetchTradeList = async () => {
    if (!selectedAccount || !activePairs[selectedPairIndex]) return;
    try {
      const data = await getTradeList(
        selectedAccount.id,
        activePairs[selectedPairIndex].id
      );
      setTradeList(data.trades || []);
    } catch (e) {
      setTradeList([]);
    }
  };

  useEffect(() => {
    fetchTradeList();
    // eslint-disable-next-line
  }, [selectedAccount, selectedPairIndex]);

  const handleFinishTrade = async (
    tradeId: number,
    exitBalance: number,
    exitVolume: number
  ) => {
    try {
      setTotalReturnLoading(true);
      await finishTrade(tradeId, exitBalance, exitVolume);
      showTimedMessage("Trade başarıyla bitirildi!");
      await fetchTradeList();
      await handleSelectPair(selectedPairIndex);
    } catch (error: any) {
      showTimedMessage(error.message || "Trade bitirilemedi!");
      setTotalReturnLoading(false);
    }
  };

  const handleEditTrade = async (tradeId: number, updates: any) => {
    try {
      setTotalReturnLoading(true);
      await updateTrade(tradeId, updates);
      showTimedMessage("Trade başarıyla güncellendi");
      setTimeout(() => setTotalReturnLoading(false), 1500);
      await fetchTradeList();
      await handleSelectPair(selectedPairIndex);
    } catch (error: any) {
      showTimedMessage(`Hata: ${error.message}`);
      setTotalReturnLoading(false);
    }
  };

  const handleDeleteTrade = async (tradeId: number) => {
    try {
      setTotalReturnLoading(true);
      await deleteTrade(tradeId);
      showTimedMessage("Trade başarıyla silindi");
      setTimeout(() => setTotalReturnLoading(false), 1500);
      await fetchTradeList();
      await handleSelectPair(selectedPairIndex);
    } catch (error: any) {
      showTimedMessage(`Hata: ${error.message}`);
      setTotalReturnLoading(false);
    }
  };

  // İstatistik hesaplamaları (dummy yerine gerçek veriler)
  const toplamOdul = pairReward;
  const toplamHacim = tradeList.length
    ? tradeList
        .filter((t) => t.is_completed)
        .reduce((sum, t) => sum + ((t.exit_volume ?? 0) - (t.volume ?? 0)), 0)
    : 0;
  const completedTrades = tradeList.filter((t) => t.is_completed);
  const toplamMasraf = completedTrades.length
    ? completedTrades.reduce(
        (sum, t) => sum + ((t.entry_balance ?? 0) - (t.exit_balance ?? 0)),
        0
      )
    : 0;
  const toplamIade = totalReturn;
  const tradeOrtalama = completedTrades.length
    ? (
        completedTrades.reduce((sum, t) => sum + (t.ratio ?? 0), 0) /
        completedTrades.length
      ).toFixed(4)
    : "-";
  const anlikOdul = instantReward;
  const anlikOdulDolar = pairDetail?.price ? anlikOdul * pairDetail.price : 0;
  const rr =
    toplamMasraf !== 0
      ? ((anlikOdulDolar + toplamIade) / toplamMasraf - 1).toFixed(2)
      : 0;

  // Aktif trade'i bul
  const aktifTrade = tradeList.find((t) => !t.is_completed);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [selectedTradeToFinish, setSelectedTradeToFinish] = useState<any>(null);

  const showTimedMessage = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18192a] to-[#23243a] text-gray-100">
      {/* Mobil Hamburger Menü */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#18192a] border-b border-[#23243a] sticky top-0 z-30">
        <span className="text-2xl font-extrabold text-blue-400 tracking-tight">
          Dashboard
        </span>
        <div className="flex items-center gap-2">
          {/* Hesap Butonu */}
          <button
            onClick={() => setShowNavbarDropdown((v) => !v)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold shadow transition text-sm"
          >
            Hesaplar
          </button>
          {/* İstatistikler Butonu */}
          <Link
            to="/istatistikler"
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-semibold shadow transition text-sm"
          >
            İstatistikler
          </Link>
          {/* Hamburger Menü */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="focus:outline-none p-1"
          >
            <svg
              className="w-6 h-6 text-blue-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobil Hesap Dropdown */}
      {showNavbarDropdown && (
        <div className="md:hidden fixed top-16 left-4 right-4 z-50 bg-[#23243a] border border-blue-700 rounded-2xl shadow-2xl p-3">
          <div className="mb-2 text-blue-300 font-bold text-sm px-2">
            Hesap İşlemleri
          </div>
          <button
            onClick={() => {
              setShowVipModal(true);
              setShowNavbarDropdown(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-blue-700 text-white rounded-lg transition text-sm"
          >
            VIP Güncelle
          </button>
          <button
            onClick={() => {
              setShowAccountModal(true);
              setShowNavbarDropdown(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-blue-700 text-white rounded-lg transition text-sm"
          >
            Hesap Ekle
          </button>
          <button
            onClick={() => {
              setShowDeleteModal(true);
              setShowNavbarDropdown(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-red-700 text-white rounded-lg transition text-sm"
          >
            Hesap Sil
          </button>
        </div>
      )}

      {/* Mobil Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden fixed inset-y-0 left-0 z-50 w-80 bg-[#20213a] border-r border-[#2d2e4a] flex flex-col transition-transform duration-300 ease-in-out`}
      >
        {/* Close button */}
        <div className="flex items-center justify-between p-4 border-b border-[#2d2e4a]">
          <span className="text-xl font-bold text-blue-400">Menü</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg bg-[#23243a] hover:bg-[#2d2e4a] transition"
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
        </div>

        {/* Navigation Links */}
        <div className="flex-1 p-4 space-y-4">
          {/* Hesap Yönetimi Bölümü */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wide px-2">
              Hesap Yönetimi
            </h3>
            <button
              onClick={() => {
                setShowVipModal(true);
                setSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-[#23243a] hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-3"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
              VIP Güncelle
            </button>
            <button
              onClick={() => {
                setShowAccountModal(true);
                setSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-[#23243a] hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-3"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Hesap Ekle
            </button>
            <button
              onClick={() => {
                setShowDeleteModal(true);
                setSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-[#23243a] hover:bg-red-700 text-white rounded-lg transition flex items-center gap-3"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Hesap Sil
            </button>
          </div>

          {/* İstatistikler Bölümü */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wide px-2">
              İstatistikler
            </h3>
            <Link
              to="/istatistikler"
              onClick={() => setSidebarOpen(false)}
              className="w-full text-left px-4 py-3 bg-[#23243a] hover:bg-purple-700 text-white rounded-lg transition flex items-center gap-3"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              İstatistikler
            </Link>
          </div>

          {/* Çıkış Bölümü */}
          <div className="space-y-2 pt-4 border-t border-[#2d2e4a]">
            <button
              onClick={() => {
                handleLogout();
                setSidebarOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-[#23243a] hover:bg-red-700 text-white rounded-lg transition flex items-center gap-3"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity duration-300 ${
          sidebarOpen ? "block md:hidden" : "hidden"
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      {/* Navbar */}
      <nav className="hidden md:flex w-full bg-[#18192a] border-b border-[#23243a] px-8 py-4 items-center justify-between sticky top-0 z-20 shadow-md">
        <Link
          to="/"
          className="text-3xl font-extrabold text-blue-400 tracking-tight hover:underline cursor-pointer"
        >
          Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNavbarDropdown((v) => !v)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold shadow transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              Hesaplar
            </button>
            {showNavbarDropdown && (
              <div className="absolute left-0 mt-2 w-64 bg-[#23243a] border border-blue-700 rounded-2xl shadow-2xl z-[9999] p-2 animate-fade-in">
                <div className="mb-2 text-blue-300 font-bold text-base px-2">
                  Hesaplar
                </div>
                <button
                  onClick={() => {
                    setShowVipModal(true);
                    setShowNavbarDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  VIP Güncelle
                </button>
                <button
                  onClick={() => {
                    setShowAccountModal(true);
                    setShowNavbarDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Hesap Ekle
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setShowNavbarDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Hesap Sil
                </button>
              </div>
            )}
          </div>
          <Link
            to="/istatistikler"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-semibold shadow transition"
          >
            İstatistikler
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold shadow transition"
          >
            Çıkış Yap
          </button>
        </div>
      </nav>
      {/* Hesap Ekleme Modalı */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-[#23243a] rounded-lg p-8 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold text-blue-300 mb-6">
              Yeni Hesap Ekle
            </h2>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Hesap Adı</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                placeholder="Hesap adı"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-300 mb-1">VIP Seviyesi</label>
              <input
                type="number"
                min={0}
                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                placeholder="VIP seviyesi (örn: 0, 1, 2...)"
                value={newAccountVip}
                onChange={(e) => setNewAccountVip(Number(e.target.value))}
              />
            </div>
            <div className="flex gap-4">
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
                onClick={handleAddAccount}
              >
                Ekle
              </button>
              <button
                className="flex-1 bg-gray-700 text-white py-2 rounded-lg font-semibold"
                onClick={() => setShowAccountModal(false)}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hesap Silme Modalı */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-[#23243a] rounded-lg p-8 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold text-red-400 mb-6">Hesap Sil</h2>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">
                Silmek istediğiniz hesabı seçin
              </label>
              <select
                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                value={accountToDelete?.id || ""}
                onChange={(e) => {
                  const acc = accounts.find(
                    (a) => a.id === Number(e.target.value)
                  );
                  setAccountToDelete(acc || null);
                }}
              >
                <option value="">Hesap seçin</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (VIP: {acc.vip ?? 0})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
                disabled={!accountToDelete}
                onClick={async () => {
                  if (!accountToDelete) return;
                  if (
                    window.confirm(
                      `${accountToDelete.name} hesabını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`
                    )
                  ) {
                    await handleDeleteAccount(accountToDelete.id);
                    setAccountToDelete(null);
                    setShowDeleteModal(false);
                  }
                }}
              >
                Sil
              </button>
              <button
                className="flex-1 bg-gray-700 text-white py-2 rounded-lg font-semibold"
                onClick={() => {
                  setShowDeleteModal(false);
                  setAccountToDelete(null);
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
      {/* VIP Güncelleme Modalı */}
      {showVipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-[#23243a] rounded-lg p-8 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold text-blue-300 mb-6">
              VIP Seviyesi Güncelle
            </h2>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Hesap Seç</label>
              <select
                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                value={vipModalAccountId || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setVipModalAccountId(id);
                  const acc = accounts.find((a) => a.id === id);
                  setVipModalValue(acc?.vip ?? 0);
                }}
              >
                <option value="">Hesap seçin</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (VIP: {acc.vip ?? 0})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-gray-300 mb-1">
                Yeni VIP Seviyesi
              </label>
              <input
                type="number"
                min={0}
                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                placeholder="VIP seviyesi"
                value={vipModalValue}
                onChange={(e) => setVipModalValue(Number(e.target.value))}
                disabled={!vipModalAccountId}
              />
            </div>
            <div className="flex gap-4">
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
                disabled={!vipModalAccountId}
                onClick={async () => {
                  if (!vipModalAccountId) return;
                  await accountsApi.updateVip(
                    vipModalAccountId,
                    vipModalValue,
                    token!
                  );
                  await fetchAccounts(vipModalAccountId);
                  setShowVipModal(false);
                }}
              >
                Güncelle
              </button>
              <button
                className="flex-1 bg-gray-700 text-white py-2 rounded-lg font-semibold"
                onClick={() => setShowVipModal(false)}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Parite Ekleme Modalı */}
      {showPairModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-[#23243a] rounded-lg p-8 w-full max-w-2xl shadow-lg max-h-[80vh] overflow-y-auto relative">
            {/* Sağ üstte çarpı butonu */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold focus:outline-none"
              onClick={() => setShowPairModal(false)}
              aria-label="Kapat"
            >
              ×
            </button>
            <h2 className="text-xl font-bold text-green-300 mb-6">
              Parite Ekle
            </h2>

            {availablePairs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">
                  Ekleyebileceğiniz parite bulunmuyor.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Admin tarafından yeni pariteler eklendiğinde burada görünecek.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-gray-300 mb-3">
                    Eklemek istediğiniz pariteleri seçin:
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {availablePairs.map((pair) => (
                      <label
                        key={pair.id}
                        className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPairs.includes(pair.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPairs([...selectedPairs, pair.id]);
                            } else {
                              setSelectedPairs(
                                selectedPairs.filter((id) => id !== pair.id)
                              );
                            }
                          }}
                          className="w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                        />
                        <span className="text-white font-medium">
                          {pair.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addToAllAccounts}
                      onChange={(e) => setAddToAllAccounts(e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-gray-300">
                      Tüm hesaplarıma ekle (işaretlenmezse sadece aktif hesaba
                      eklenir)
                    </span>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
                    disabled={pairLoading || selectedPairs.length === 0}
                    onClick={handleAddPairs}
                  >
                    {pairLoading
                      ? "Ekleniyor..."
                      : `${selectedPairs.length} Parite Ekle`}
                  </button>
                  <button
                    className="flex-1 bg-gray-700 text-white py-2 rounded-lg font-semibold"
                    onClick={() => {
                      setShowPairModal(false);
                      setSelectedPairs([]);
                      setAddToAllAccounts(false);
                    }}
                  >
                    İptal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Başarı mesajı */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-lg shadow-lg z-50 text-lg font-semibold animate-fade-in">
          {successMessage}
        </div>
      )}
      {/* İçerik */}
      <div className="w-full flex flex-col md:flex-row">
        {/* Sol Panel */}
        <div
          className={`
            ${sidebarOpen ? "fixed z-50 top-0 left-0" : "hidden"}
            md:block md:static md:relative md:z-10
            h-full w-80 bg-[#20213a] border-r border-[#2d2e4a] flex flex-col p-6
            transform transition-transform duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0 md:w-80
          `}
        >
          {/* Mobil Kapat Butonu */}
          <div className="md:hidden flex items-center justify-between mb-4">
            <span className="text-xl font-bold text-blue-400">Panel</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {/* Hesap Değiştir Açılır Menü */}
          <div className="mb-4 relative">
            <button
              className="w-full p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-900/60 to-blue-700/40 shadow-lg flex items-center justify-between border border-blue-500 text-white font-bold text-base md:text-lg hover:brightness-110 transition"
              onClick={() => setShowAccountDropdown((v) => !v)}
            >
              <span className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="truncate">{selectedAccount?.name}</span>
              </span>
              <svg
                className={`w-4 h-4 md:w-5 md:h-5 ml-2 transition-transform ${
                  showAccountDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showAccountDropdown && (
              <div className="absolute left-0 w-full bg-[#23243a] border border-blue-700 rounded-xl md:rounded-2xl shadow-xl z-[9999] mt-2 animate-fade-in">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    className={`w-full text-left px-3 md:px-4 py-2 md:py-3 hover:bg-blue-700 rounded-lg md:rounded-xl transition flex items-center gap-2 text-sm md:text-base ${
                      acc.id === selectedAccount?.id
                        ? "bg-blue-900 text-white font-bold"
                        : "text-blue-200"
                    }`}
                    onClick={() => {
                      setSelectedAccount(acc);
                      setShowAccountDropdown(false);
                    }}
                  >
                    <span className="truncate">{acc.name}</span>
                    <span className="ml-2 text-xs text-blue-400">
                      VIP: {acc.vip ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Hesap Kartı */}
          {selectedAccount && (
            <div className="mb-6 md:mb-8 mt-2 p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-900/60 to-blue-700/40 shadow-lg flex flex-col items-start border border-blue-500">
              <div className="text-blue-200 text-xs md:text-sm font-semibold">
                VIP Seviye:{" "}
                <span className="text-blue-400">
                  {selectedAccount.vip ?? 0}
                </span>
              </div>
            </div>
          )}
          {/* Parite Ekle Butonu */}
          <button
            className="w-full mb-4 md:mb-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl shadow transition text-sm md:text-base"
            onClick={handleOpenPairModal}
          >
            + Parite Ekle
          </button>
          {/* Aktif Pariteler */}
          <div className="mb-4">
            <button
              className="w-full flex items-center justify-between text-left mb-3"
              onClick={() => setShowActivePairs(!showActivePairs)}
            >
              <h3 className="text-base md:text-lg font-bold text-blue-300">
                Aktif Pariteler
              </h3>
              <span className="text-blue-300 text-lg md:text-xl transition-transform duration-300">
                {showActivePairs ? "−" : "+"}
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showActivePairs ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col gap-2 md:gap-3">
                {activePairs.map((pair: any, idx: number) => (
                  <div key={pair.id} className="flex items-center gap-2">
                    <button
                      className={`flex-1 w-full bg-gradient-to-r from-blue-500/80 to-blue-400/80 hover:from-blue-600 hover:to-blue-500 text-white font-semibold py-2 md:py-3 rounded-lg md:rounded-xl shadow transition flex items-center justify-center gap-2 border-2 text-sm md:text-base ${
                        selectedPairIndex === idx
                          ? "border-blue-300"
                          : "border-transparent"
                      }`}
                      onClick={() => handleSelectPair(idx)}
                    >
                      <span className="truncate">{pair.name}</span>
                    </button>
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white px-2 md:px-3 py-2 rounded-lg font-semibold text-xs"
                      title="Pariteyi bitir"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setCompleteModalPair(pair);
                        setShowCompleteModal(true);
                      }}
                    >
                      Bitir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Biten Pariteler */}
          <div className="mb-4">
            <button
              className="w-full flex items-center justify-between text-left mb-3"
              onClick={() => setShowCompletedPairs(!showCompletedPairs)}
            >
              <h3 className="text-base md:text-lg font-bold text-gray-400">
                Biten Pariteler
              </h3>
              <span className="text-gray-400 text-lg md:text-xl transition-transform duration-300">
                {showCompletedPairs ? "−" : "+"}
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showCompletedPairs
                  ? "max-h-96 opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col gap-2 md:gap-3">
                {completedPairs.map((pair: any, idx: number) => (
                  <div key={pair.id} className="flex items-center gap-2">
                    <button className="flex-1 w-full bg-gradient-to-r from-gray-600/80 to-gray-500/80 hover:from-gray-500 hover:to-gray-400 text-gray-300 hover:text-gray-200 font-semibold py-2 md:py-3 rounded-lg md:rounded-xl shadow transition flex items-center justify-center gap-2 border-2 border-gray-500 text-sm md:text-base">
                      <span className="truncate">{pair.name}</span>
                    </button>
                    <button
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 md:px-3 py-2 rounded-lg font-semibold text-xs"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setResumeModalPair(pair);
                        setShowResumeModal(true);
                      }}
                    >
                      Devam Et
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Ana İçerik */}
        <main className="flex-1 p-4 md:p-10 pt-4 md:pt-20 bg-[#1a1b2e] min-h-screen">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-10">
            {/* SOL BLOK: Token, fiyat, istatistikler, güncellemeler */}
            <div className="space-y-6 md:space-y-10">
              {/* Başlık ve Fiyat */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
                <div>
                  <div className="text-gray-400 text-sm md:text-base mb-1">
                    Token
                  </div>
                  <div className="text-2xl md:text-4xl font-extrabold text-blue-300 tracking-tight">
                    {pairDetailLoading
                      ? "Yükleniyor..."
                      : pairDetailError
                      ? pairDetailError
                      : pair?.token}
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <div className="text-gray-400 text-sm md:text-base">
                    Fiyat
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white">
                    {pairDetailLoading ? "" : pair?.price}
                  </div>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 md:px-6 py-2 rounded-xl font-semibold shadow transition text-sm md:text-base"
                    onClick={async () => {
                      if (!selectedAccount || !pairDetail) return;
                      setPriceLoading(true);
                      try {
                        const price = await getBybitPrice(pairDetail.token);
                        await updatePairPrice(
                          selectedAccount.id,
                          activePairs[selectedPairIndex].id,
                          price
                        );
                        setPairDetail({ ...pairDetail, price });
                        showTimedMessage("Fiyat başarıyla güncellendi!");
                      } catch (e: any) {
                        showTimedMessage(e.message || "Fiyat güncellenemedi!");
                      } finally {
                        setPriceLoading(false);
                      }
                    }}
                    disabled={priceLoading}
                  >
                    {priceLoading ? "Güncelleniyor..." : "Fiyat Güncelle"}
                  </button>
                </div>
              </div>
              {/* İstatistik Grid */}
              <div className="grid grid-cols-2 gap-3 md:gap-6">
                <div className="bg-[#23243a] rounded-xl md:rounded-2xl p-3 md:p-6 flex flex-col items-center shadow">
                  <div className="text-gray-400 text-xs">Toplam Ödül</div>
                  <div className="text-lg md:text-xl font-bold text-blue-400">
                    {toplamOdul === 0 ? "—" : toplamOdul}{" "}
                    <span className="text-xs">
                      {pairDetail?.token?.split("/")[0] || ""}
                    </span>
                  </div>
                  {pairDetail?.price && toplamOdul > 0 && (
                    <div className="text-sm md:text-base text-blue-300 mt-1 font-semibold">
                      ≈ $
                      {(toplamOdul * pairDetail.price).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      $
                    </div>
                  )}
                </div>
                <div className="bg-[#23243a] rounded-xl md:rounded-2xl p-3 md:p-6 flex flex-col items-center shadow">
                  <div className="text-gray-400 text-xs">Toplam Hacim</div>
                  <div className="text-lg md:text-xl font-bold text-green-400">
                    {toplamHacim === 0 ? "—" : toplamHacim}{" "}
                    <span className="text-xs">USDT</span>
                  </div>
                </div>
                <div className="bg-[#23243a] rounded-xl md:rounded-2xl p-3 md:p-6 flex flex-col items-center shadow">
                  <div className="text-gray-400 text-xs">Toplam Masraf</div>
                  <div className="text-lg md:text-xl font-bold text-red-400">
                    {toplamMasraf === 0 ? "—" : toplamMasraf}{" "}
                    <span className="text-xs">USDT</span>
                  </div>
                </div>
                <div className="bg-[#23243a] rounded-xl md:rounded-2xl p-3 md:p-6 flex flex-col items-center shadow">
                  <div className="text-gray-400 text-xs">Toplam İade</div>
                  <div className="text-lg md:text-xl font-bold text-yellow-400 min-h-[28px] flex items-center justify-center">
                    {toplamIade === 0 ? "—" : toplamIade}{" "}
                    <span className="text-xs">USDT</span>
                  </div>
                </div>
                <div className="bg-[#23243a] rounded-xl md:rounded-2xl p-3 md:p-6 flex flex-col items-center shadow">
                  <div className="text-gray-400 text-xs">Anlık Ödül</div>
                  <div className="text-lg md:text-xl font-bold text-blue-200">
                    {anlikOdul === 0 ? "—" : anlikOdul}{" "}
                    <span className="text-xs">
                      {pairDetail?.token?.split("/")[0] || ""}
                    </span>
                  </div>
                  {pairDetail?.price && anlikOdul > 0 && (
                    <div className="text-sm md:text-base text-blue-300 mt-1 font-semibold">
                      ≈ $
                      {(anlikOdul * pairDetail.price).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      $
                    </div>
                  )}
                </div>
                <div className="bg-[#23243a] rounded-xl md:rounded-2xl p-3 md:p-6 flex flex-col items-center shadow">
                  <div className="text-gray-400 text-xs">Güncel RR</div>
                  <div className="text-lg md:text-xl font-bold text-purple-400">
                    {rr === 0 || rr === "0.00" ? "—" : rr}
                  </div>
                </div>
              </div>
              {/* Fiyat ve Ödül Güncelleme */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <input
                  className="flex-1 bg-[#18192a] border border-gray-600 rounded-xl px-3 md:px-4 py-2 text-white text-sm md:text-base"
                  placeholder="Token miktarı giriniz"
                  value={rewardInput}
                  onChange={(e) =>
                    setRewardInput(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  disabled={rewardLoading}
                />
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 md:px-4 py-2 rounded-xl font-semibold text-sm md:text-base"
                  disabled={
                    rewardLoading ||
                    !selectedAccount ||
                    !activePairs[selectedPairIndex] ||
                    rewardInput === ""
                  }
                  onClick={async () => {
                    if (
                      !selectedAccount ||
                      !activePairs[selectedPairIndex] ||
                      rewardInput === ""
                    )
                      return;
                    setRewardLoading(true);
                    try {
                      const price = pairDetail?.price || 0;
                      await updateUserPairReward(
                        selectedAccount.id,
                        activePairs[selectedPairIndex].id,
                        Number(rewardInput),
                        price
                      );
                      showTimedMessage("Anlık ödül başarıyla güncellendi!");
                      setInstantReward(Number(rewardInput));
                      setPairDetail({
                        ...pairDetail,
                        reward_amount: Number(rewardInput),
                      });
                      setRewardInput("");
                    } catch (e: any) {
                      showTimedMessage(e.message || "Ödül güncellenemedi!");
                    } finally {
                      setRewardLoading(false);
                    }
                  }}
                >
                  {rewardLoading ? "Güncelleniyor..." : "Ödül Güncelle"}
                </button>
              </div>
            </div>
            {/* SAĞ BLOK: Trade işlemleri ve geçmişi */}
            <div className="space-y-6 md:space-y-8 flex flex-col h-full">
              {/* Trade Başlat/Bitir */}
              <div className="flex gap-3 md:gap-4">
                {aktifTrade ? (
                  <button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 md:py-3 rounded-xl font-bold text-base md:text-lg transition"
                    onClick={() => {
                      setSelectedTradeToFinish(aktifTrade);
                      setShowFinishModal(true);
                    }}
                  >
                    Trade Bitir
                  </button>
                ) : (
                  <button
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 md:py-3 rounded-xl font-bold text-base md:text-lg transition"
                    onClick={() => setShowStartTradeModal(true)}
                    disabled={tradeLoading}
                  >
                    {tradeLoading ? "Başlatılıyor..." : "Trade Başlat"}
                  </button>
                )}
              </div>
              {/* Trade Ortalaması ve Liste */}
              <div className="bg-[#23243a] rounded-xl md:rounded-2xl p-4 md:p-6 flex-1 flex flex-col shadow">
                <div className="text-gray-300 mb-2 text-base md:text-lg">
                  Trade Ortalaması:{" "}
                  <span className="text-white font-bold">{tradeOrtalama}</span>
                </div>
                <div className="text-gray-200 font-bold mb-2 text-sm md:text-base">
                  Trade Listesi
                </div>
                <div className="bg-[#18192a] rounded-xl p-3 md:p-4 min-h-[80px] text-sm md:text-base text-gray-200 flex-1 overflow-y-auto">
                  {tradeList.length > 0 ? (
                    <div className="space-y-4">
                      {tradeList.map((trade: any) => (
                        <TradeCard
                          key={trade.id}
                          trade={{
                            ...trade,
                            pair_name: activePairs[selectedPairIndex]?.name,
                            account_name: selectedAccount?.name,
                          }}
                          onFinish={handleFinishTrade}
                          onEdit={handleEditTrade}
                          onDelete={handleDeleteTrade}
                          aktifTradeId={aktifTrade ? aktifTrade.id : null}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-xs md:text-sm">
                      Trade yok
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Trade Başlat Modal */}
      {showStartTradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#23243a] rounded-2xl p-6 w-96 max-w-[90vw]">
            <h3 className="text-xl font-bold text-white mb-4">Trade Başlat</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Başlangıç Bakiyesi
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-[#18192a] border border-gray-600 rounded-xl px-4 py-2 text-white"
                  placeholder="0.00"
                  value={entryBalance}
                  onChange={(e) =>
                    setEntryBalance(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl font-semibold"
                  onClick={() => {
                    setShowStartTradeModal(false);
                    setEntryBalance("");
                  }}
                >
                  İptal
                </button>
                <button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl font-semibold"
                  onClick={async () => {
                    if (
                      !selectedAccount ||
                      !activePairs[selectedPairIndex] ||
                      entryBalance === ""
                    ) {
                      showTimedMessage("Lütfen başlangıç bakiyesini girin!");
                      return;
                    }
                    if (!pairDetail || !pairDetail.token) {
                      showTimedMessage(
                        "Parite detayları yüklenemedi. Lütfen tekrar deneyin!"
                      );
                      setShowStartTradeModal(false);
                      return;
                    }
                    setTradeLoading(true);
                    setShowStartTradeModal(false);
                    try {
                      await startTrade(
                        selectedAccount.id,
                        activePairs[selectedPairIndex].id,
                        Number(entryBalance)
                      );
                      showTimedMessage("Trade başlatıldı!");
                      setEntryBalance("");
                      await fetchTradeList();
                      await handleSelectPair(selectedPairIndex);
                    } catch (e: any) {
                      showTimedMessage(e.message || "Trade başlatılamadı!");
                    } finally {
                      setTradeLoading(false);
                    }
                  }}
                  disabled={tradeLoading}
                >
                  {tradeLoading ? "Başlatılıyor..." : "Başlat"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Trade Bitir Modalı */}
      {showFinishModal && selectedTradeToFinish && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#23243a] rounded-2xl p-6 w-96 max-w-[90vw]">
            <h3 className="text-xl font-bold text-white mb-4">Trade Bitir</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Son Bakiye
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-[#18192a] border border-gray-600 rounded-xl px-4 py-2 text-white"
                  placeholder="0.00"
                  value={entryBalance}
                  onChange={(e) =>
                    setEntryBalance(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">
                  Son Hacim
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-[#18192a] border border-gray-600 rounded-xl px-4 py-2 text-white"
                  placeholder="0.00"
                  value={selectedTradeToFinish.exit_volume ?? ""}
                  onChange={(e) => {
                    setSelectedTradeToFinish({
                      ...selectedTradeToFinish,
                      exit_volume:
                        e.target.value === "" ? "" : Number(e.target.value),
                    });
                  }}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl font-semibold"
                  onClick={() => {
                    setShowFinishModal(false);
                    setSelectedTradeToFinish(null);
                  }}
                >
                  İptal
                </button>
                <button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-semibold"
                  onClick={async () => {
                    if (
                      !selectedTradeToFinish ||
                      entryBalance === "" ||
                      selectedTradeToFinish.exit_volume === undefined ||
                      selectedTradeToFinish.exit_volume === ""
                    ) {
                      showTimedMessage("Lütfen son bakiye ve son hacmi girin!");
                      return;
                    }
                    // Hacim kontrolü
                    if (
                      Number(selectedTradeToFinish.exit_volume) <
                      Number(selectedTradeToFinish.volume)
                    ) {
                      showTimedMessage("Son hacim, ilk hacimden küçük olamaz!");
                      return;
                    }
                    setTradeLoading(true);
                    setShowFinishModal(false);
                    try {
                      await finishTrade(
                        selectedTradeToFinish.id,
                        Number(entryBalance),
                        Number(selectedTradeToFinish.exit_volume)
                      );
                      showTimedMessage("Trade başarıyla bitirildi!");
                      setEntryBalance("");
                      setSelectedTradeToFinish(null);
                      await fetchTradeList();
                    } catch (e: any) {
                      showTimedMessage(e.message || "Trade bitirilemedi!");
                    } finally {
                      setTradeLoading(false);
                    }
                  }}
                  disabled={tradeLoading}
                >
                  {tradeLoading ? "Bitiriliyor..." : "Bitir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bitir Modalı */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#23243a] rounded-2xl p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-bold text-white mb-4">
              Pariteyi Bitir
            </h3>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">
                Ne kadar sattın? (USD)
              </label>
              <input
                type="number"
                className="w-full bg-[#18192a] border border-gray-600 rounded-xl px-4 py-2 text-white"
                placeholder="0.00"
                value={soldAmount}
                onChange={(e) => setSoldAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl font-semibold"
                onClick={() => {
                  setShowCompleteModal(false);
                  setSoldAmount("");
                  setCompleteModalPair(null);
                }}
              >
                İptal
              </button>
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-semibold"
                disabled={!soldAmount || isNaN(Number(soldAmount))}
                onClick={async () => {
                  if (!selectedAccount || !completeModalPair) return;
                  try {
                    // Önce selled_dolar güncelle
                    await fetch(
                      `${
                        process.env.REACT_APP_API_URL ||
                        "https://web-production-2a27.up.railway.app/api"
                      }/pairs/userpair/selled`,
                      {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${localStorage.getItem(
                            "token"
                          )}`,
                        },
                        body: JSON.stringify({
                          pairId: completeModalPair.id,
                          accountId: selectedAccount.id,
                          selledDolar: Number(soldAmount),
                        }),
                      }
                    );
                    // Sonra pariteyi pasif yap
                    await completePair(
                      completeModalPair.id,
                      selectedAccount.id,
                      0
                    );
                    showTimedMessage("Parite bitirildi ve satış kaydedildi!");
                    setShowCompleteModal(false);
                    setSoldAmount("");
                    setCompleteModalPair(null);
                    await fetchUserPairs();
                  } catch (err) {
                    showTimedMessage("İşlem başarısız!");
                  }
                }}
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Devam Et Onay Modalı */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#23243a] rounded-2xl p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-bold text-white mb-4">
              Pariteyi Aktifleştir
            </h3>
            <div className="mb-4 text-gray-200">
              Bu pariteyi tekrar aktifleştirmek istediğine emin misin?
            </div>
            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl font-semibold"
                onClick={() => {
                  setShowResumeModal(false);
                  setResumeModalPair(null);
                }}
              >
                İptal
              </button>
              <button
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-xl font-semibold"
                onClick={async () => {
                  if (!selectedAccount || !resumeModalPair) return;
                  try {
                    await resumePair(resumeModalPair.id, selectedAccount.id);
                    showTimedMessage("Parite tekrar aktifleştirildi!");
                    setShowResumeModal(false);
                    setResumeModalPair(null);
                    await fetchUserPairs();
                  } catch (err) {
                    showTimedMessage("Devam ettirilemedi!");
                  }
                }}
              >
                Evet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
