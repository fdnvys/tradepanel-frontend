import React from "react";
import { Event } from "../types";
import {
  calculateEstimatedReward,
  calculateRiskRewardRatio,
  calculateProfitPercentage,
} from "../calculations/tradeCalculations";
import {
  formatCurrency,
  formatPrice,
  formatPercentage,
  getProfitLossColor,
  getPercentageColor,
} from "../utils/formatters";

interface EventCardProps {
  event: Event;
  onClick?: (event: Event) => void;
  onFinish?: (eventId: number) => void;
  onDelete?: (eventId: number) => void;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onClick,
  onFinish,
  onDelete,
}) => {
  const estimatedReward = calculateEstimatedReward(event);
  const riskRewardRatio = calculateRiskRewardRatio(event);
  const profitPercentage = calculateProfitPercentage(event);

  const handleClick = () => {
    if (onClick) {
      onClick(event);
    }
  };

  const handleFinish = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFinish) {
      onFinish(event.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(event.id);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300 ${
        event.is_finished ? "opacity-75" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {event.token_name}
          </h3>
          <p className="text-sm text-gray-500">
            Başlangıç: {new Date(event.start_date).toLocaleDateString("tr-TR")}
          </p>
        </div>

        <div className="flex space-x-2">
          {!event.is_finished && onFinish && (
            <button
              onClick={handleFinish}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-success-600 hover:bg-success-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success-500"
            >
              Bitir
            </button>
          )}

          {onDelete && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-danger-600 hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500"
            >
              Sil
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Toplam Hacim</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(event.total_volume)}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Toplam Maliyet</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(event.total_cost)}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Güncel Fiyat</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatPrice(event.current_price)}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Anlık Ödül</p>
          <p
            className={`text-lg font-semibold ${getProfitLossColor(
              estimatedReward
            )}`}
          >
            {formatCurrency(estimatedReward)}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-500">Risk/Reward</p>
            <p
              className={`text-lg font-semibold ${getPercentageColor(
                riskRewardRatio * 100
              )}`}
            >
              {formatPercentage(riskRewardRatio * 100)}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Kar %</p>
            <p
              className={`text-lg font-semibold ${getPercentageColor(
                profitPercentage
              )}`}
            >
              {formatPercentage(profitPercentage)}
            </p>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              event.is_finished
                ? "bg-gray-100 text-gray-800"
                : "bg-success-100 text-success-800"
            }`}
          >
            {event.is_finished ? "Bitti" : "Aktif"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
