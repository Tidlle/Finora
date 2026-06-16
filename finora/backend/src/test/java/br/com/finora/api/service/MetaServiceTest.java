package br.com.finora.api.service;

import br.com.finora.api.dto.AtualizarProgressoMetaRequest;
import br.com.finora.api.dto.MetaRequest;
import br.com.finora.api.dto.MetaResponse;
import br.com.finora.api.entity.Meta;
import br.com.finora.api.entity.Usuario;
import br.com.finora.api.enums.StatusMeta;
import br.com.finora.api.exception.RecursoNaoEncontradoException;
import br.com.finora.api.repository.MetaRepository;
import br.com.finora.api.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MetaServiceTest {

    @Mock
    private MetaRepository metaRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private MetaService metaService;

    private Usuario criarUsuario(Long id) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNome("Usuário Teste");
        usuario.setEmail("teste@exemplo.com");
        return usuario;
    }

    private Meta criarMeta(Long id, String nome, BigDecimal objetivo, BigDecimal acumulado,
                           StatusMeta status, Usuario usuario) {
        Meta meta = new Meta();
        meta.setId(id);
        meta.setNome(nome);
        meta.setValorObjetivo(objetivo);
        meta.setValorAcumulado(acumulado);
        meta.setStatus(status);
        meta.setUsuario(usuario);
        return meta;
    }

    @Test
    void criar_deveSalvarMeta_quandoDadosValidos() {
        Long usuarioId = 1L;
        Usuario usuario = criarUsuario(usuarioId);

        MetaRequest request = new MetaRequest(
                "Reserva de emergência",
                "Guardar para imprevistos",
                new BigDecimal("5000.00"),
                null
        );

        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));

        Meta metaSalva = criarMeta(1L, "Reserva de emergência",
                new BigDecimal("5000.00"), new BigDecimal("0.00"),
                StatusMeta.EM_ANDAMENTO, usuario);
        when(metaRepository.save(any(Meta.class))).thenReturn(metaSalva);

        MetaResponse response = metaService.criar(usuarioId, request);

        assertThat(response.nome()).isEqualTo("Reserva de emergência");
        assertThat(response.status()).isEqualTo(StatusMeta.EM_ANDAMENTO);
        assertThat(response.valorAcumulado()).isEqualByComparingTo("0.00");
    }

    @Test
    void atualizarProgresso_deveSetarStatusConcluida_quandoValorAtingeObjetivo() {
        Long usuarioId = 1L;
        Long metaId = 1L;
        Usuario usuario = criarUsuario(usuarioId);

        Meta meta = criarMeta(metaId, "Notebook",
                new BigDecimal("3000.00"), new BigDecimal("1000.00"),
                StatusMeta.EM_ANDAMENTO, usuario);

        when(metaRepository.findByIdAndUsuario_Id(metaId, usuarioId))
                .thenReturn(Optional.of(meta));

        Meta metaAtualizada = criarMeta(metaId, "Notebook",
                new BigDecimal("3000.00"), new BigDecimal("3000.00"),
                StatusMeta.CONCLUIDA, usuario);
        when(metaRepository.save(any(Meta.class))).thenReturn(metaAtualizada);

        AtualizarProgressoMetaRequest request = new AtualizarProgressoMetaRequest(new BigDecimal("3000.00"));

        MetaResponse response = metaService.atualizarProgresso(usuarioId, metaId, request);

        assertThat(response.status()).isEqualTo(StatusMeta.CONCLUIDA);
        assertThat(response.progressoPercentual()).isEqualByComparingTo("100.00");
    }

    @Test
    void atualizarProgresso_deveManterStatusEmAndamento_quandoValorAbaixoObjetivo() {
        Long usuarioId = 1L;
        Long metaId = 1L;
        Usuario usuario = criarUsuario(usuarioId);

        Meta meta = criarMeta(metaId, "Viagem",
                new BigDecimal("10000.00"), new BigDecimal("0.00"),
                StatusMeta.EM_ANDAMENTO, usuario);

        when(metaRepository.findByIdAndUsuario_Id(metaId, usuarioId))
                .thenReturn(Optional.of(meta));

        Meta metaAtualizada = criarMeta(metaId, "Viagem",
                new BigDecimal("10000.00"), new BigDecimal("4000.00"),
                StatusMeta.EM_ANDAMENTO, usuario);
        when(metaRepository.save(any(Meta.class))).thenReturn(metaAtualizada);

        AtualizarProgressoMetaRequest request = new AtualizarProgressoMetaRequest(new BigDecimal("4000.00"));

        MetaResponse response = metaService.atualizarProgresso(usuarioId, metaId, request);

        assertThat(response.status()).isEqualTo(StatusMeta.EM_ANDAMENTO);
        assertThat(response.progressoPercentual()).isEqualByComparingTo("40.00");
    }

    @Test
    void excluir_deveLancarExcecao_quandoMetaDeOutroUsuario() {
        Long usuarioId = 1L;
        Long metaId = 99L;

        when(metaRepository.findByIdAndUsuario_Id(metaId, usuarioId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> metaService.excluir(usuarioId, metaId))
                .isInstanceOf(RecursoNaoEncontradoException.class);
    }
}
