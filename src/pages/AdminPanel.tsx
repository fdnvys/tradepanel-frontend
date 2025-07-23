import React, { useState, useEffect } from "react";
import {
  adminApi,
  createPair,
  getPairs,
  togglePairStatus,
  deletePair,
} from "../services/api";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  username: string;
  is_approved: number;
  is_pro: number;
  refund_rate?: number;
}

interface Pair {
  id: number;
  name: string;
  is_active: number;
  created_at: string;
  reward: number;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showPairModal, setShowPairModal] = useState(false);
  const [newPairName, setNewPairName] = useState("");
  const [newPairReward, setNewPairReward] = useState<string>("0");
  const [pairLoading, setPairLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "pairs">("users");
  const [editingRefundUserId, setEditingRefundUserId] = useState<number | null>(
    null
  );
  const [refundInput, setRefundInput] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pairToDelete, setPairToDelete] = useState<Pair | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchPairs();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminApi.getUsers();
      const usersWithRefund = await Promise.all(
        response.users.map(async (user: User) => {
          try {
            const refund = await adminApi.getUserRefundRate(user.id);
            return { ...user, refund_rate: refund.refund_rate };
          } catch {
            return { ...user, refund_rate: 0 };
          }
        })
      );
      setUsers(usersWithRefund);
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata:", error);
      setMessage("Kullanıcılar yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPairs = async () => {
    try {
      const pairsData = await getPairs();
      setPairs(pairsData);
    } catch (error) {
      console.error("Pariteler yüklenirken hata:", error);
      setMessage("Pariteler yüklenirken hata oluştu.");
    }
  };

  const approveUser = async (userId: number) => {
    try {
      await adminApi.approveUser(userId);
      setMessage("Kullanıcı onaylandı!");
      fetchUsers(); // Listeyi yenile
    } catch (error) {
      console.error("Onaylama hatası:", error);
      setMessage("Kullanıcı onaylanırken hata oluştu.");
    }
  };

  const deleteUser = async (userId: number) => {
    if (!window.confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      await adminApi.deleteUser(userId);
      setMessage("Kullanıcı silindi!");
      fetchUsers(); // Listeyi yenile
    } catch (error) {
      console.error("Silme hatası:", error);
      setMessage("Kullanıcı silinirken hata oluştu.");
    }
  };

  const setPro = async (userId: number, isPro: boolean) => {
    try {
      await adminApi.setPro(userId, isPro);
      setMessage(
        isPro ? "Kullanıcı pro yapıldı!" : "Kullanıcı pro yetkisi kaldırıldı!"
      );
      fetchUsers();
    } catch (error) {
      setMessage("Pro yetkisi güncellenirken hata oluştu.");
    }
  };

  const handleCreatePair = async () => {
    if (!newPairName.trim()) {
      setMessage("Parite adı gerekli!");
      return;
    }

    const rewardValue = parseFloat(newPairReward) || 0;

    setPairLoading(true);
    try {
      const result = await createPair(newPairName.trim(), rewardValue);
      setMessage(`Parite başarıyla eklendi! Ödül: ${rewardValue}`);
      setNewPairName("");
      setNewPairReward("0");
      setShowPairModal(false);
      fetchPairs(); // Parite listesini yenile
    } catch (error: any) {
      setMessage(`Hata: ${error.message}`);
    } finally {
      setPairLoading(false);
    }
  };

  const handleTogglePairStatus = async (
    pairId: number,
    currentStatus: number
  ) => {
    try {
      const result = await togglePairStatus(pairId);
      setMessage(result.message);
      fetchPairs(); // Parite listesini yenile
    } catch (error: any) {
      setMessage(`Hata: ${error.message}`);
    }
  };

  const handleDeletePair = async (pairId: number) => {
    const pair = pairs.find((p) => p.id === pairId);
    if (pair) {
      setPairToDelete(pair);
      setShowDeleteModal(true);
    }
  };

  const confirmDeletePair = async () => {
    if (!pairToDelete) return;

    try {
      const result = await deletePair(pairToDelete.id);
      setMessage(result.message);
      fetchPairs(); // Parite listesini yenile
      setShowDeleteModal(false);
      setPairToDelete(null);
    } catch (error: any) {
      setMessage(`Hata: ${error.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin-login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <nav className="w-full bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <span className="text-2xl font-bold text-blue-400">Admin Paneli</span>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          Çıkış Yap
        </button>
      </nav>

      {/* İçerik */}
      <div className="max-w-6xl mx-auto p-6 pt-20">
        <div className="mb-8">
          <p className="text-gray-400">
            Kullanıcı yönetimi ve parite işlemleri
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-blue-600 rounded-lg">{message}</div>
        )}

        {/* Tab Menüsü */}
        <div className="mb-6 flex space-x-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-semibold rounded-t-lg ${
              activeTab === "users"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Kullanıcılar
          </button>
          <button
            onClick={() => setActiveTab("pairs")}
            className={`px-4 py-2 font-semibold rounded-t-lg ${
              activeTab === "pairs"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Pariteler
          </button>
        </div>

        {/* Kullanıcılar Tab */}
        {activeTab === "users" && (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold">Kullanıcı Listesi</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Kullanıcı Adı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      İade Oranı (%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_approved
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.is_approved ? "Onaylı" : "Onay Bekliyor"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-300">
                        {editingRefundUserId === user.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.01}
                              className="w-20 px-2 py-1 rounded bg-gray-700 text-white border border-gray-600"
                              value={refundInput}
                              onChange={(e) => setRefundInput(e.target.value)}
                            />
                            <button
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                              onClick={async () => {
                                const val = parseFloat(refundInput);
                                if (isNaN(val) || val < 0) return;
                                await adminApi.updateUserRefundRate(
                                  user.id,
                                  val
                                );
                                setEditingRefundUserId(null);
                                setRefundInput("");
                                fetchUsers();
                              }}
                            >
                              Kaydet
                            </button>
                            <button
                              className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
                              onClick={() => {
                                setEditingRefundUserId(null);
                                setRefundInput("");
                              }}
                            >
                              İptal
                            </button>
                          </div>
                        ) : (
                          <span>
                            {user.refund_rate ?? 0}{" "}
                            <button
                              className="ml-2 text-blue-400 underline text-xs"
                              onClick={() => {
                                setEditingRefundUserId(user.id);
                                setRefundInput(
                                  (user.refund_rate ?? 0).toString()
                                );
                              }}
                            >
                              Düzenle
                            </button>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {!user.is_approved && (
                            <button
                              onClick={() => approveUser(user.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                            >
                              Onayla
                            </button>
                          )}
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                          >
                            Sil
                          </button>
                          <button
                            onClick={() => setPro(user.id, !user.is_pro)}
                            className={
                              user.is_pro
                                ? "bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
                                : "bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                            }
                          >
                            {user.is_pro ? "Pro Yetkisini Kaldır" : "Pro Yap"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-400">
                Henüz kullanıcı bulunmuyor.
              </div>
            )}
          </div>
        )}

        {/* Pariteler Tab */}
        {activeTab === "pairs" && (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Parite Yönetimi</h2>
              <button
                onClick={() => setShowPairModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                + Yeni Parite Ekle
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Parite Adı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ödül Miktarı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Oluşturulma Tarihi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {pairs.map((pair) => (
                    <tr key={pair.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {pair.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {pair.reward}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            pair.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {pair.is_active ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(pair.created_at).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleTogglePairStatus(pair.id, pair.is_active)
                            }
                            className={`px-3 py-1 rounded text-xs font-semibold ${
                              pair.is_active
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "bg-green-600 hover:bg-green-700 text-white"
                            }`}
                          >
                            {pair.is_active ? "Pasif Yap" : "Aktif Yap"}
                          </button>
                          <button
                            onClick={() => handleDeletePair(pair.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pairs.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-400">
                Henüz parite bulunmuyor.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Parite Ekleme Modalı */}
      {showPairModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-[#23243a] rounded-lg p-8 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold text-green-300 mb-6">
              Yeni Parite Oluştur
            </h2>
            <div className="mb-6">
              <label className="block text-gray-300 mb-1">
                Parite Adı (örn: btc/usdt)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                placeholder="Parite adı"
                value={newPairName}
                onChange={(e) => setNewPairName(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-300 mb-1">Ödül Miktarı</label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600"
                placeholder="Ödül miktarı"
                value={newPairReward}
                onChange={(e) => setNewPairReward(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
                disabled={pairLoading}
                onClick={handleCreatePair}
              >
                {pairLoading ? "Ekleniyor..." : "Ekle"}
              </button>
              <button
                className="flex-1 bg-gray-700 text-white py-2 rounded-lg font-semibold"
                onClick={() => setShowPairModal(false)}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Silme Onay Modalı */}
      {showDeleteModal && pairToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Parite Silme Onayı
            </h3>
            <p className="text-gray-300 mb-6">
              <strong>{pairToDelete.name}</strong> paritesini silmek
              istediğinizden emin misiniz?
              <br />
              <span className="text-red-400 text-sm">
                Bu işlem geri alınamaz!
              </span>
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPairToDelete(null);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                İptal
              </button>
              <button
                onClick={confirmDeletePair}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
