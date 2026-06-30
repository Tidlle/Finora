package br.com.finora.api.repository;

import br.com.finora.api.entity.PreferenciaCategoria;
import br.com.finora.api.enums.TipoTransacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PreferenciaCategoriaRepository extends JpaRepository<PreferenciaCategoria, Long> {

    List<PreferenciaCategoria> findByUsuarioIdAndTipoOrderByQuantidadeUsosDescAtualizadoEmDesc(
            Long usuarioId, TipoTransacao tipo);

    List<PreferenciaCategoria> findByUsuarioIdOrderByQuantidadeUsosDescAtualizadoEmDesc(Long usuarioId);

    Optional<PreferenciaCategoria> findByUsuarioIdAndTipoAndDescricaoNormalizadaAndCategoriaId(
            Long usuarioId, TipoTransacao tipo, String descricaoNormalizada, Long categoriaId);
}
