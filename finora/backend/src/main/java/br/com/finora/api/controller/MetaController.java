package br.com.finora.api.controller;

import br.com.finora.api.dto.AtualizarProgressoMetaRequest;
import br.com.finora.api.dto.MetaRequest;
import br.com.finora.api.dto.MetaResponse;
import br.com.finora.api.enums.StatusMeta;
import br.com.finora.api.service.MetaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/metas")
public class MetaController {

    private final MetaService metaService;

    public MetaController(MetaService metaService) {
        this.metaService = metaService;
    }

    @GetMapping
    public ResponseEntity<List<MetaResponse>> listar(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) StatusMeta status
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        List<MetaResponse> response = metaService.listar(
                usuarioId,
                status
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<MetaResponse> criar(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody MetaRequest request
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        MetaResponse response = metaService.criar(
                usuarioId,
                request
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MetaResponse> atualizar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @Valid @RequestBody MetaRequest request
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        MetaResponse response = metaService.atualizar(
                usuarioId,
                id,
                request
        );

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/progresso")
    public ResponseEntity<MetaResponse> atualizarProgresso(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @Valid @RequestBody AtualizarProgressoMetaRequest request
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        MetaResponse response = metaService.atualizarProgresso(
                usuarioId,
                id,
                request
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        metaService.excluir(usuarioId, id);

        return ResponseEntity.noContent().build();
    }

    private Long extrairUsuarioId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}