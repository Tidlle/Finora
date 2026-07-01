import { useEffect, useRef, useState } from "react";
import { Bot, Calendar, Send, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  enviarPerguntaAssistente,
  type AssistenteResponse,
} from "@/services/intelligenceService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function mesesDisponiveis(): { value: string; label: string }[] {
  const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const resultado = [];
  const hoje = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
    resultado.push({ value, label });
  }
  return resultado;
}

const SUGESTOES_INICIAIS = [
  "Qual foi meu saldo este mês?",
  "Onde gastei mais?",
  "Como posso economizar?",
  "Como está minha saúde financeira?",
  "Tive algum gasto fora do padrão?",
  "Faça um resumo do meu mês.",
];

// ── Tipos locais ──────────────────────────────────────────────────────────────

type Mensagem = {
  id: number;
  origem: "usuario" | "assistente";
  texto: string;
  sugestoes?: string[];
  carregando?: boolean;
};

let _nextId = 1;
function nextId() { return _nextId++; }

// ── Componentes ───────────────────────────────────────────────────────────────

function BolhaUsuario({ texto }: { texto: string }) {
  return (
    <div className="flex justify-end">
      <div className="flex items-end gap-2 max-w-[80%]">
        <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed">
          {texto}
        </div>
        <div className="shrink-0 w-7 h-7 rounded-full bg-accent flex items-center justify-center mb-0.5">
          <User size={13} className="text-accent-foreground" />
        </div>
      </div>
    </div>
  );
}

function BolhaAssistente({
  texto,
  sugestoes,
  carregando,
  onSugestao,
}: {
  texto: string;
  sugestoes?: string[];
  carregando?: boolean;
  onSugestao: (s: string) => void;
}) {
  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2 max-w-[85%]">
        <div className="shrink-0 w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center mb-0.5">
          <Bot size={13} className="text-primary" />
        </div>
        <div className="space-y-2">
          <div className="bg-secondary/50 border border-border px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed text-foreground">
            {carregando ? (
              <div className="space-y-1.5 py-0.5">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-36" />
              </div>
            ) : (
              texto
            )}
          </div>
          {!carregando && sugestoes && sugestoes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pl-0.5">
              {sugestoes.slice(0, 3).map((s) => (
                <button
                  key={s}
                  onClick={() => onSugestao(s)}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AssistantPage() {
  const [mes, setMes] = useState(mesAtual);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const meses = mesesDisponiveis();

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [mensagens]);

  async function enviar(pergunta: string) {
    if (!pergunta.trim() || enviando) return;

    const perguntaFinal = pergunta.trim();
    setInput("");
    setEnviando(true);

    const msgUsuario: Mensagem = { id: nextId(), origem: "usuario", texto: perguntaFinal };
    const msgLoading: Mensagem = { id: nextId(), origem: "assistente", texto: "", carregando: true };

    setMensagens((prev) => [...prev, msgUsuario, msgLoading]);

    try {
      const res: AssistenteResponse = await enviarPerguntaAssistente({ pergunta: perguntaFinal, mes });
      setMensagens((prev) =>
        prev.map((m) =>
          m.id === msgLoading.id
            ? { ...m, texto: res.resposta, sugestoes: res.sugestoesPerguntas, carregando: false }
            : m
        )
      );
    } catch {
      setMensagens((prev) =>
        prev.map((m) =>
          m.id === msgLoading.id
            ? { ...m, texto: "Não foi possível obter resposta agora. Tente novamente.", carregando: false }
            : m
        )
      );
    } finally {
      setEnviando(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar(input);
    }
  }

  const semMensagens = mensagens.length === 0;

  return (
    <AppShell
      title="Finora Assistant"
      subtitle="Pergunte sobre suas finanças em linguagem natural."
    >
      {/* Seletor de mês */}
      <div className="flex items-center gap-2">
        <Calendar size={15} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Período analisado:</span>
        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="h-8 rounded-md border border-input bg-transparent px-3 text-sm text-foreground focus:outline-none"
        >
          {meses.map((m) => (
            <option key={m.value} value={m.value} className="bg-card">
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Área de chat */}
      <div className="flex flex-col flex-1 min-h-[520px] rounded-xl border border-border bg-card overflow-hidden">
        {/* Mensagens */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {semMensagens ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot size={28} className="text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-foreground">Finora Assistant</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Faça perguntas sobre suas finanças e receba respostas baseadas nos seus dados reais.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {SUGESTOES_INICIAIS.map((s) => (
                  <button
                    key={s}
                    onClick={() => enviar(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            mensagens.map((m) =>
              m.origem === "usuario" ? (
                <BolhaUsuario key={m.id} texto={m.texto} />
              ) : (
                <BolhaAssistente
                  key={m.id}
                  texto={m.texto}
                  sugestoes={m.sugestoes}
                  carregando={m.carregando}
                  onSugestao={enviar}
                />
              )
            )
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre suas finanças…"
            disabled={enviando}
            className="flex-1 h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
          />
          <Button
            size="sm"
            onClick={() => enviar(input)}
            disabled={!input.trim() || enviando}
            className="shrink-0"
          >
            <Send size={15} />
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
