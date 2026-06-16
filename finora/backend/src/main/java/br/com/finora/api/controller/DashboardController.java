package br.com.finora.api.controller;

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
            @RequestParam(required = false) String mes
    ) {
        Long usuarioId = Long.valueOf(jwt.getSubject());

        DashboardResumoResponse response = dashboardService
                .obterResumo(usuarioId, mes);

        return ResponseEntity.ok(response);
    }
}