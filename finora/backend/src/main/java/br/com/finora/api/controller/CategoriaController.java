package br.com.finora.api.controller;

import br.com.finora.api.dto.AtualizarCategoriaRequest;
import br.com.finora.api.dto.CategoriaRequest;
import br.com.finora.api.dto.CategoriaResponse;
import br.com.finora.api.enums.TipoTransacao;
import br.com.finora.api.service.CategoriaService;
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
@RequestMapping("/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @GetMapping
    public ResponseEntity<List<CategoriaResponse>> listar(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) TipoTransacao tipo
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        List<CategoriaResponse> response = categoriaService
                .listar(usuarioId, tipo);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<CategoriaResponse> criar(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CategoriaRequest request
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        CategoriaResponse response = categoriaService
                .criar(usuarioId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoriaResponse> atualizar(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @Valid @RequestBody AtualizarCategoriaRequest request
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        CategoriaResponse response = categoriaService
                .atualizar(usuarioId, id, request);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        categoriaService.excluir(usuarioId, id);

        return ResponseEntity.noContent().build();
    }

    private Long extrairUsuarioId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}