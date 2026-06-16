package br.com.finora.api.service;

import br.com.finora.api.dto.CadastroRequest;
import br.com.finora.api.dto.CadastroResponse;
import br.com.finora.api.dto.LoginRequest;
import br.com.finora.api.dto.LoginResponse;
import br.com.finora.api.entity.Categoria;
import br.com.finora.api.entity.Usuario;
import br.com.finora.api.enums.TipoTransacao;
import br.com.finora.api.exception.CredenciaisInvalidasException;
import br.com.finora.api.exception.RegraNegocioException;
import br.com.finora.api.repository.CategoriaRepository;
import br.com.finora.api.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AuthService {

    private static final List<String> CATEGORIAS_DESPESA = List.of(
            "Alimentação",
            "Transporte",
            "Moradia",
            "Educação",
            "Saúde",
            "Lazer",
            "Assinaturas",
            "Outros"
    );

    private static final List<String> CATEGORIAS_RECEITA = List.of(
            "Salário",
            "Freelance",
            "Investimentos",
            "Presente",
            "Outros"
    );

    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            CategoriaRepository categoriaRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.categoriaRepository = categoriaRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public CadastroResponse cadastrar(CadastroRequest request) {
        String nomeNormalizado = request.nome().trim();
        String emailNormalizado = normalizarEmail(request.email());

        if (usuarioRepository.existsByEmailIgnoreCase(emailNormalizado)) {
            throw new RegraNegocioException(
                    "Já existe uma conta cadastrada com este e-mail."
            );
        }

        Usuario usuario = new Usuario();
        usuario.setNome(nomeNormalizado);
        usuario.setEmail(emailNormalizado);
        usuario.setSenhaHash(passwordEncoder.encode(request.senha()));

        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        List<Categoria> categorias = criarCategoriasPadrao(usuarioSalvo);
        categoriaRepository.saveAll(categorias);

        return new CadastroResponse(
                usuarioSalvo.getId(),
                usuarioSalvo.getNome(),
                usuarioSalvo.getEmail(),
                categorias.size(),
                "Conta criada com sucesso."
        );
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String emailNormalizado = normalizarEmail(request.email());

        Usuario usuario = usuarioRepository
                .findByEmailIgnoreCase(emailNormalizado)
                .orElseThrow(CredenciaisInvalidasException::new);

        boolean senhaCorreta = passwordEncoder.matches(
                request.senha(),
                usuario.getSenhaHash()
        );

        if (!senhaCorreta) {
            throw new CredenciaisInvalidasException();
        }

        String token = jwtService.gerarToken(usuario);

        return new LoginResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                token,
                "Bearer",
                jwtService.getExpiracaoSegundos(),
                "Login realizado com sucesso."
        );
    }

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private List<Categoria> criarCategoriasPadrao(Usuario usuario) {
        List<Categoria> categorias = new ArrayList<>();

        for (String nome : CATEGORIAS_DESPESA) {
            categorias.add(
                    criarCategoria(nome, TipoTransacao.DESPESA, usuario)
            );
        }

        for (String nome : CATEGORIAS_RECEITA) {
            categorias.add(
                    criarCategoria(nome, TipoTransacao.RECEITA, usuario)
            );
        }

        return categorias;
    }

    private Categoria criarCategoria(
            String nome,
            TipoTransacao tipo,
            Usuario usuario
    ) {
        Categoria categoria = new Categoria();
        categoria.setNome(nome);
        categoria.setTipo(tipo);
        categoria.setPadrao(true);
        categoria.setUsuario(usuario);

        return categoria;
    }
}