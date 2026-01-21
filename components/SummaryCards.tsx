
import React from 'react';
import { CheckCircle, Clock, Wallet } from 'lucide-react';
import { FinancialStats } from '../types';

interface SummaryCardsProps {
  stats: FinancialStats;
  showValues: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, showValues }) => {
  const formatCurrency = (val: number) => {
    if (!showValues) return 'R$ ••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const cardData = [
    {
      label: 'Recebido',
      value: stats.totalReceived,
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      textColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20'
    },
    {
      label: 'A Receber',
      value: stats.totalPending,
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      textColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20'
    },
    {
      label: 'Total Acumulado',
      value: stats.overallTotal,
      icon: <Wallet className="w-5 h-5 text-indigo-400" />,
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      textColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
      {cardData.map((card, index) => (
        <div 
          key={index}
          className={`${card.bgColor} border ${card.borderColor} rounded-2xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02]`}
        >
          <div className={`flex-shrink-0 p-3 ${card.iconBg} rounded-xl shadow-inner`}>
            {card.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest truncate">
              {card.label}
            </span>
            <div className={`text-xl font-bold ${card.textColor} tracking-tight truncate transition-all duration-300`}>
              {formatCurrency(card.value)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
