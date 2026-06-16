package br.com.finora.api.service;

import br.com.finora.api.dto.AlterarSenhaRequest;
import br.com.finora.api.dto.AtualizarPerfilRequest;
import br.com.finora.api.dto.PerfilResponse;
import br.com.finora.api.entity.Usuario;
import br.com.finora.api.exception.RecursoNaoEncontradoException;
import br.com.finora.api.exception.RegraNegocioException;
import br.com.finora.api.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public PerfilResponse obterPerfil(Long usuarioId) {
        Usuario usuario = buscarUsuario(usuarioId);

        return converterParaResponse(usuario);
    }

    @Transactional
    public PerfilResponse atualizarPerfil(
            Long usuarioId,
            AtualizarPerfilRequest request
    ) {
        Usuario usuario = buscarUsuario(usuarioId);

        String nomeNormalizado = request.nome().trim();
        String emailNormalizado = normalizarEmail(request.email());

        boolean emailFoiAlterado = !usuario
                .getEmail()
                .equalsIgnoreCase(emailNormalizado);

        if (emailFoiAlterado
                && usuarioRepository.existsByEmailIgnoreCase(emailNormalizado)) {
            throw new RegraNegocioException(
                    "Este e-mail já pertence a outra conta."
            );
        }

        usuario.setNome(nomeNormalizado);
        usuario.setEmail(emailNormalizado);

        Usuario usuarioAtualizado = usuarioRepository.save(usuario);

        return converterParaResponse(usuarioAtualizado);
    }

    @Transactional
    public void alterarSenha(
            Long usuarioId,
            AlterarSenhaRequest request
    ) {
        Usuario usuario = buscarUsuario(usuarioId);

        boolean senhaAtualCorreta = passwordEncoder.matches(
                request.senhaAtual(),
                usuario.getSenhaHash()
        );

        if (!senhaAtualCorreta) {
            throw new RegraNegocioException(
                    "A senha atual está incorreta."
            );
        }

        boolean novaSenhaIgualAtual = passwordEncoder.matches(
                request.novaSenha(),
                usuario.getSenhaHash()
        );

        if (novaSenhaIgualAtual) {
            throw new RegraNegocioException(
                    "A nova senha deve ser diferente da senha atual."
            );
        }

        usuario.setSenhaHash(
                passwordEncoder.encode(request.novaSenha())
        );

        usuarioRepository.save(usuario);
    }

    private Usuario buscarUsuario(Long usuarioId) {
        return usuarioRepository
                .findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuário não encontrado."
                ));
    }

    private PerfilResponse converterParaResponse(Usuario usuario) {
        return new PerfilResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getCriadoEm()
        );
    }

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}