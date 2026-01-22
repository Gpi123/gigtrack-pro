
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
      icon: <Wallet className="w-5 h-5 text-white" />,
      bgColor: 'bg-[#24272D]',
      borderColor: 'border-[#31333B]',
      textColor: 'text-white',
      iconBg: 'bg-[#1E1F25]'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-1 lg:grid-cols-1 lg:gap-3">
      {cardData.map((card, index) => (
        <div 
          key={index}
          className={`${card.bgColor} border ${card.borderColor} rounded-lg lg:rounded-2xl p-1.5 lg:p-4 flex flex-col items-center justify-center lg:flex-row lg:items-center transition-all hover:scale-[1.02] min-h-[65px] lg:min-h-0`}
        >
          {/* Ícones apenas no desktop */}
          <div className={`hidden lg:flex flex-shrink-0 p-3 ${card.iconBg} rounded-xl shadow-inner`}>
            {card.icon}
          </div>
          <div className="flex flex-col items-center lg:items-start min-w-0 flex-1 text-center lg:text-left w-full gap-0.5 lg:gap-0">
            <span className="text-white text-[7px] lg:text-[10px] font-bold uppercase tracking-wide lg:tracking-widest leading-tight">
              {card.label}
            </span>
            <div className={`text-[11px] lg:text-xl font-bold ${card.textColor} tracking-tight transition-all duration-300 leading-tight`}>
              {formatCurrency(card.value)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
