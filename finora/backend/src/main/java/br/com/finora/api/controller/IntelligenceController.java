package br.com.finora.api.controller;

import br.com.finora.api.dto.AnomaliasResponse;
import br.com.finora.api.dto.NormalizarExtratoRequest;
import br.com.finora.api.dto.NormalizarExtratoResponse;
import br.com.finora.api.dto.AprendizadoCategoriaRequest;
import br.com.finora.api.dto.AprendizadoCategoriaResponse;
import br.com.finora.api.dto.IntelligenceLoteRequest;
import br.com.finora.api.dto.IntelligenceLoteResponse;
import br.com.finora.api.dto.IntelligenceSugestaoRequest;
import br.com.finora.api.dto.IntelligenceSugestaoResponse;
import br.com.finora.api.dto.InsightsResponse;
import br.com.finora.api.dto.PreferenciasCategoriaResponse;
import br.com.finora.api.dto.ProjecoesInteligenteResponse;
import br.com.finora.api.dto.RecomendacoesEconomiaResponse;
import br.com.finora.api.dto.ScoreFinanceiroResponse;
import br.com.finora.api.enums.TipoTransacao;
import br.com.finora.api.service.IntelligenceService;
import br.com.finora.api.service.PreferenciaCategoriaService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;

@RestController
@RequestMapping("/intelligence")
public class IntelligenceController {

    private final IntelligenceService intelligenceService;
    private final PreferenciaCategoriaService preferenciaCategoriaService;

    public IntelligenceController(
            IntelligenceService intelligenceService,
            PreferenciaCategoriaService preferenciaCategoriaService
    ) {
        this.intelligenceService = intelligenceService;
        this.preferenciaCategoriaService = preferenciaCategoriaService;
    }

    @PostMapping("/sugerir-categoria")
    public ResponseEntity<IntelligenceSugestaoResponse> sugerirCategoria(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody IntelligenceSugestaoRequest request
    ) {
        Long usuarioId = Long.valueOf(jwt.getSubject());
        return ResponseEntity.ok(intelligenceService.sugerirCategoria(usuarioId, request));
    }

    @PostMapping("/sugerir-categorias-lote")
    public ResponseEntity<IntelligenceLoteResponse> sugerirCategoriasLote(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody IntelligenceLoteRequest request
    ) {
        Long usuarioId = Long.valueOf(jwt.getSubject());
        return ResponseEntity.ok(
                intelligenceService.sugerirCategoriasLote(usuarioId, request.transacoes())
        );
    }

    @PostMapping("/aprendizado-categoria")
    public ResponseEntity<AprendizadoCategoriaResponse> registrarAprendizado(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AprendizadoCategoriaRequest request
    ) {
        Long usuarioId = Long.valueOf(jwt.getSubject());
        return ResponseEntity.ok(preferenciaCategoriaService.registrar(usuarioId, request));
    }

    @GetMapping("/preferencias-categorias")
    public ResponseEntity<PreferenciasCategoriaResponse> listarPreferencias(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String tipo
    ) {
        Long usuarioId = Long.valueOf(jwt.getSubject());
        TipoTransacao tipoEnum = (tipo != null && !tipo.isBlank()) ? TipoTransacao.valueOf(tipo.toUpperCase()) : null;
        return ResponseEntity.ok(preferenciaCategoriaService.listar(usuarioId, tipoEnum));
    }

    @GetMapping("/anomalias")
    public ResponseEntity<AnomaliasResponse> anomalias(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String mes,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicial,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFinal
    ) {
        Long usuarioId = Long.valueOf(jwt.getSubject());

        if (dataInicial != null && dataFinal != null) {
            return ResponseEntity.ok(intelligenceService.detectarAnomalias(usuarioId, dataInicial, dataFinal));
        }

        YearMonth ym = (mes != null && !mes.isBlank())
                ? YearMonth.parse(mes)
                : YearMonth.now();
        return ResponseEntity.ok(intelligenceService.detectarAnomalias(
                usuarioId, ym.atDay(1), ym.atEndOfMonth()));
    }

    @GetMapping("/projecoes")
    public ResponseEntity<ProjecoesInteligenteResponse> projecoes(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false, defaultValue = "6") int meses
    ) {
        Long usuarioId = Long.valueOf(jwt.getSubject());
        return ResponseEntity.ok(intelligenceService.gerarProjecoes(usuarioId, meses));
    }

    @GetMapping("/score-financeiro")
    public ResponseEntity<ScoreFinanceiroResponse> scoreFinanceiro(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String mes,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicial,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFinal
    ) {
        Long usuarioId = Long.valueOf(jwt.getSubject());

        if (dataInicial != null && dataFinal != null) {
            return ResponseEntity.ok(intelligenceService.gerarScoreFinanceiro(usuarioId, dataInicial, dataFinal));
        }

        YearMonth ym = (mes != null && !mes.isBlank())
                ? YearMonth.parse(mes)
                : YearMonth.now();
        return ResponseEntity.ok(intelligenceService.gerarScoreFinanceiro(
                usuarioId, ym.atDay(1), ym.atEndOfMonth()));
    }

    @GetMapping("/economias")
    public ResponseEntity<RecomendacoesEconomiaResponse> economias(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String mes,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicial,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFinal
    ) {
        Long usuarioId = Long.valueOf(jwt.getSubject());

        if (dataInicial != null && dataFinal != null) {
            return ResponseEntity.ok(intelligenceService.gerarRecomendacoesEconomia(usuarioId, dataInicial, dataFinal));
        }

        YearMonth ym = (mes != null && !mes.isBlank())
                ? YearMonth.parse(mes)
                : YearMonth.now();
        return ResponseEntity.ok(intelligenceService.gerarRecomendacoesEconomia(
                usuarioId, ym.atDay(1), ym.atEndOfMonth()));
    }

    @PostMapping("/normalizar-extrato")
    public ResponseEntity<NormalizarExtratoResponse> normalizarExtrato(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody NormalizarExtratoRequest request
    ) {
        Long usuarioId = Long.valueOf(jwt.getSubject());
        return ResponseEntity.ok(intelligenceService.normalizarExtrato(usuarioId, request));
    }

    @GetMapping("/insights")
    public ResponseEntity<InsightsResponse> insights(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String mes,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicial,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFinal
    ) {
        Long usuarioId = Long.valueOf(jwt.getSubject());

        if (dataInicial != null && dataFinal != null) {
            return ResponseEntity.ok(intelligenceService.gerarInsights(usuarioId, dataInicial, dataFinal));
        }

        YearMonth ym = (mes != null && !mes.isBlank())
                ? YearMonth.parse(mes)
                : YearMonth.now();
        return ResponseEntity.ok(intelligenceService.gerarInsights(
                usuarioId, ym.atDay(1), ym.atEndOfMonth()));
    }
}
