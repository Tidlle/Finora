package br.com.finora.api.controller;

import br.com.finora.api.dto.DashboardProjecaoResponse;
import br.com.finora.api.dto.DashboardResumoResponse;
import br.com.finora.api.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/resumo")
    public ResponseEntity<DashboardResumoResponse> obterResumo(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String mes,
            @RequestParam(required = false) String dataInicial,
            @RequestParam(required = false) String dataFinal,
            @RequestParam(required = false) Long categoriaId
    ) {
        Long usuarioId = Long.valueOf(jwt.getSubject());

        DashboardResumoResponse response = dashboardService.obterResumo(
                usuarioId, mes, dataInicial, dataFinal, categoriaId
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/projecao")
    public ResponseEntity<DashboardProjecaoResponse> obterProjecao(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long usuarioId = Long.valueOf(jwt.getSubject());

        DashboardProjecaoResponse response = dashboardService.obterProjecao(usuarioId);

        return ResponseEntity.ok(response);
    }
}
