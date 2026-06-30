package br.com.finora.api.service;

import br.com.finora.api.dto.AprendizadoCategoriaRequest;
import br.com.finora.api.dto.AprendizadoCategoriaResponse;
import br.com.finora.api.dto.PreferenciaCategoriaDto;
import br.com.finora.api.dto.PreferenciasCategoriaResponse;
import br.com.finora.api.entity.Categoria;
import br.com.finora.api.entity.PreferenciaCategoria;
import br.com.finora.api.entity.Usuario;
import br.com.finora.api.enums.TipoTransacao;
import br.com.finora.api.repository.CategoriaRepository;
import br.com.finora.api.repository.PreferenciaCategoriaRepository;
import br.com.finora.api.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.List;

@Service
public class PreferenciaCategoriaService {

    private final PreferenciaCategoriaRepository repository;
    private final CategoriaRepository categoriaRepository;
    private final UsuarioRepository usuarioRepository;

    public PreferenciaCategoriaService(
            PreferenciaCategoriaRepository repository,
            CategoriaRepository categoriaRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.repository = repository;
        this.categoriaRepository = categoriaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public AprendizadoCategoriaResponse registrar(Long usuarioId, AprendizadoCategoriaRequest req) {
        if (req.descricaoOriginal() == null || req.descricaoOriginal().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Descrição não pode ser vazia.");
        }

        Categoria categoria = categoriaRepository.findByIdAndUsuario_Id(req.categoriaId(), usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Categoria não encontrada ou não pertence ao usuário."));

        // Compatibilidade de tipo
        if (categoria.getTipo() != req.tipo()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tipo da categoria incompatível com o tipo da transação.");
        }

        String descNorm = normalizar(req.descricaoOriginal());

        // Incrementar se já existe preferência igual
        var existente = repository.findByUsuarioIdAndTipoAndDescricaoNormalizadaAndCategoriaId(
                usuarioId, req.tipo(), descNorm, req.categoriaId());

        if (existente.isPresent()) {
            PreferenciaCategoria pref = existente.get();
            pref.setQuantidadeUsos(pref.getQuantidadeUsos() + 1);
            repository.save(pref);
            return new AprendizadoCategoriaResponse(
                    "Preferência de categoria atualizada.",
                    descNorm, pref.getCategoria().getId(),
                    pref.getCategoriaNome(), pref.getQuantidadeUsos()
            );
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));

        PreferenciaCategoria nova = new PreferenciaCategoria();
        nova.setUsuario(usuario);
        nova.setDescricaoOriginal(req.descricaoOriginal().trim());
        nova.setDescricaoNormalizada(descNorm);
        nova.setTipo(req.tipo());
        nova.setCategoria(categoria);
        nova.setCategoriaNome(categoria.getNome());
        nova.setQuantidadeUsos(1);
        repository.save(nova);

        return new AprendizadoCategoriaResponse(
                "Preferência de categoria registrada com sucesso.",
                descNorm, categoria.getId(), categoria.getNome(), 1
        );
    }

    public PreferenciasCategoriaResponse listar(Long usuarioId, TipoTransacao tipo) {
        List<PreferenciaCategoria> prefs = (tipo != null)
                ? repository.findByUsuarioIdAndTipoOrderByQuantidadeUsosDescAtualizadoEmDesc(usuarioId, tipo)
                : repository.findByUsuarioIdOrderByQuantidadeUsosDescAtualizadoEmDesc(usuarioId);

        List<PreferenciaCategoriaDto> dtos = prefs.stream().map(p -> new PreferenciaCategoriaDto(
                p.getId(),
                p.getDescricaoOriginal(),
                p.getDescricaoNormalizada(),
                p.getTipo().name(),
                p.getCategoria().getId(),
                p.getCategoriaNome(),
                p.getQuantidadeUsos(),
                p.getAtualizadoEm()
        )).toList();

        return new PreferenciasCategoriaResponse(dtos);
    }

    /** Retorna preferências prontas para incluir no payload do Python. */
    public List<PreferenciaCategoriaDto> listarParaPython(Long usuarioId, TipoTransacao tipo) {
        return listar(usuarioId, tipo).preferencias();
    }

    public static String normalizar(String texto) {
        if (texto == null) return "";
        String semAcento = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return semAcento.toLowerCase()
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
