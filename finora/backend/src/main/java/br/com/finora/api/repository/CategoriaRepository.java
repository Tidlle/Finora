package br.com.finora.api.repository;

import br.com.finora.api.entity.Categoria;
import br.com.finora.api.enums.TipoTransacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    List<Categoria> findAllByUsuario_IdOrderByTipoAscNomeAsc(Long usuarioId);

    List<Categoria> findAllByUsuario_IdAndTipoOrderByNomeAsc(
            Long usuarioId,
            TipoTransacao tipo
    );

    Optional<Categoria> findByIdAndUsuario_Id(
            Long categoriaId,
            Long usuarioId
    );

    Optional<Categoria> findByUsuario_IdAndNomeIgnoreCaseAndTipo(
            Long usuarioId,
            String nome,
            TipoTransacao tipo
    );

    long countByUsuarioId(Long usuarioId);
}