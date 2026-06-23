import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── helpers ────────────────────────────────────────────────────────────────

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_LONGO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function parseMes(ym: string): { ano: number; mes: number } {
  const [a, m] = ym.split("-").map(Number);
  return { ano: a, mes: m - 1 };
}

function formatMes(ano: number, mes: number): string {
  return `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

function labelMes(ym: string): string {
  const { ano, mes } = parseMes(ym);
  return `${MESES_LONGO[mes]} de ${ano}`;
}

function hoje() {
  const d = new Date();
  return { ano: d.getFullYear(), mes: d.getMonth() };
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── MonthPickerPopover ──────────────────────────────────────────────────────

function MonthPickerPopover({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (ym: string) => void;
  onClose: () => void;
}) {
  const { ano: anoSel, mes: mesSel } = parseMes(value);
  const [ano, setAno] = useState(anoSel);

  return (
    <div className="absolute z-50 top-full left-0 mt-2 w-72 rounded-xl border border-[#27272A] bg-[#111111] shadow-2xl p-4 select-none">
      {/* Navegação de ano */}
      <div className="flex items-center justify-between mb-4">
        <button
          className="p-1.5 rounded-lg hover:bg-white/8 transition-colors text-[#A1A1AA] hover:text-white"
          onClick={() => setAno((a) => a - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-[#F8FAFC]">{ano}</span>
        <button
          className="p-1.5 rounded-lg hover:bg-white/8 transition-colors text-[#A1A1AA] hover:text-white"
          onClick={() => setAno((a) => a + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid de meses */}
      <div className="grid grid-cols-3 gap-1.5">
        {MESES.map((m, i) => {
          const isSelected = ano === anoSel && i === mesSel;
          const isCurrent = ano === hoje().ano && i === hoje().mes;
          return (
            <button
              key={m}
              onClick={() => { onChange(formatMes(ano, i)); onClose(); }}
              className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-[#FACC15] text-black"
                  : isCurrent
                  ? "border border-[#FACC15]/40 text-[#FACC15] hover:bg-[#FACC15]/10"
                  : "text-[#A1A1AA] hover:bg-white/8 hover:text-white"
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── MonthNavigator ──────────────────────────────────────────────────────────

export function MonthNavigator({
  value,
  onChange,
}: {
  value: string;
  onChange: (ym: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function prev() {
    const { ano, mes } = parseMes(value);
    if (mes === 0) onChange(formatMes(ano - 1, 11));
    else onChange(formatMes(ano, mes - 1));
  }

  function next() {
    const { ano, mes } = parseMes(value);
    if (mes === 11) onChange(formatMes(ano + 1, 0));
    else onChange(formatMes(ano, mes + 1));
  }

  return (
    <div ref={ref} className="relative flex items-center rounded-lg border border-[#27272A] overflow-hidden">
      <button
        onClick={prev}
        aria-label="Mês anterior"
        className="px-2.5 py-2 text-[#A1A1AA] hover:bg-white/8 hover:text-white transition-colors border-r border-[#27272A]"
      >
        <ChevronLeft size={15} />
      </button>

      <button
        onClick={() => setOpen((o) => !o)}
        className="px-4 py-2 text-sm font-medium text-[#F8FAFC] hover:bg-white/5 transition-colors flex items-center gap-1.5 min-w-[170px] justify-center"
      >
        <Calendar size={13} className="text-[#FACC15] shrink-0" />
        {labelMes(value)}
      </button>

      <button
        onClick={next}
        aria-label="Próximo mês"
        className="px-2.5 py-2 text-[#A1A1AA] hover:bg-white/8 hover:text-white transition-colors border-l border-[#27272A]"
      >
        <ChevronRight size={15} />
      </button>

      {open && (
        <MonthPickerPopover
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ── QuickShortcuts ──────────────────────────────────────────────────────────

interface ShortcutAction {
  label: string;
  action: () => void;
  active?: boolean;
}

function QuickShortcuts({ shortcuts }: { shortcuts: ShortcutAction[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {shortcuts.map((s) => (
        <button
          key={s.label}
          onClick={s.action}
          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
            s.active
              ? "bg-[#FACC15]/15 border-[#FACC15]/30 text-[#FACC15]"
              : "border-[#27272A] text-[#A1A1AA] hover:bg-white/6 hover:text-white hover:border-[#3F3F46]"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ── DateRangeInputs ─────────────────────────────────────────────────────────

function DateRangeInputs({
  dataInicial,
  dataFinal,
  onChangeInicial,
  onChangeFinal,
}: {
  dataInicial: string;
  dataFinal: string;
  onChangeInicial: (v: string) => void;
  onChangeFinal: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 rounded-lg border border-[#27272A] px-3 py-2 bg-transparent">
        <CalendarRange size={13} className="text-[#FACC15] shrink-0" />
        <input
          type="date"
          aria-label="Data inicial"
          value={dataInicial}
          onChange={(e) => onChangeInicial(e.target.value)}
          className="bg-transparent text-sm text-[#F8FAFC] w-32 outline-none [color-scheme:dark]"
        />
      </div>
      <span className="text-[#52525B] text-xs font-medium">até</span>
      <div className="flex items-center gap-1.5 rounded-lg border border-[#27272A] px-3 py-2 bg-transparent">
        <CalendarRange size={13} className="text-[#FACC15] shrink-0" />
        <input
          type="date"
          aria-label="Data final"
          value={dataFinal}
          onChange={(e) => onChangeFinal(e.target.value)}
          className="bg-transparent text-sm text-[#F8FAFC] w-32 outline-none [color-scheme:dark]"
        />
      </div>
    </div>
  );
}

// ── DashboardDateFilter (export principal) ──────────────────────────────────

export type ModoFiltro = "mes" | "periodo";

interface DashboardDateFilterProps {
  modoFiltro: ModoFiltro;
  onModoChange: (modo: ModoFiltro) => void;
  selectedMonth: string;
  onMonthChange: (ym: string) => void;
  dataInicial: string;
  dataFinal: string;
  onDataInicialChange: (v: string) => void;
  onDataFinalChange: (v: string) => void;
}

export function DashboardDateFilter({
  modoFiltro,
  onModoChange,
  selectedMonth,
  onMonthChange,
  dataInicial,
  dataFinal,
  onDataInicialChange,
  onDataFinalChange,
}: DashboardDateFilterProps) {
  const { ano, mes } = parseMes(selectedMonth);
  const h = hoje();

  function setRange(inicio: Date, fim: Date) {
    onDataInicialChange(toDateStr(inicio));
    onDataFinalChange(toDateStr(fim));
    onModoChange("periodo");
  }

  const shortcutsMes: ShortcutAction[] = [
    {
      label: "Este mês",
      active: selectedMonth === formatMes(h.ano, h.mes) && modoFiltro === "mes",
      action: () => { onMonthChange(formatMes(h.ano, h.mes)); onModoChange("mes"); },
    },
    {
      label: "Mês passado",
      active: selectedMonth === formatMes(h.mes === 0 ? h.ano - 1 : h.ano, h.mes === 0 ? 11 : h.mes - 1) && modoFiltro === "mes",
      action: () => {
        const prevMes = h.mes === 0 ? 11 : h.mes - 1;
        const prevAno = h.mes === 0 ? h.ano - 1 : h.ano;
        onMonthChange(formatMes(prevAno, prevMes));
        onModoChange("mes");
      },
    },
  ];

  const shortcutsPeriodo: ShortcutAction[] = [
    {
      label: "7 dias",
      action: () => {
        const fim = new Date();
        const ini = new Date(); ini.setDate(ini.getDate() - 6);
        setRange(ini, fim);
      },
    },
    {
      label: "30 dias",
      action: () => {
        const fim = new Date();
        const ini = new Date(); ini.setDate(ini.getDate() - 29);
        setRange(ini, fim);
      },
    },
    {
      label: "90 dias",
      action: () => {
        const fim = new Date();
        const ini = new Date(); ini.setDate(ini.getDate() - 89);
        setRange(ini, fim);
      },
    },
    {
      label: "Este ano",
      action: () => {
        const ini = new Date(h.ano, 0, 1);
        const fim = new Date();
        setRange(ini, fim);
      },
    },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      {/* Linha principal: modo + controle de data */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Toggle modo */}
        <div className="flex rounded-lg border border-[#27272A] overflow-hidden text-sm">
          <button
            className={`px-3.5 py-2 text-sm font-medium transition-colors ${
              modoFiltro === "mes"
                ? "bg-[#FACC15] text-black"
                : "text-[#A1A1AA] hover:bg-white/6 hover:text-white"
            }`}
            onClick={() => onModoChange("mes")}
          >
            Por mês
          </button>
          <button
            className={`px-3.5 py-2 text-sm font-medium border-l border-[#27272A] transition-colors ${
              modoFiltro === "periodo"
                ? "bg-[#FACC15] text-black"
                : "text-[#A1A1AA] hover:bg-white/6 hover:text-white"
            }`}
            onClick={() => onModoChange("periodo")}
          >
            Período
          </button>
        </div>

        {/* Seletor de data */}
        {modoFiltro === "mes" ? (
          <MonthNavigator value={selectedMonth} onChange={onMonthChange} />
        ) : (
          <DateRangeInputs
            dataInicial={dataInicial}
            dataFinal={dataFinal}
            onChangeInicial={onDataInicialChange}
            onChangeFinal={onDataFinalChange}
          />
        )}
      </div>

      {/* Atalhos rápidos */}
      {modoFiltro === "mes" ? (
        <QuickShortcuts shortcuts={shortcutsMes} />
      ) : (
        <QuickShortcuts shortcuts={shortcutsPeriodo} />
      )}
    </div>
  );
}
