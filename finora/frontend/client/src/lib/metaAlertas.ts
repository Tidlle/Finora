import type { MetaResponse } from "@/services/metaService";

export type AlertaMeta = {
  meta: MetaResponse;
  tipo: "concluida" | "quaseConcluida" | "prazoProximo" | "vencida";
  mensagem: string;
};

export function classificarAlertasMetas(metas: MetaResponse[]): AlertaMeta[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const alertas: AlertaMeta[] = [];

  for (const meta of metas) {
    if (meta.status === "CONCLUIDA" || meta.progressoPercentual >= 100) {
      alertas.push({
        meta,
        tipo: "concluida",
        mensagem: `Meta "${meta.nome}" concluída! Parabéns!`,
      });
      continue;
    }

    if (meta.prazo) {
      const dataPrazo = new Date(meta.prazo + "T00:00:00");
      const diffMs = dataPrazo.getTime() - hoje.getTime();
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDias < 0) {
        alertas.push({
          meta,
          tipo: "vencida",
          mensagem: `Meta "${meta.nome}" está com prazo vencido.`,
        });
        continue;
      }

      if (diffDias <= 7) {
        alertas.push({
          meta,
          tipo: "prazoProximo",
          mensagem: `Meta "${meta.nome}" vence em ${diffDias === 0 ? "hoje" : diffDias + " dia(s)"}.`,
        });
        continue;
      }
    }

    if (meta.progressoPercentual >= 80) {
      alertas.push({
        meta,
        tipo: "quaseConcluida",
        mensagem: `Meta "${meta.nome}" está a ${100 - meta.progressoPercentual}% de ser concluída.`,
      });
    }
  }

  return alertas;
}

const SESSION_KEY = "finora_alertas_exibidos";

export function alertasJaExibidos(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

export function marcarAlertasComoExibidos(): void {
  sessionStorage.setItem(SESSION_KEY, "true");
}
