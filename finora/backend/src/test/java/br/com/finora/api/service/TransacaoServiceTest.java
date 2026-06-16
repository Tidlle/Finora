package br.com.finora.api.service;

import br.com.finora.api.dto.TransacaoRequest;
import br.com.finora.api.dto.TransacaoResponse;
import br.com.finora.api.entity.Categoria;
import br.com.finora.api.entity.Transacao;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransacaoServiceTest {

    @Mock
    private TransacaoRepository transacaoRepository;

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private TransacaoService transacaoService;

    private Usuario criarUsuario(Long id) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNome("Usuário Teste");
        usuario.setEmail("teste@exemplo.com");
        return usuario;
    }

    private Categoria criarCategoria(Long id, String nome, TipoTransacao tipo, Usuario usuario) {
        Categoria categoria = new Categoria();
        categoria.setId(id);
        categoria.setNome(nome);
        categoria.setTipo(tipo);
        categoria.setPadrao(false);
        categoria.setUsuario(usuario);
        return categoria;
    }

    private Transacao criarTransacao(Long id, String descricao, BigDecimal valor, TipoTransacao tipo,
                                     Categoria categoria, Usuario usuario) {
        Transacao transacao = new Transacao();
        transacao.setId(id);
        transacao.setDescricao(descricao);
        transacao.setValor(valor);
        transacao.setTipo(tipo);
        transacao.setDataTransacao(LocalDate.now());
        transacao.setCategoria(categoria);
        transacao.setUsuario(usuario);
        transacao.setCriadoEm(OffsetDateTime.now());
        return transacao;
    }

    @Test
    void listar_deveRetornarApenasTransacoesDoUsuario() {
        Long usuarioId = 1L;
        Usuario usuario = criarUsuario(usuarioId);
        Categoria categoria = criarCategoria(1L, "Alimentação", TipoTransacao.DESPESA, usuario);

        Transacao t1 = criarTransacao(1L, "Mercado", new BigDecimal("150.00"), TipoTransacao.DESPESA, categoria, usuario);
        Transacao t2 = criarTransacao(2L, "Farmácia", new BigDecimal("50.00"), TipoTransacao.DESPESA, categoria, usuario);

        when(transacaoRepository.findAllByUsuario_IdOrderByDataTransacaoDescIdDesc(usuarioId))
                .thenReturn(List.of(t1, t2));

        List<TransacaoResponse> resultado = transacaoService.listar(usuarioId, null, null, null, null);

        assertThat(resultado).hasSize(2);
        assertThat(resultado.get(0).descricao()).isEqualTo("Mercado");
        assertThat(resultado.get(1).descricao()).isEqualTo("Farmácia");
    }

    @Test
    void criar_deveLancarExcecao_quandoTipoDaCategoriaIncompativel() {
        Long usuarioId = 1L;
        Usuario usuario = criarUsuario(usuarioId);

        Categoria categoriaReceita = criarCategoria(2L, "Salário", TipoTransacao.RECEITA, usuario);

        TransacaoRequest request = new TransacaoRequest(
                "Compra indevida",
                new BigDecimal("100.00"),
                TipoTransacao.DESPESA,
                LocalDate.now(),
                null,
                2L
        );

        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
        when(categoriaRepository.findByIdAndUsuario_Id(2L, usuarioId))
                .thenReturn(Optional.of(categoriaReceita));

        assertThatThrownBy(() -> transacaoService.criar(usuarioId, request))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("não pertence ao tipo da transação");
    }

    @Test
    void criar_deveSalvarTransacao_quandoDadosValidos() {
        Long usuarioId = 1L;
        Usuario usuario = criarUsuario(usuarioId);
        Categoria categoria = criarCategoria(1L, "Alimentação", TipoTransacao.DESPESA, usuario);

        TransacaoRequest request = new TransacaoRequest(
                "Mercado",
                new BigDecimal("200.00"),
                TipoTransacao.DESPESA,
                LocalDate.now(),
                null,
                1L
        );

        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
        when(categoriaRepository.findByIdAndUsuario_Id(1L, usuarioId))
                .thenReturn(Optional.of(categoria));

        Transacao transacaoSalva = criarTransacao(10L, "Mercado", new BigDecimal("200.00"),
                TipoTransacao.DESPESA, categoria, usuario);
        when(transacaoRepository.save(any(Transacao.class))).thenReturn(transacaoSalva);

        TransacaoResponse response = transacaoService.criar(usuarioId, request);

        assertThat(response.descricao()).isEqualTo("Mercado");
        assertThat(response.tipo()).isEqualTo(TipoTransacao.DESPESA);
        assertThat(response.categoriaNome()).isEqualTo("Alimentação");
    }

    @Test
    void atualizar_deveLancarExcecao_quandoTransacaoDeOutroUsuario() {
        Long usuarioId = 1L;
        Long transacaoId = 99L;

        when(transacaoRepository.findByIdAndUsuario_Id(transacaoId, usuarioId))
                .thenReturn(Optional.empty());

        TransacaoRequest request = new TransacaoRequest(
                "Tentativa",
                new BigDecimal("10.00"),
                TipoTransacao.DESPESA,
                LocalDate.now(),
                null,
                1L
        );

        assertThatThrownBy(() -> transacaoService.atualizar(usuarioId, transacaoId, request))
                .isInstanceOf(RecursoNaoEncontradoException.class);
    }

    @Test
    void excluir_deveLancarExcecao_quandoTransacaoDeOutroUsuario() {
        Long usuarioId = 1L;
        Long transacaoId = 99L;

        when(transacaoRepository.findByIdAndUsuario_Id(transacaoId, usuarioId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> transacaoService.excluir(usuarioId, transacaoId))
                .isInstanceOf(RecursoNaoEncontradoException.class);
    }
}
