package br.com.finora.api.service;

import br.com.finora.api.dto.DashboardCategoriaResponse;
import br.com.finora.api.dto.DashboardEvolucaoMensalResponse;
import br.com.finora.api.dto.DashboardProjecaoResponse;
import br.com.finora.api.dto.DashboardResumoResponse;
import br.com.finora.api.dto.ProjecaoMensalResponse;
import br.com.finora.api.dto.TransacaoResponse;
import br.com.finora.api.entity.Transacao;
import br.com.finora.api.enums.TipoTransacao;
import br.com.finora.api.exception.RegraNegocioException;
import br.com.finora.api.repository.TransacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class DashboardService {

    private static final BigDecimal CEM = new BigDecimal("100");

    private final TransacaoRepository transacaoRepository;

    public DashboardService(TransacaoRepository transacaoRepository) {
        this.transacaoRepository = transacaoRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResumoResponse obterResumo(
            Long usuarioId,
            String mes,
            String dataInicialStr,
            String dataFinalStr,
            Long categoriaId
    ) {
        LocalDate dataInicial;
        LocalDate dataFinal;
        String mesReferencia;

        if (dataInicialStr != null && dataFinalStr != null) {
            dataInicial = parsarData(dataInicialStr);
            dataFinal = parsarData(dataFinalStr).plusDays(1);
            mesReferencia = dataInicialStr + " a " + dataFinalStr;
        } else {
            YearMonth mesRef = converterMesOuAtual(mes);
            dataInicial = mesRef.atDay(1);
            dataFinal = mesRef.plusMonths(1).atDay(1);
            mesReferencia = mesRef.toString();
        }

        List<Transacao> transacoes = transacaoRepository.buscarPorPeriodo(
                usuarioId, dataInicial, dataFinal
        );

        if (categoriaId != null) {
            transacoes = transacoes.stream()
                    .filter(t -> t.getCategoria().getId().equals(categoriaId))
                    .toList();
        }

        BigDecimal totalReceitas = somarPorTipo(transacoes, TipoTransacao.RECEITA);
        BigDecimal totalDespesas = somarPorTipo(transacoes, TipoTransacao.DESPESA);
        BigDecimal saldo = formatarValor(totalReceitas.subtract(totalDespesas));

        List<DashboardCategoriaResponse> gastosPorCategoria =
                calcularGastosPorCategoria(transacoes, totalDespesas);

        DashboardCategoriaResponse maiorCategoriaGasto =
                gastosPorCategoria.isEmpty() ? null : gastosPorCategoria.getFirst();

        List<TransacaoResponse> ultimasTransacoes = transacoes.stream()
                .limit(5)
                .map(this::converterTransacaoParaResponse)
                .toList();

        List<DashboardEvolucaoMensalResponse> evolucaoMensal =
                calcularEvolucaoMensal(usuarioId, converterMesOuAtual(mes));

        // Variação em relação ao período anterior (só para filtro mensal sem categoriaId)
        BigDecimal variacaoReceitas = null;
        BigDecimal variacaoDespesas = null;

        if (dataInicialStr == null && categoriaId == null) {
            YearMonth mesAtual = converterMesOuAtual(mes);
            YearMonth mesAnterior = mesAtual.minusMonths(1);

            List<Transacao> transacoesAnterior = transacaoRepository.buscarPorPeriodo(
                    usuarioId,
                    mesAnterior.atDay(1),
                    mesAnterior.plusMonths(1).atDay(1)
            );

            BigDecimal receitasAnterior = somarPorTipo(transacoesAnterior, TipoTransacao.RECEITA);
            BigDecimal despesasAnterior = somarPorTipo(transacoesAnterior, TipoTransacao.DESPESA);

            variacaoReceitas = calcularVariacao(totalReceitas, receitasAnterior);
            variacaoDespesas = calcularVariacao(totalDespesas, despesasAnterior);
        }

        return new DashboardResumoResponse(
                mesReferencia,
                saldo,
                totalReceitas,
                totalDespesas,
                maiorCategoriaGasto,
                gastosPorCategoria,
                ultimasTransacoes,
                evolucaoMensal,
                variacaoReceitas,
                variacaoDespesas
        );
    }

    @Transactional(readOnly = true)
    public DashboardProjecaoResponse obterProjecao(Long usuarioId) {
        YearMonth mesAtual = YearMonth.now();
        YearMonth inicioJanela = mesAtual.minusMonths(5);

        List<Transacao> transacoes = transacaoRepository.buscarPorPeriodo(
                usuarioId,
                inicioJanela.atDay(1),
                mesAtual.plusMonths(1).atDay(1)
        );

        if (transacoes.isEmpty()) {
            return new DashboardProjecaoResponse(
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    BigDecimal.ZERO, null, List.of(),
                    List.of("Cadastre transações para ver suas projeções financeiras."),
                    true
            );
        }

        // Receitas e despesas históricas totais (para saldo atual estimado)
        List<Transacao> todasTransacoes = transacaoRepository
                .findAllByUsuario_IdOrderByDataTransacaoDescIdDesc(usuarioId);

        BigDecimal totalReceitasHistorico = somarPorTipo(todasTransacoes, TipoTransacao.RECEITA);
        BigDecimal totalDespesasHistorico = somarPorTipo(todasTransacoes, TipoTransacao.DESPESA);
        BigDecimal saldoEstimado = formatarValor(totalReceitasHistorico.subtract(totalDespesasHistorico));

        // Médias mensais dos últimos 6 meses
        int mesesComDados = 0;
        BigDecimal somaReceitas = BigDecimal.ZERO;
        BigDecimal somaDespesas = BigDecimal.ZERO;

        for (int i = 0; i < 6; i++) {
            YearMonth mes = inicioJanela.plusMonths(i);
            List<Transacao> doMes = transacoes.stream()
                    .filter(t -> YearMonth.from(t.getDataTransacao()).equals(mes))
                    .toList();

            BigDecimal r = somarPorTipo(doMes, TipoTransacao.RECEITA);
            BigDecimal d = somarPorTipo(doMes, TipoTransacao.DESPESA);

            if (r.compareTo(BigDecimal.ZERO) > 0 || d.compareTo(BigDecimal.ZERO) > 0) {
                somaReceitas = somaReceitas.add(r);
                somaDespesas = somaDespesas.add(d);
                mesesComDados++;
            }
        }

        if (mesesComDados == 0) {
            return new DashboardProjecaoResponse(
                    saldoEstimado, BigDecimal.ZERO, BigDecimal.ZERO,
                    BigDecimal.ZERO, null, List.of(),
                    List.of("Dados insuficientes para projeção. Cadastre mais transações."),
                    true
            );
        }

        BigDecimal divisor = BigDecimal.valueOf(mesesComDados);
        BigDecimal mediaReceitas = formatarValor(somaReceitas.divide(divisor, 2, RoundingMode.HALF_UP));
        BigDecimal mediaDespesas = formatarValor(somaDespesas.divide(divisor, 2, RoundingMode.HALF_UP));
        BigDecimal economiaMedia = formatarValor(mediaReceitas.subtract(mediaDespesas));

        // Maior categoria de gasto
        String maiorCategoria = transacoes.stream()
                .filter(t -> t.getTipo() == TipoTransacao.DESPESA)
                .collect(Collectors.groupingBy(
                        t -> t.getCategoria().getNome(),
                        Collectors.reducing(BigDecimal.ZERO, Transacao::getValor, BigDecimal::add)
                ))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        // Projeção para os próximos 6 meses
        List<ProjecaoMensalResponse> projecoes = new ArrayList<>();
        BigDecimal saldoAcumulado = saldoEstimado;

        for (int i = 1; i <= 6; i++) {
            YearMonth mes = mesAtual.plusMonths(i);
            saldoAcumulado = formatarValor(saldoAcumulado.add(economiaMedia));
            projecoes.add(new ProjecaoMensalResponse(mes.toString(), saldoAcumulado));
        }

        // Alertas/insights
        List<String> alertas = new ArrayList<>();

        if (economiaMedia.compareTo(BigDecimal.ZERO) < 0) {
            alertas.add("Atenção: suas despesas estão maiores que suas receitas. Revise seus gastos.");
        } else if (economiaMedia.compareTo(BigDecimal.ZERO) == 0) {
            alertas.add("Suas receitas e despesas estão equilibradas. Tente aumentar sua economia.");
        } else {
            alertas.add("Você está economizando aproximadamente " + formatarBR(economiaMedia) + " por mês.");
        }

        if (maiorCategoria != null) {
            alertas.add("Sua maior categoria de gasto é " + maiorCategoria + ".");
        }

        if (!projecoes.isEmpty()) {
            BigDecimal saldo6Meses = projecoes.getLast().saldoProjetado();
            alertas.add("Mantendo esse ritmo, em 6 meses seu saldo projetado será " + formatarBR(saldo6Meses) + ".");
        }

        if (mediaDespesas.compareTo(mediaReceitas) > 0) {
            alertas.add("Suas despesas estão maiores que suas receitas. Considere reduzir gastos em " + maiorCategoria + ".");
        }

        return new DashboardProjecaoResponse(
                saldoEstimado,
                mediaReceitas,
                mediaDespesas,
                economiaMedia,
                maiorCategoria,
                projecoes,
                alertas,
                false
        );
    }

    private List<Transacao> buscarTransacoesDoMes(Long usuarioId, YearMonth mesReferencia) {
        return transacaoRepository.buscarPorPeriodo(
                usuarioId,
                mesReferencia.atDay(1),
                mesReferencia.plusMonths(1).atDay(1)
        );
    }

    private BigDecimal somarPorTipo(List<Transacao> transacoes, TipoTransacao tipo) {
        BigDecimal total = transacoes.stream()
                .filter(t -> t.getTipo() == tipo)
                .map(Transacao::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return formatarValor(total);
    }

    private List<DashboardCategoriaResponse> calcularGastosPorCategoria(
            List<Transacao> transacoes, BigDecimal totalDespesas
    ) {
        Map<String, BigDecimal> porCategoria = transacoes.stream()
                .filter(t -> t.getTipo() == TipoTransacao.DESPESA)
                .collect(Collectors.groupingBy(
                        t -> t.getCategoria().getNome(),
                        Collectors.reducing(BigDecimal.ZERO, Transacao::getValor, BigDecimal::add)
                ));

        return porCategoria.entrySet().stream()
                .map(e -> {
                    BigDecimal valor = formatarValor(e.getValue());
                    BigDecimal percentual = calcularPercentual(valor, totalDespesas);
                    return new DashboardCategoriaResponse(e.getKey(), valor, percentual);
                })
                .sorted(Comparator.comparing(DashboardCategoriaResponse::valor).reversed())
                .toList();
    }

    private List<DashboardEvolucaoMensalResponse> calcularEvolucaoMensal(
            Long usuarioId, YearMonth mesReferencia
    ) {
        YearMonth primeiroMes = mesReferencia.minusMonths(4);

        List<Transacao> transacoes = transacaoRepository.buscarPorPeriodo(
                usuarioId,
                primeiroMes.atDay(1),
                mesReferencia.plusMonths(1).atDay(1)
        );

        return IntStream.rangeClosed(0, 4)
                .mapToObj(i -> {
                    YearMonth mes = primeiroMes.plusMonths(i);
                    List<Transacao> doMes = transacoes.stream()
                            .filter(t -> YearMonth.from(t.getDataTransacao()).equals(mes))
                            .toList();

                    return new DashboardEvolucaoMensalResponse(
                            mes.toString(),
                            somarPorTipo(doMes, TipoTransacao.RECEITA),
                            somarPorTipo(doMes, TipoTransacao.DESPESA)
                    );
                })
                .toList();
    }

    private TransacaoResponse converterTransacaoParaResponse(Transacao transacao) {
        return new TransacaoResponse(
                transacao.getId(),
                transacao.getDescricao(),
                transacao.getValor(),
                transacao.getTipo(),
                transacao.getDataTransacao(),
                transacao.getObservacao(),
                transacao.getCategoria().getId(),
                transacao.getCategoria().getNome(),
                transacao.getCriadoEm()
        );
    }

    private BigDecimal calcularPercentual(BigDecimal valor, BigDecimal total) {
        if (total.compareTo(BigDecimal.ZERO) == 0) return formatarValor(BigDecimal.ZERO);
        return valor.multiply(CEM).divide(total, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcularVariacao(BigDecimal atual, BigDecimal anterior) {
        if (anterior.compareTo(BigDecimal.ZERO) == 0) return null;
        return atual.subtract(anterior)
                .multiply(CEM)
                .divide(anterior, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal formatarValor(BigDecimal valor) {
        return valor.setScale(2, RoundingMode.HALF_UP);
    }

    private YearMonth converterMesOuAtual(String mes) {
        if (mes == null || mes.isBlank()) return YearMonth.now();
        try {
            return YearMonth.parse(mes);
        } catch (DateTimeParseException e) {
            throw new RegraNegocioException("Informe o mês no formato AAAA-MM.");
        }
    }

    private LocalDate parsarData(String data) {
        try {
            return LocalDate.parse(data);
        } catch (DateTimeParseException e) {
            throw new RegraNegocioException("Informe a data no formato AAAA-MM-DD.");
        }
    }

    private String formatarBR(BigDecimal valor) {
        return "R$ " + String.format("%.2f", valor).replace(".", ",");
    }
}
