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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class TransacaoService {

    private final TransacaoRepository transacaoRepository;
    private final CategoriaRepository categoriaRepository;
    private final UsuarioRepository usuarioRepository;

    public TransacaoService(
            TransacaoRepository transacaoRepository,
            CategoriaRepository categoriaRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.transacaoRepository = transacaoRepository;
        this.categoriaRepository = categoriaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<TransacaoResponse> listar(
            Long usuarioId,
            TipoTransacao tipo,
            Long categoriaId,
            String mes,
            String busca
    ) {
        List<Transacao> transacoes = buscarTransacoesBase(
                usuarioId,
                mes
        );

        String buscaNormalizada = normalizarBusca(busca);

        return transacoes
                .stream()
                .filter(transacao -> tipo == null
                        || transacao.getTipo() == tipo)
                .filter(transacao -> categoriaId == null
                        || transacao.getCategoria().getId().equals(categoriaId))
                .filter(transacao -> buscaNormalizada.isBlank()
                        || transacao.getDescricao()
                        .toLowerCase()
                        .contains(buscaNormalizada.toLowerCase()))
                .map(this::converterParaResponse)
                .toList();
    }

    @Transactional
    public TransacaoResponse criar(
            Long usuarioId,
            TransacaoRequest request
    ) {
        Usuario usuario = buscarUsuario(usuarioId);

        Categoria categoria = buscarCategoriaDoUsuario(
                request.categoriaId(),
                usuarioId
        );

        validarTipoCategoria(
                categoria,
                request.tipo()
        );

        Transacao transacao = new Transacao();
        transacao.setDescricao(normalizarTextoObrigatorio(request.descricao()));
        transacao.setValor(formatarValor(request.valor()));
        transacao.setTipo(request.tipo());
        transacao.setDataTransacao(request.dataTransacao());
        transacao.setObservacao(normalizarTextoOpcional(request.observacao()));
        transacao.setCategoria(categoria);
        transacao.setUsuario(usuario);

        Transacao transacaoSalva = transacaoRepository.save(transacao);

        return converterParaResponse(transacaoSalva);
    }

    @Transactional
    public TransacaoResponse atualizar(
            Long usuarioId,
            Long transacaoId,
            TransacaoRequest request
    ) {
        Transacao transacao = buscarTransacaoDoUsuario(
                transacaoId,
                usuarioId
        );

        Categoria categoria = buscarCategoriaDoUsuario(
                request.categoriaId(),
                usuarioId
        );

        validarTipoCategoria(
                categoria,
                request.tipo()
        );

        transacao.setDescricao(normalizarTextoObrigatorio(request.descricao()));
        transacao.setValor(formatarValor(request.valor()));
        transacao.setTipo(request.tipo());
        transacao.setDataTransacao(request.dataTransacao());
        transacao.setObservacao(normalizarTextoOpcional(request.observacao()));
        transacao.setCategoria(categoria);

        Transacao transacaoAtualizada = transacaoRepository.save(transacao);

        return converterParaResponse(transacaoAtualizada);
    }

    @Transactional
    public void excluir(
            Long usuarioId,
            Long transacaoId
    ) {
        Transacao transacao = buscarTransacaoDoUsuario(
                transacaoId,
                usuarioId
        );

        transacaoRepository.delete(transacao);
    }

    private List<Transacao> buscarTransacoesBase(
            Long usuarioId,
            String mes
    ) {
        if (mes == null || mes.isBlank()) {
            return transacaoRepository
                    .findAllByUsuario_IdOrderByDataTransacaoDescIdDesc(usuarioId);
        }

        YearMonth mesReferencia = converterMes(mes);

        return transacaoRepository.buscarPorPeriodo(
                usuarioId,
                mesReferencia.atDay(1),
                mesReferencia.plusMonths(1).atDay(1)
        );
    }

    private Usuario buscarUsuario(Long usuarioId) {
        return usuarioRepository
                .findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuário autenticado não encontrado."
                ));
    }

    private Transacao buscarTransacaoDoUsuario(
            Long transacaoId,
            Long usuarioId
    ) {
        return transacaoRepository
                .findByIdAndUsuario_Id(transacaoId, usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Transação não encontrada."
                ));
    }

    private Categoria buscarCategoriaDoUsuario(
            Long categoriaId,
            Long usuarioId
    ) {
        return categoriaRepository
                .findByIdAndUsuario_Id(categoriaId, usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Categoria não encontrada."
                ));
    }

    private void validarTipoCategoria(
            Categoria categoria,
            TipoTransacao tipoTransacao
    ) {
        if (categoria.getTipo() != tipoTransacao) {
            throw new RegraNegocioException(
                    "A categoria selecionada não pertence ao tipo da transação."
            );
        }
    }

    private TransacaoResponse converterParaResponse(Transacao transacao) {
        return new TransacaoResponse(
                transacao.getId(),
                transacao.getDescricao(),
                formatarValor(transacao.getValor()),
                transacao.getTipo(),
                transacao.getDataTransacao(),
                transacao.getObservacao(),
                transacao.getCategoria().getId(),
                transacao.getCategoria().getNome(),
                transacao.getCriadoEm()
        );
    }

    private YearMonth converterMes(String mes) {
        try {
            return YearMonth.parse(mes);
        } catch (DateTimeParseException exception) {
            throw new RegraNegocioException(
                    "Informe o mês no formato AAAA-MM."
            );
        }
    }

    private String normalizarBusca(String busca) {
        if (busca == null || busca.isBlank()) {
            return "";
        }

        return busca.trim();
    }

    private String normalizarTextoObrigatorio(String texto) {
        return texto.trim();
    }

    private String normalizarTextoOpcional(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }

        return texto.trim();
    }

    private BigDecimal formatarValor(BigDecimal valor) {
        return valor.setScale(2, RoundingMode.HALF_UP);
    }
}