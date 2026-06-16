package br.com.finora.api.service;

import br.com.finora.api.dto.CadastroRequest;
import br.com.finora.api.dto.CadastroResponse;
import br.com.finora.api.dto.LoginRequest;
import br.com.finora.api.dto.LoginResponse;
import br.com.finora.api.entity.Usuario;
import br.com.finora.api.exception.CredenciaisInvalidasException;
import br.com.finora.api.exception.RegraNegocioException;
import br.com.finora.api.repository.CategoriaRepository;
import br.com.finora.api.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    void cadastrar_deveRetornarCadastroResponse_quandoDadosValidos() {
        CadastroRequest request = new CadastroRequest("Maria Silva", "maria@exemplo.com", "Senha@123");

        when(usuarioRepository.existsByEmailIgnoreCase("maria@exemplo.com")).thenReturn(false);
        when(passwordEncoder.encode("Senha@123")).thenReturn("hash_da_senha");

        Usuario usuarioSalvo = new Usuario();
        usuarioSalvo.setId(1L);
        usuarioSalvo.setNome("Maria Silva");
        usuarioSalvo.setEmail("maria@exemplo.com");
        usuarioSalvo.setSenhaHash("hash_da_senha");

        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuarioSalvo);
        when(categoriaRepository.saveAll(any())).thenReturn(List.of());

        CadastroResponse response = authService.cadastrar(request);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.nome()).isEqualTo("Maria Silva");
        assertThat(response.email()).isEqualTo("maria@exemplo.com");
        assertThat(response.mensagem()).isEqualTo("Conta criada com sucesso.");
    }

    @Test
    void cadastrar_deveLancarExcecao_quandoEmailJaCadastrado() {
        CadastroRequest request = new CadastroRequest("Maria Silva", "maria@exemplo.com", "Senha@123");

        when(usuarioRepository.existsByEmailIgnoreCase("maria@exemplo.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.cadastrar(request))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("Já existe uma conta cadastrada com este e-mail.");
    }

    @Test
    void login_deveRetornarLoginResponse_quandoCredenciaisValidas() {
        LoginRequest request = new LoginRequest("maria@exemplo.com", "Senha@123");

        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNome("Maria Silva");
        usuario.setEmail("maria@exemplo.com");
        usuario.setSenhaHash("hash_da_senha");

        when(usuarioRepository.findByEmailIgnoreCase("maria@exemplo.com"))
                .thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("Senha@123", "hash_da_senha")).thenReturn(true);
        when(jwtService.gerarToken(usuario)).thenReturn("token.jwt.gerado");
        when(jwtService.getExpiracaoSegundos()).thenReturn(3600L);

        LoginResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.token()).isEqualTo("token.jwt.gerado");
        assertThat(response.nome()).isEqualTo("Maria Silva");
        assertThat(response.mensagem()).isEqualTo("Login realizado com sucesso.");
    }

    @Test
    void login_deveLancarCredenciaisInvalidasException_quandoSenhaErrada() {
        LoginRequest request = new LoginRequest("maria@exemplo.com", "SenhaErrada");

        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setSenhaHash("hash_da_senha");

        when(usuarioRepository.findByEmailIgnoreCase("maria@exemplo.com"))
                .thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("SenhaErrada", "hash_da_senha")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(CredenciaisInvalidasException.class);
    }

    @Test
    void login_deveLancarCredenciaisInvalidasException_quandoEmailNaoExiste() {
        LoginRequest request = new LoginRequest("inexistente@exemplo.com", "Senha@123");

        when(usuarioRepository.findByEmailIgnoreCase("inexistente@exemplo.com"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(CredenciaisInvalidasException.class);
    }
}
