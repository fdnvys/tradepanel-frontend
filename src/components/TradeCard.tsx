import React, { useState } from "react";

interface Trade {
  id: number;
  user_id: number;
  account_id: number;
  pair_id: number;
  volume: number;
  entry_balance: number;
  exit_balance?: number;
  exit_volume?: number;
  is_completed: number;
  started_at: string;
  ended_at?: string;
  created_at: string;
  pair_name?: string;
  account_name?: string;
  fee?: number;
  vip?: number;
  ratio?: number;
}

interface TradeCardProps {
  trade: Trade;
  onFinish: (tradeId: number, exitBalance: number, exitVolume: number) => void;
  onEdit: (tradeId: number, updates: any) => void;
  onDelete: (tradeId: number) => void;
  aktifTradeId?: number | null;
  isReadOnly?: boolean;
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-6 h-6 transition-transform duration-300 ${
      open ? "rotate-180" : "rotate-0"
    }`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const TradeCard: React.FC<TradeCardProps> = ({
  trade,
  onFinish,
  onEdit,
  onDelete,
  aktifTradeId,
  isReadOnly = false,
}) => {
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [exitBalance, setExitBalance] = useState<number | "">("");
  const [exitVolume, setExitVolume] = useState<number | "">("");
  const [editVolume] = useState<number | "">(trade.volume);
  const [editEntryBalance, setEditEntryBalance] = useState<number | "">(
    trade.entry_balance
  );
  const [editExitBalance, setEditExitBalance] = useState<number | "">(
    trade.exit_balance || ""
  );
  const [editExitVolume, setEditExitVolume] = useState<number | "">(
    trade.exit_volume || ""
  );
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleFinish = async () => {
    if (exitBalance === "" || exitVolume === "") {
      alert("Tüm alanları doldurun!");
      return;
    }

    setLoading(true);
    try {
      await onFinish(trade.id, Number(exitBalance), Number(exitVolume));
      setShowFinishModal(false);
      setExitBalance("");
      setExitVolume("");
    } catch (error) {
      console.error("Trade bitirme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (editVolume === "" || editEntryBalance === "") {
      alert("Başlangıç hacmi ve bakiyesi zorunludur!");
      return;
    }

    setLoading(true);
    try {
      const updates: any = {
        volume: Number(editVolume),
        entry_balance: Number(editEntryBalance),
      };

      if (editExitBalance !== "") {
        updates.exit_balance = Number(editExitBalance);
      }
      if (editExitVolume !== "") {
        updates.exit_volume = Number(editExitVolume);
      }

      await onEdit(trade.id, updates);
      setShowEditModal(false);
    } catch (error) {
      console.error("Trade düzenleme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bu trade'i silmek istediğinizden emin misiniz?")) {
      return;
    }

    setLoading(true);
    try {
      await onDelete(trade.id);
    } catch (error) {
      console.error("Trade silme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl p-5 mb-3 shadow-lg border transition-all duration-300 ${
        !trade.is_completed
          ? "bg-[#23243a] border-blue-500"
          : "bg-[#23243a] border-[#2d2e4a] hover:border-blue-500"
      }`}
    >
      {!trade.is_completed ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-400">Başlangıç Bakiyesi</div>
            <div className="text-lg font-bold text-blue-400">
              {trade.entry_balance?.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              USDT
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition"
            >
              Düzenle
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition"
            >
              Sil
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="flex items-center justify-between gap-4 cursor-pointer"
            onClick={() => setShowDetails((v) => !v)}
          >
            <div className="flex flex-1 flex-row gap-8">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-400">Bakiye Değişimi</div>
                <div className="text-lg font-bold text-red-400">
                  {trade.exit_balance !== undefined &&
                  trade.entry_balance !== undefined
                    ? (trade.exit_balance - trade.entry_balance > 0
                        ? "+"
                        : "") +
                      (trade.exit_balance - trade.entry_balance).toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )
                    : "-"}{" "}
                  USDT
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-400">Hacim Değişimi</div>
                <div className="text-lg font-bold text-green-400">
                  {trade.exit_volume !== undefined && trade.volume !== undefined
                    ? (trade.exit_volume - trade.volume > 0 ? "+" : "") +
                      (trade.exit_volume - trade.volume).toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )
                    : "-"}{" "}
                  USDT
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-400">Oran (R)</div>
                <div className="text-lg font-bold text-purple-400">
                  {trade.ratio !== undefined ? trade.ratio.toFixed(4) : "-"}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center p-2 rounded-full hover:bg-[#1a1b2e] transition">
              <ChevronIcon open={showDetails} />
            </div>
          </div>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              showDetails ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-300">
              <div>
                Başlangıç Hacmi:{" "}
                <span className="text-green-300 font-bold">
                  {trade.volume?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  USDT
                </span>
              </div>
              <div>
                Son Hacim:{" "}
                <span className="text-green-300 font-bold">
                  {trade.exit_volume?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  USDT
                </span>
              </div>
              <div>
                Fee:{" "}
                <span className="text-yellow-300 font-bold">
                  {trade.fee?.toLocaleString("en-US", {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  })}{" "}
                  USDT
                </span>
              </div>
              <div>
                Başlangıç Bakiyesi:{" "}
                <span className="text-blue-300 font-bold">
                  {trade.entry_balance?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  USDT
                </span>
              </div>
              <div>
                Son Bakiye:{" "}
                <span className="text-blue-300 font-bold">
                  {trade.exit_balance?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  USDT
                </span>
              </div>
              <div>
                VIP Seviye:{" "}
                <span className="text-white font-bold">{trade.vip ?? "-"}</span>
              </div>
              <div className="col-span-2 md:col-span-3 flex gap-2 mt-2 justify-end">
                {!isReadOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition"
                  >
                    Düzenle
                  </button>
                )}
                {!isReadOnly &&
                  !trade.is_completed &&
                  (!aktifTradeId || aktifTradeId !== trade.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFinishModal(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition"
                    >
                      Bitir
                    </button>
                  )}
                {!isReadOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition"
                  >
                    Sil
                  </button>
                )}
              </div>
            </div>
            <div className="col-span-2 md:col-span-3 text-xs text-gray-400 mt-2 text-right">
              Başlangıç:{" "}
              {trade.started_at
                ? new Date(trade.started_at)
                    .toLocaleString("tr-TR")
                    .replace(",", "")
                : "-"}
              {trade.ended_at && (
                <>
                  | Bitiş:{" "}
                  {new Date(trade.ended_at)
                    .toLocaleString("tr-TR")
                    .replace(",", "")}
                  {(() => {
                    const start = new Date(trade.started_at);
                    const end = new Date(trade.ended_at);
                    const diffMs = end.getTime() - start.getTime();
                    if (!isNaN(diffMs) && diffMs > 0) {
                      const diffMin = Math.round(diffMs / 60000);
                      return ` | Süre: ${diffMin} dk`;
                    }
                    return null;
                  })()}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Trade Bitirme Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#23243a] rounded-2xl p-6 w-full max-w-md border border-[#2d2e4a]">
            <h3 className="text-xl font-bold text-blue-200 mb-4">
              Trade Bitir
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Son Bakiye
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg bg-[#18192a] border border-[#2d2e4a] text-white focus:outline-none focus:border-blue-400"
                  value={exitBalance}
                  onChange={(e) =>
                    setExitBalance(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Son Hacim
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg bg-[#18192a] border border-[#2d2e4a] text-white focus:outline-none focus:border-blue-400"
                  value={exitVolume}
                  onChange={(e) =>
                    setExitVolume(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowFinishModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition"
                disabled={loading}
              >
                İptal
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                disabled={loading}
              >
                {loading ? "İşleniyor..." : "Bitir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trade Düzenleme Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#23243a] rounded-2xl p-6 w-full max-w-md border border-[#2d2e4a]">
            <h3 className="text-xl font-bold text-blue-200 mb-4">
              Trade Düzenle
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Başlangıç Hacmi
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg bg-[#18192a] border border-[#2d2e4a] text-white focus:outline-none focus:border-blue-400"
                  value={editVolume === 0 ? "" : editVolume}
                  disabled
                  placeholder="Başlangıç hacmi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Başlangıç Bakiyesi
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg bg-[#18192a] border border-[#2d2e4a] text-white focus:outline-none focus:border-blue-400"
                  value={editEntryBalance}
                  onChange={(e) =>
                    setEditEntryBalance(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="0.00"
                />
              </div>
              {trade.is_completed && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Son Bakiye (Opsiyonel)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 rounded-lg bg-[#18192a] border border-[#2d2e4a] text-white focus:outline-none focus:border-blue-400"
                      value={editExitBalance}
                      onChange={(e) =>
                        setEditExitBalance(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Son Hacim (Opsiyonel)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 rounded-lg bg-[#18192a] border border-[#2d2e4a] text-white focus:outline-none focus:border-blue-400"
                      value={editExitVolume}
                      onChange={(e) =>
                        setEditExitVolume(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition"
                disabled={loading}
              >
                İptal
              </button>
              <button
                onClick={handleEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                disabled={loading}
              >
                {loading ? "İşleniyor..." : "Güncelle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeCard;
