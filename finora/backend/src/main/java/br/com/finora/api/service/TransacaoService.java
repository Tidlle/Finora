package br.com.finora.api.service;

import br.com.finora.api.dto.TransacaoPageResponse;
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
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
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
    public TransacaoPageResponse listar(
            Long usuarioId,
            TipoTransacao tipo,
            Long categoriaId,
            String mes,
            String busca,
            int page,
            int size
    ) {
        LocalDate dataInicial = null;
        LocalDate dataFinal = null;

        if (mes != null && !mes.isBlank()) {
            YearMonth mesRef = converterMes(mes);
            dataInicial = mesRef.atDay(1);
            dataFinal = mesRef.atEndOfMonth();
        }

        Specification<Transacao> spec = criarSpecification(
                usuarioId, tipo, categoriaId, dataInicial, dataFinal, busca
        );

        Pageable pageable = PageRequest.of(
                page, size,
                Sort.by(Sort.Direction.DESC, "dataTransacao", "id")
        );

        Page<Transacao> resultPage = transacaoRepository.findAll(spec, pageable);

        List<TransacaoResponse> content = resultPage.getContent()
                .stream()
                .map(this::converterParaResponse)
                .toList();

        return new TransacaoPageResponse(
                content,
                resultPage.getNumber(),
                resultPage.getSize(),
                resultPage.getTotalElements(),
                resultPage.getTotalPages(),
                resultPage.isFirst(),
                resultPage.isLast()
        );
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

        validarTipoCategoria(categoria, request.tipo());

        Transacao transacao = new Transacao();
        transacao.setDescricao(normalizarTextoObrigatorio(request.descricao()));
        transacao.setValor(formatarValor(request.valor()));
        transacao.setTipo(request.tipo());
        transacao.setDataTransacao(request.dataTransacao());
        transacao.setObservacao(normalizarTextoOpcional(request.observacao()));
        transacao.setCategoria(categoria);
        transacao.setUsuario(usuario);

        return converterParaResponse(transacaoRepository.save(transacao));
    }

    @Transactional
    public TransacaoResponse atualizar(
            Long usuarioId,
            Long transacaoId,
            TransacaoRequest request
    ) {
        Transacao transacao = buscarTransacaoDoUsuario(transacaoId, usuarioId);
        Categoria categoria = buscarCategoriaDoUsuario(request.categoriaId(), usuarioId);

        validarTipoCategoria(categoria, request.tipo());

        transacao.setDescricao(normalizarTextoObrigatorio(request.descricao()));
        transacao.setValor(formatarValor(request.valor()));
        transacao.setTipo(request.tipo());
        transacao.setDataTransacao(request.dataTransacao());
        transacao.setObservacao(normalizarTextoOpcional(request.observacao()));
        transacao.setCategoria(categoria);

        return converterParaResponse(transacaoRepository.save(transacao));
    }

    @Transactional
    public void excluir(Long usuarioId, Long transacaoId) {
        transacaoRepository.delete(buscarTransacaoDoUsuario(transacaoId, usuarioId));
    }

    private Specification<Transacao> criarSpecification(
            Long usuarioId,
            TipoTransacao tipo,
            Long categoriaId,
            LocalDate dataInicial,
            LocalDate dataFinal,
            String busca
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("usuario").get("id"), usuarioId));

            if (tipo != null) {
                predicates.add(cb.equal(root.get("tipo"), tipo));
            }

            if (categoriaId != null) {
                predicates.add(cb.equal(root.get("categoria").get("id"), categoriaId));
            }

            if (dataInicial != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("dataTransacao"), dataInicial));
            }

            if (dataFinal != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("dataTransacao"), dataFinal));
            }

            if (busca != null && !busca.isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("descricao")),
                        "%" + busca.trim().toLowerCase() + "%"
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Usuario buscarUsuario(Long usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário autenticado não encontrado."));
    }

    private Transacao buscarTransacaoDoUsuario(Long transacaoId, Long usuarioId) {
        return transacaoRepository.findByIdAndUsuario_Id(transacaoId, usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Transação não encontrada."));
    }

    private Categoria buscarCategoriaDoUsuario(Long categoriaId, Long usuarioId) {
        return categoriaRepository.findByIdAndUsuario_Id(categoriaId, usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria não encontrada."));
    }

    private void validarTipoCategoria(Categoria categoria, TipoTransacao tipoTransacao) {
        if (categoria.getTipo() != tipoTransacao) {
            throw new RegraNegocioException("A categoria selecionada não pertence ao tipo da transação.");
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
        } catch (DateTimeParseException e) {
            throw new RegraNegocioException("Informe o mês no formato AAAA-MM.");
        }
    }

    private String normalizarTextoObrigatorio(String texto) {
        return texto.trim();
    }

    private String normalizarTextoOpcional(String texto) {
        if (texto == null || texto.isBlank()) return null;
        return texto.trim();
    }

    private BigDecimal formatarValor(BigDecimal valor) {
        return valor.setScale(2, RoundingMode.HALF_UP);
    }
}
