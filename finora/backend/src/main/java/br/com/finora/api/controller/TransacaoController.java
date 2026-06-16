package br.com.finora.api.controller;

import br.com.finora.api.dto.TransacaoRequest;
import br.com.finora.api.dto.TransacaoResponse;
import br.com.finora.api.enums.TipoTransacao;
import br.com.finora.api.service.TransacaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/transacoes")
public class TransacaoController {

    private final TransacaoService transacaoService;

    public TransacaoController(TransacaoService transacaoService) {
        this.transacaoService = transacaoService;
    }

    @GetMapping
    public ResponseEntity<List<TransacaoResponse>> listar(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) TipoTransacao tipo,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) String mes,
            @RequestParam(required = false) String busca
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        List<TransacaoResponse> response = transacaoService.listar(
                usuarioId,
                tipo,
                categoriaId,
                mes,
                busca
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<TransacaoResponse> criar(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody TransacaoRequest request
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        TransacaoResponse response = transacaoService.criar(
                usuarioId,
                request
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransacaoResponse> atualizar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @Valid @RequestBody TransacaoRequest request
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        TransacaoResponse response = transacaoService.atualizar(
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

        transacaoService.excluir(usuarioId, id);

        return ResponseEntity.noContent().build();
    }

    private Long extrairUsuarioId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}