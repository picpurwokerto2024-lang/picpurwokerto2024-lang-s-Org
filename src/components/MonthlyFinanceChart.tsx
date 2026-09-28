import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { AppState } from '../types';
import { formatRupiah } from '../services/utils';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Layers, Activity } from 'lucide-react';

interface MonthlyFinanceChartProps {
  state: AppState;
}

interface MonthlyDataPoint {
  monthKey: string; // "2026-01"
  label: string;    // "Jan 2026"
  shortLabel: string; // "Jan"
  pemasukan: number;
  pengeluaran: number;
  surplus: number;
  saldoKumulatif: number;
}

const MONTH_NAMES_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

export const MonthlyFinanceChart: React.FC<MonthlyFinanceChartProps> = ({ state }) => {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Compute monthly data
  const { monthlyData, availableYears, totalIncomePeriod, totalExpensePeriod, averageMonthlySurplus } = useMemo(() => {
    const monthlyMap = new Map<string, { income: number; expense: number }>();
    const yearSet = new Set<string>();

    // 1. Process Jimpitan Records
    state.jimpitanRecords.forEach((rec) => {
      if (rec.status === 'paid' && rec.date) {
        const monthKey = rec.date.substring(0, 7); // "YYYY-MM"
        const year = rec.date.substring(0, 4);
        yearSet.add(year);

        const current = monthlyMap.get(monthKey) || { income: 0, expense: 0 };
        current.income += (rec.amount || 0);
        monthlyMap.set(monthKey, current);
      }
    });

    // 2. Process Transactions (Direct Income & Expenses)
    state.transactions.forEach((tx) => {
      if (tx.date) {
        const monthKey = tx.date.substring(0, 7);
        const year = tx.date.substring(0, 4);
        yearSet.add(year);

        const current = monthlyMap.get(monthKey) || { income: 0, expense: 0 };
        if (tx.type === 'income') {
          current.income += (tx.amount || 0);
        } else if (tx.type === 'expense') {
          current.expense += (tx.amount || 0);
        }
        monthlyMap.set(monthKey, current);
      }
    });

    // If empty, generate at least current month with 0
    if (monthlyMap.size === 0) {
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(currentMonthKey, { income: 0, expense: 0 });
      yearSet.add(String(now.getFullYear()));
    }

    // Sort month keys chronologically
    const sortedKeys = Array.from(monthlyMap.keys()).sort();

    // Filter by selected year if specified
    const filteredKeys = selectedYear === 'all'
      ? sortedKeys
      : sortedKeys.filter((k) => k.startsWith(selectedYear));

    // Calculate cumulative balances
    let runningBalance = 0;
    let sumIncome = 0;
    let sumExpense = 0;

    const data: MonthlyDataPoint[] = [];

    // If filtering by a year, we compute balance starting from that year or from beginning
    sortedKeys.forEach((key) => {
      const item = monthlyMap.get(key) || { income: 0, expense: 0 };
      runningBalance += (item.income - item.expense);

      if (selectedYear === 'all' || key.startsWith(selectedYear)) {
        sumIncome += item.income;
        sumExpense += item.expense;

        const [y, m] = key.split('-');
        const monthIdx = parseInt(m, 10) - 1;
        const monthName = MONTH_NAMES_ID[monthIdx] || m;

        data.push({
          monthKey: key,
          label: `${monthName} ${y}`,
          shortLabel: monthName,
          pemasukan: item.income,
          pengeluaran: item.expense,
          surplus: item.income - item.expense,
          saldoKumulatif: Math.max(0, runningBalance),
        });
      }
    });

    const years = Array.from(yearSet).sort().reverse();
    const avgSurplus = data.length > 0 ? Math.round((sumIncome - sumExpense) / data.length) : 0;

    return {
      monthlyData: data,
      availableYears: years,
      totalIncomePeriod: sumIncome,
      totalExpensePeriod: sumExpense,
      averageMonthlySurplus: avgSurplus,
    };
  }, [state.jimpitanRecords, state.transactions, selectedYear]);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as MonthlyDataPoint;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/80 text-xs backdrop-blur-md min-w-[200px]">
          <div className="flex items-center justify-between font-bold border-b border-slate-700 pb-1.5 mb-2 text-slate-200">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>{dataPoint.label}</span>
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                dataPoint.surplus >= 0
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-rose-950 text-rose-300 border border-rose-700'
              }`}
            >
              {dataPoint.surplus >= 0 ? 'Surplus' : 'Defisit'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-emerald-300">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Pemasukan:</span>
              </span>
              <span className="font-bold">{formatRupiah(dataPoint.pemasukan)}</span>
            </div>

            <div className="flex items-center justify-between text-rose-300">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Pengeluaran:</span>
              </span>
              <span className="font-bold">{formatRupiah(dataPoint.pengeluaran)}</span>
            </div>

            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-slate-300 font-medium">
              <span>Arus Bersih (Net):</span>
              <span className={`font-bold ${dataPoint.surplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {dataPoint.surplus >= 0 ? '+' : ''}{formatRupiah(dataPoint.surplus)}
              </span>
            </div>

            <div className="flex items-center justify-between text-teal-300 pt-1 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400">Saldo Akhir Bulan:</span>
              <span className="font-bold">{formatRupiah(dataPoint.saldoKumulatif)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Tren Arus Kas Bulanan
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Grafik komparasi pemasukan iuran vs belanja operasional kelas per bulan
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Year Filter */}
          {availableYears.length > 1 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-hidden focus:border-teal-600"
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          )}

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                chartType === 'bar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grafik Batang Komparasi"
            >
              <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
              <span>Batang</span>
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                chartType === 'area'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grafik Tren Saldo Akumulatif"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>Akumulasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                  return `${val}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                formatter={(value) => {
                  return value === 'pemasukan' ? (
                    <span className="text-slate-700 font-semibold">Pemasukan (Iuran & Donasi)</span>
                  ) : (
                    <span className="text-slate-700 font-semibold">Pengeluaran Kas</span>
                  );
                }}
              />
              <Bar
                dataKey="pemasukan"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
                name="pemasukan"
              />
              <Bar
                dataKey="pengeluaran"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
                name="pengeluaran"
              />
            </BarChart>
          ) : (
            <AreaChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}jt`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}rb`;
                  return `${val}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                formatter={() => (
                  <span className="text-slate-700 font-semibold">Tren Akumulasi Saldo Kas</span>
                )}
              />
              <Area
                type="monotone"
                dataKey="saldoKumulatif"
                stroke="#0d9488"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorSaldo)"
                name="saldoKumulatif"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Footer Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pemasukan Periode</span>
          </div>
          <span className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 block">
            {formatRupiah(totalIncomePeriod)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            <span>Pengeluaran Periode</span>
          </div>
          <span className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 block">
            {formatRupiah(totalExpensePeriod)}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>Rata-Rata Surplus / Bln</span>
          </div>
          <span
            className={`font-bold text-xs sm:text-sm mt-0.5 block ${
              averageMonthlySurplus >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {averageMonthlySurplus >= 0 ? '+' : ''}{formatRupiah(averageMonthlySurplus)}
          </span>
        </div>
      </div>
    </div>
  );
};
