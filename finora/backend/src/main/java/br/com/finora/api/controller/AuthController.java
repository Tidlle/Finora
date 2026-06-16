package br.com.finora.api.controller;

import br.com.finora.api.dto.CadastroRequest;
import br.com.finora.api.dto.CadastroResponse;
import br.com.finora.api.dto.LoginRequest;
import br.com.finora.api.dto.LoginResponse;
import br.com.finora.api.dto.PerfilAutenticadoResponse;
import br.com.finora.api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/cadastro")
    public ResponseEntity<CadastroResponse> cadastrar(
            @Valid @RequestBody CadastroRequest request
    ) {
        CadastroResponse response = authService.cadastrar(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        LoginResponse response = authService.login(request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<PerfilAutenticadoResponse> obterUsuarioAutenticado(
            @AuthenticationPrincipal Jwt jwt
    ) {
        PerfilAutenticadoResponse response = new PerfilAutenticadoResponse(
                Long.valueOf(jwt.getSubject()),
                jwt.getClaimAsString("nome"),
                jwt.getClaimAsString("email")
        );

        return ResponseEntity.ok(response);
    }
}