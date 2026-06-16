package br.com.finora.api.repository;

import br.com.finora.api.entity.Meta;
import br.com.finora.api.enums.StatusMeta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MetaRepository extends JpaRepository<Meta, Long> {

    Optional<Meta> findByIdAndUsuario_Id(
            Long metaId,
            Long usuarioId
    );

    List<Meta> findAllByUsuario_IdOrderByCriadoEmDesc(
            Long usuarioId
    );

    List<Meta> findAllByUsuario_IdAndStatusOrderByCriadoEmDesc(
            Long usuarioId,
            StatusMeta status
    );

    long countByUsuarioId(Long usuarioId);
}