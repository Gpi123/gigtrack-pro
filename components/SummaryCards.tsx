
import React from 'react';
import { CheckCircle, Clock, Wallet } from 'lucide-react';
import { FinancialStats } from '../types';

type FilterStatus = 'all' | 'pending' | 'paid';

interface SummaryCardsProps {
  stats: FinancialStats;
  showValues: boolean;
  /** Ao clicar no card, aplica o filtro de status na lista (Recebido→Pagos, A Receber→Pendentes, Total→Todos) */
  onFilterClick?: (status: FilterStatus) => void;
  /** Status do filtro atual para destacar o card ativo */
  filterStatus?: FilterStatus;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, showValues, onFilterClick, filterStatus }) => {
  const formatCurrency = (val: number) => {
    if (!showValues) return 'R$ ••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const cardData: Array<{
    label: string;
    value: number;
    filterAs: FilterStatus;
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
    /** Cor da borda de foco (discreta, mesma do card) */
    ringActive: string;
    textColor: string;
    iconBg: string;
  }> = [
    {
      label: 'Recebido',
      value: stats.totalReceived,
      filterAs: 'paid',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      ringActive: 'ring-emerald-500/30',
      textColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20'
    },
    {
      label: 'A Receber',
      value: stats.totalPending,
      filterAs: 'pending',
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      ringActive: 'ring-amber-500/30',
      textColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20'
    },
    {
      label: 'Total Acumulado',
      value: stats.overallTotal,
      filterAs: 'all',
      icon: <Wallet className="w-5 h-5 text-white" />,
      bgColor: 'bg-[#24272D]',
      borderColor: 'border-[#31333B]',
      ringActive: 'ring-[#31333B]',
      textColor: 'text-white',
      iconBg: 'bg-[#1E1F25]'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3 select-none">
      {cardData.map((card, index) => {
        const isActive = filterStatus === card.filterAs;
        const Wrapper = onFilterClick ? 'button' : 'div';
        return (
        <Wrapper
          key={index}
          type={onFilterClick ? 'button' : undefined}
          onClick={onFilterClick ? () => onFilterClick(card.filterAs) : undefined}
          className={`w-full text-left ${card.bgColor} border ${card.borderColor} rounded-xl lg:rounded-2xl p-2.5 lg:p-4 flex flex-col items-start justify-center lg:flex-row lg:items-center transition-all hover:scale-[1.02] min-h-[75px] lg:min-h-0 shadow-xl cursor-pointer ${isActive ? `ring-1 ${card.ringActive}` : ''}`}
        >
          {/* Ícones apenas no desktop */}
          <div className={`hidden lg:flex flex-shrink-0 p-3 ${card.iconBg} rounded-xl shadow-inner mr-4`}>
            {card.icon}
          </div>
          <div className="flex flex-col items-start lg:items-start min-w-0 flex-1 w-full gap-1 lg:gap-0">
            <span className="text-white text-[9px] lg:text-[10px] font-bold uppercase tracking-wide lg:tracking-widest leading-tight select-none">
              {card.label}
            </span>
            <div className={`text-sm lg:text-xl font-bold ${card.textColor} tracking-tight transition-all duration-300 leading-tight select-none`}>
              {formatCurrency(card.value)}
            </div>
          </div>
        </Wrapper>
        );
      })}
    </div>
  );
};

export default SummaryCards;
