package br.com.finora.api.service;

import br.com.finora.api.dto.AtualizarCategoriaRequest;
import br.com.finora.api.dto.CategoriaRequest;
import br.com.finora.api.dto.CategoriaResponse;
import br.com.finora.api.entity.Categoria;
import br.com.finora.api.entity.Usuario;
import br.com.finora.api.enums.TipoTransacao;
import br.com.finora.api.exception.RecursoNaoEncontradoException;
import br.com.finora.api.exception.RegraNegocioException;
import br.com.finora.api.repository.CategoriaRepository;
import br.com.finora.api.repository.TransacaoRepository;
import br.com.finora.api.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoriaServiceTest {

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private TransacaoRepository transacaoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private CategoriaService categoriaService;

    private Usuario criarUsuario(Long id) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNome("Usuário Teste");
        usuario.setEmail("teste@exemplo.com");
        return usuario;
    }

    private Categoria criarCategoria(Long id, String nome, TipoTransacao tipo, boolean padrao, Usuario usuario) {
        Categoria categoria = new Categoria();
        categoria.setId(id);
        categoria.setNome(nome);
        categoria.setTipo(tipo);
        categoria.setPadrao(padrao);
        categoria.setUsuario(usuario);
        return categoria;
    }

    @Test
    void listar_deveRetornarApenasCategoriasDoUsuario() {
        Long usuarioId = 1L;
        Usuario usuario = criarUsuario(usuarioId);

        Categoria c1 = criarCategoria(1L, "Alimentação", TipoTransacao.DESPESA, true, usuario);
        Categoria c2 = criarCategoria(2L, "Salário", TipoTransacao.RECEITA, true, usuario);

        when(categoriaRepository.findAllByUsuario_IdOrderByTipoAscNomeAsc(usuarioId))
                .thenReturn(List.of(c1, c2));
        when(transacaoRepository.countByCategoria_IdAndUsuario_Id(any(), any())).thenReturn(0L);

        List<CategoriaResponse> resultado = categoriaService.listar(usuarioId, null);

        assertThat(resultado).hasSize(2);
        assertThat(resultado.get(0).nome()).isEqualTo("Alimentação");
        assertThat(resultado.get(1).nome()).isEqualTo("Salário");
    }

    @Test
    void criar_deveSalvarCategoria_quandoDadosValidos() {
        Long usuarioId = 1L;
        Usuario usuario = criarUsuario(usuarioId);
        CategoriaRequest request = new CategoriaRequest("Pets", TipoTransacao.DESPESA);

        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
        when(categoriaRepository.findByUsuario_IdAndNomeIgnoreCaseAndTipo(usuarioId, "Pets", TipoTransacao.DESPESA))
                .thenReturn(Optional.empty());

        Categoria categoriaSalva = criarCategoria(10L, "Pets", TipoTransacao.DESPESA, false, usuario);
        when(categoriaRepository.save(any(Categoria.class))).thenReturn(categoriaSalva);
        when(transacaoRepository.countByCategoria_IdAndUsuario_Id(10L, usuarioId)).thenReturn(0L);

        CategoriaResponse response = categoriaService.criar(usuarioId, request);

        assertThat(response.nome()).isEqualTo("Pets");
        assertThat(response.tipo()).isEqualTo(TipoTransacao.DESPESA);
        assertThat(response.padrao()).isFalse();
    }

    @Test
    void atualizar_deveLancarExcecao_quandoCategoriaForPadrao() {
        Long usuarioId = 1L;
        Long categoriaId = 1L;
        Usuario usuario = criarUsuario(usuarioId);
        Categoria categoriaPadrao = criarCategoria(categoriaId, "Alimentação", TipoTransacao.DESPESA, true, usuario);

        when(categoriaRepository.findByIdAndUsuario_Id(categoriaId, usuarioId))
                .thenReturn(Optional.of(categoriaPadrao));

        AtualizarCategoriaRequest request = new AtualizarCategoriaRequest("Comida");

        assertThatThrownBy(() -> categoriaService.atualizar(usuarioId, categoriaId, request))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("Categorias padrão não podem ser editadas.");
    }

    @Test
    void atualizar_deveLancarExcecao_quandoCategoriaDeOutroUsuario() {
        Long usuarioId = 1L;
        Long categoriaId = 99L;

        when(categoriaRepository.findByIdAndUsuario_Id(categoriaId, usuarioId))
                .thenReturn(Optional.empty());

        AtualizarCategoriaRequest request = new AtualizarCategoriaRequest("Nova");

        assertThatThrownBy(() -> categoriaService.atualizar(usuarioId, categoriaId, request))
                .isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    void excluir_deveLancarExcecao_quandoCategoriaForPadrao() {
        Long usuarioId = 1L;
        Long categoriaId = 1L;
        Usuario usuario = criarUsuario(usuarioId);
        Categoria categoriaPadrao = criarCategoria(categoriaId, "Alimentação", TipoTransacao.DESPESA, true, usuario);

        when(categoriaRepository.findByIdAndUsuario_Id(categoriaId, usuarioId))
                .thenReturn(Optional.of(categoriaPadrao));

        assertThatThrownBy(() -> categoriaService.excluir(usuarioId, categoriaId))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("Categorias padrão não podem ser excluídas.");
    }

    @Test
    void excluir_deveLancarExcecao_quandoCategoriaEmUso() {
        Long usuarioId = 1L;
        Long categoriaId = 10L;
        Usuario usuario = criarUsuario(usuarioId);
        Categoria categoriaPersonalizada = criarCategoria(categoriaId, "Pets", TipoTransacao.DESPESA, false, usuario);

        when(categoriaRepository.findByIdAndUsuario_Id(categoriaId, usuarioId))
                .thenReturn(Optional.of(categoriaPersonalizada));
        when(transacaoRepository.existsByCategoria_IdAndUsuario_Id(categoriaId, usuarioId))
                .thenReturn(true);

        assertThatThrownBy(() -> categoriaService.excluir(usuarioId, categoriaId))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("possui transações vinculadas");
    }
}
