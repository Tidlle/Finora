package br.com.finora.api.repository;

import br.com.finora.api.entity.Transacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TransacaoRepository extends JpaRepository<Transacao, Long>, JpaSpecificationExecutor<Transacao> {

    Optional<Transacao> findByIdAndUsuario_Id(
            Long transacaoId,
            Long usuarioId
    );

    boolean existsByCategoria_IdAndUsuario_Id(
            Long categoriaId,
            Long usuarioId
    );

    long countByCategoria_IdAndUsuario_Id(
            Long categoriaId,
            Long usuarioId
    );

    long countByUsuarioId(Long usuarioId);

    List<Transacao> findAllByUsuario_IdOrderByDataTransacaoDescIdDesc(
            Long usuarioId
    );

    @Query("""
            SELECT transacao
            FROM Transacao transacao
            WHERE transacao.usuario.id = :usuarioId
              AND transacao.dataTransacao >= :dataInicial
              AND transacao.dataTransacao < :dataFinalExclusiva
            ORDER BY transacao.dataTransacao DESC, transacao.id DESC
            """)
    List<Transacao> buscarPorPeriodo(
            @Param("usuarioId") Long usuarioId,
            @Param("dataInicial") LocalDate dataInicial,
            @Param("dataFinalExclusiva") LocalDate dataFinalExclusiva
    );
}