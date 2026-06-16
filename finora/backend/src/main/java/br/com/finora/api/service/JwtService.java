package br.com.finora.api.service;

import br.com.finora.api.entity.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final String issuer;
    private final long expiracaoSegundos;

    public JwtService(
            JwtEncoder jwtEncoder,
            @Value("${finora.jwt.issuer}") String issuer,
            @Value("${finora.jwt.expiracao-segundos}") long expiracaoSegundos
    ) {
        this.jwtEncoder = jwtEncoder;
        this.issuer = issuer;
        this.expiracaoSegundos = expiracaoSegundos;
    }

    public String gerarToken(Usuario usuario) {
        Instant agora = Instant.now();
        Instant expiracao = agora.plusSeconds(expiracaoSegundos);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(agora)
                .expiresAt(expiracao)
                .subject(usuario.getId().toString())
                .claim("nome", usuario.getNome())
                .claim("email", usuario.getEmail())
                .build();

        JwsHeader header = JwsHeader
                .with(MacAlgorithm.HS256)
                .type("JWT")
                .build();

        JwtEncoderParameters parametros = JwtEncoderParameters
                .from(header, claims);

        return jwtEncoder
                .encode(parametros)
                .getTokenValue();
    }

    public long getExpiracaoSegundos() {
        return expiracaoSegundos;
    }
}