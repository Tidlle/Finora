package br.com.finora.api.controller;

import br.com.finora.api.dto.IntelligenceLoteRequest;
import br.com.finora.api.dto.IntelligenceLoteResponse;
import br.com.finora.api.dto.IntelligenceSugestaoRequest;
import br.com.finora.api.dto.IntelligenceSugestaoResponse;
import br.com.finora.api.service.IntelligenceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/intelligence")
public class IntelligenceController {

    private final IntelligenceService intelligenceService;

    public IntelligenceController(IntelligenceService intelligenceService) {
        this.intelligenceService = intelligenceService;
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
}
