package br.com.finora.api.controller;

import br.com.finora.api.dto.AlterarSenhaRequest;
import br.com.finora.api.dto.AtualizarPerfilRequest;
import br.com.finora.api.dto.PerfilResponse;
import br.com.finora.api.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping("/perfil")
    public ResponseEntity<PerfilResponse> obterPerfil(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        PerfilResponse response = usuarioService.obterPerfil(usuarioId);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/perfil")
    public ResponseEntity<PerfilResponse> atualizarPerfil(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AtualizarPerfilRequest request
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        PerfilResponse response = usuarioService.atualizarPerfil(
                usuarioId,
                request
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/senha")
    public ResponseEntity<Void> alterarSenha(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AlterarSenhaRequest request
    ) {
        Long usuarioId = extrairUsuarioId(jwt);

        usuarioService.alterarSenha(usuarioId, request);

        return ResponseEntity.noContent().build();
    }

    private Long extrairUsuarioId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}