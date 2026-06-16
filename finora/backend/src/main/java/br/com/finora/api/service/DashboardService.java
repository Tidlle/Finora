package br.com.finora.api.service;

import br.com.finora.api.dto.DashboardCategoriaResponse;
import br.com.finora.api.dto.DashboardEvolucaoMensalResponse;
import br.com.finora.api.dto.DashboardResumoResponse;
import br.com.finora.api.dto.TransacaoResponse;
import br.com.finora.api.entity.Transacao;
import br.com.finora.api.enums.TipoTransacao;
import br.com.finora.api.exception.RegraNegocioException;
import br.com.finora.api.repository.TransacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
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
            String mes
    ) {
        YearMonth mesReferencia = converterMesOuAtual(mes);

        List<Transacao> transacoesDoMes = buscarTransacoesDoMes(
                usuarioId,
                mesReferencia
        );

        BigDecimal totalReceitas = somarPorTipo(
                transacoesDoMes,
                TipoTransacao.RECEITA
        );

        BigDecimal totalDespesas = somarPorTipo(
                transacoesDoMes,
                TipoTransacao.DESPESA
        );

        BigDecimal saldo = formatarValor(
                totalReceitas.subtract(totalDespesas)
        );

        List<DashboardCategoriaResponse> gastosPorCategoria =
                calcularGastosPorCategoria(
                        transacoesDoMes,
                        totalDespesas
                );

        DashboardCategoriaResponse maiorCategoriaGasto =
                gastosPorCategoria.isEmpty()
                        ? null
                        : gastosPorCategoria.getFirst();

        List<TransacaoResponse> ultimasTransacoes = transacoesDoMes
                .stream()
                .limit(5)
                .map(this::converterTransacaoParaResponse)
                .toList();

        List<DashboardEvolucaoMensalResponse> evolucaoMensal =
                calcularEvolucaoMensal(
                        usuarioId,
                        mesReferencia
                );

        return new DashboardResumoResponse(
                mesReferencia.toString(),
                saldo,
                totalReceitas,
                totalDespesas,
                maiorCategoriaGasto,
                gastosPorCategoria,
                ultimasTransacoes,
                evolucaoMensal
        );
    }

    private List<Transacao> buscarTransacoesDoMes(
            Long usuarioId,
            YearMonth mesReferencia
    ) {
        return transacaoRepository.buscarPorPeriodo(
                usuarioId,
                mesReferencia.atDay(1),
                mesReferencia.plusMonths(1).atDay(1)
        );
    }

    private BigDecimal somarPorTipo(
            List<Transacao> transacoes,
            TipoTransacao tipo
    ) {
        BigDecimal total = transacoes
                .stream()
                .filter(transacao -> transacao.getTipo() == tipo)
                .map(Transacao::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return formatarValor(total);
    }

    private List<DashboardCategoriaResponse> calcularGastosPorCategoria(
            List<Transacao> transacoes,
            BigDecimal totalDespesas
    ) {
        Map<String, BigDecimal> valoresPorCategoria = transacoes
                .stream()
                .filter(transacao -> transacao.getTipo() == TipoTransacao.DESPESA)
                .collect(Collectors.groupingBy(
                        transacao -> transacao.getCategoria().getNome(),
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                Transacao::getValor,
                                BigDecimal::add
                        )
                ));

        return valoresPorCategoria
                .entrySet()
                .stream()
                .map(item -> {
                    BigDecimal valor = formatarValor(item.getValue());
                    BigDecimal percentual = calcularPercentual(
                            valor,
                            totalDespesas
                    );

                    return new DashboardCategoriaResponse(
                            item.getKey(),
                            valor,
                            percentual
                    );
                })
                .sorted(
                        Comparator
                                .comparing(DashboardCategoriaResponse::valor)
                                .reversed()
                )
                .toList();
    }

    private List<DashboardEvolucaoMensalResponse> calcularEvolucaoMensal(
            Long usuarioId,
            YearMonth mesReferencia
    ) {
        YearMonth primeiroMes = mesReferencia.minusMonths(4);

        List<Transacao> transacoesDosCincoMeses =
                transacaoRepository.buscarPorPeriodo(
                        usuarioId,
                        primeiroMes.atDay(1),
                        mesReferencia.plusMonths(1).atDay(1)
                );

        return IntStream
                .rangeClosed(0, 4)
                .mapToObj(indice -> {
                    YearMonth mesAtual = primeiroMes.plusMonths(indice);

                    List<Transacao> transacoesDoPeriodo =
                            transacoesDosCincoMeses
                                    .stream()
                                    .filter(transacao ->
                                            YearMonth.from(
                                                    transacao.getDataTransacao()
                                            ).equals(mesAtual)
                                    )
                                    .toList();

                    BigDecimal receitas = somarPorTipo(
                            transacoesDoPeriodo,
                            TipoTransacao.RECEITA
                    );

                    BigDecimal despesas = somarPorTipo(
                            transacoesDoPeriodo,
                            TipoTransacao.DESPESA
                    );

                    return new DashboardEvolucaoMensalResponse(
                            mesAtual.toString(),
                            receitas,
                            despesas
                    );
                })
                .toList();
    }

    private TransacaoResponse converterTransacaoParaResponse(
            Transacao transacao
    ) {
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

    private BigDecimal calcularPercentual(
            BigDecimal valor,
            BigDecimal total
    ) {
        if (total.compareTo(BigDecimal.ZERO) == 0) {
            return formatarValor(BigDecimal.ZERO);
        }

        return valor
                .multiply(CEM)
                .divide(total, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal formatarValor(BigDecimal valor) {
        return valor.setScale(2, RoundingMode.HALF_UP);
    }

    private YearMonth converterMesOuAtual(String mes) {
        if (mes == null || mes.isBlank()) {
            return YearMonth.now();
        }

        try {
            return YearMonth.parse(mes);
        } catch (DateTimeParseException exception) {
            throw new RegraNegocioException(
                    "Informe o mês no formato AAAA-MM."
            );
        }
    }
}