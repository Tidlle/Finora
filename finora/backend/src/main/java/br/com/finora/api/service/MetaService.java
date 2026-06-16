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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class MetaService {

    private static final BigDecimal ZERO = new BigDecimal("0.00");
    private static final BigDecimal CEM = new BigDecimal("100.00");

    private final MetaRepository metaRepository;
    private final UsuarioRepository usuarioRepository;

    public MetaService(
            MetaRepository metaRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.metaRepository = metaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<MetaResponse> listar(
            Long usuarioId,
            StatusMeta status
    ) {
        List<Meta> metas;

        if (status == null) {
            metas = metaRepository
                    .findAllByUsuario_IdOrderByCriadoEmDesc(usuarioId);
        } else {
            metas = metaRepository
                    .findAllByUsuario_IdAndStatusOrderByCriadoEmDesc(
                            usuarioId,
                            status
                    );
        }

        return metas
                .stream()
                .map(this::converterParaResponse)
                .toList();
    }

    @Transactional
    public MetaResponse criar(
            Long usuarioId,
            MetaRequest request
    ) {
        Usuario usuario = buscarUsuario(usuarioId);

        Meta meta = new Meta();
        meta.setNome(normalizarTextoObrigatorio(request.nome()));
        meta.setDescricao(normalizarTextoOpcional(request.descricao()));
        meta.setValorObjetivo(formatarValor(request.valorObjetivo()));
        meta.setValorAcumulado(ZERO);
        meta.setPrazo(request.prazo());
        meta.setStatus(StatusMeta.EM_ANDAMENTO);
        meta.setUsuario(usuario);

        Meta metaSalva = metaRepository.save(meta);

        return converterParaResponse(metaSalva);
    }

    @Transactional
    public MetaResponse atualizar(
            Long usuarioId,
            Long metaId,
            MetaRequest request
    ) {
        Meta meta = buscarMetaDoUsuario(metaId, usuarioId);

        meta.setNome(normalizarTextoObrigatorio(request.nome()));
        meta.setDescricao(normalizarTextoOpcional(request.descricao()));
        meta.setValorObjetivo(formatarValor(request.valorObjetivo()));
        meta.setPrazo(request.prazo());
        meta.setStatus(calcularStatus(
                meta.getValorAcumulado(),
                meta.getValorObjetivo()
        ));

        Meta metaAtualizada = metaRepository.save(meta);

        return converterParaResponse(metaAtualizada);
    }

    @Transactional
    public MetaResponse atualizarProgresso(
            Long usuarioId,
            Long metaId,
            AtualizarProgressoMetaRequest request
    ) {
        Meta meta = buscarMetaDoUsuario(metaId, usuarioId);

        BigDecimal valorAcumulado = formatarValor(
                request.valorAcumulado()
        );

        meta.setValorAcumulado(valorAcumulado);
        meta.setStatus(calcularStatus(
                valorAcumulado,
                meta.getValorObjetivo()
        ));

        Meta metaAtualizada = metaRepository.save(meta);

        return converterParaResponse(metaAtualizada);
    }

    @Transactional
    public void excluir(
            Long usuarioId,
            Long metaId
    ) {
        Meta meta = buscarMetaDoUsuario(metaId, usuarioId);

        metaRepository.delete(meta);
    }

    private Usuario buscarUsuario(Long usuarioId) {
        return usuarioRepository
                .findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuário autenticado não encontrado."
                ));
    }

    private Meta buscarMetaDoUsuario(
            Long metaId,
            Long usuarioId
    ) {
        return metaRepository
                .findByIdAndUsuario_Id(metaId, usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Meta não encontrada."
                ));
    }

    private MetaResponse converterParaResponse(Meta meta) {
        BigDecimal valorObjetivo = formatarValor(meta.getValorObjetivo());
        BigDecimal valorAcumulado = formatarValor(meta.getValorAcumulado());

        BigDecimal percentualCalculado = valorAcumulado
                .multiply(CEM)
                .divide(valorObjetivo, 2, RoundingMode.HALF_UP);

        BigDecimal progressoPercentual = percentualCalculado
                .min(CEM)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal valorRestante = valorObjetivo
                .subtract(valorAcumulado)
                .max(ZERO)
                .setScale(2, RoundingMode.HALF_UP);

        return new MetaResponse(
                meta.getId(),
                meta.getNome(),
                meta.getDescricao(),
                valorObjetivo,
                valorAcumulado,
                progressoPercentual,
                valorRestante,
                meta.getPrazo(),
                meta.getStatus()
        );
    }

    private StatusMeta calcularStatus(
            BigDecimal valorAcumulado,
            BigDecimal valorObjetivo
    ) {
        if (valorAcumulado.compareTo(valorObjetivo) >= 0) {
            return StatusMeta.CONCLUIDA;
        }

        return StatusMeta.EM_ANDAMENTO;
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