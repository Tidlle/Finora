package br.com.finora.api.service;

import br.com.finora.api.dto.AtualizarCategoriaRequest;
import br.com.finora.api.dto.CategoriaRequest;
import br.com.finora.api.dto.CategoriaResponse;
import br.com.finora.api.entity.Categoria;
import br.com.finora.api.entity.Usuario;
import br.com.finora.api.enums.TipoTransacao;
import br.com.finora.api.exception.RecursoNaoEncontradoException;
import br.com.finora.api.exception.RegraNegocioException;
import br.com.finora.api.repository.CategoriaRepository;
import br.com.finora.api.repository.TransacaoRepository;
import br.com.finora.api.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final TransacaoRepository transacaoRepository;
    private final UsuarioRepository usuarioRepository;

    public CategoriaService(
            CategoriaRepository categoriaRepository,
            TransacaoRepository transacaoRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.categoriaRepository = categoriaRepository;
        this.transacaoRepository = transacaoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar(
            Long usuarioId,
            TipoTransacao tipo
    ) {
        List<Categoria> categorias;

        if (tipo == null) {
            categorias = categoriaRepository
                    .findAllByUsuario_IdOrderByTipoAscNomeAsc(usuarioId);
        } else {
            categorias = categoriaRepository
                    .findAllByUsuario_IdAndTipoOrderByNomeAsc(usuarioId, tipo);
        }

        return categorias
                .stream()
                .map(categoria -> converterParaResponse(categoria, usuarioId))
                .toList();
    }

    @Transactional
    public CategoriaResponse criar(
            Long usuarioId,
            CategoriaRequest request
    ) {
        Usuario usuario = usuarioRepository
                .findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Usuário autenticado não encontrado."
                ));

        String nomeNormalizado = normalizarNome(request.nome());

        validarCategoriaDuplicada(
                usuarioId,
                null,
                nomeNormalizado,
                request.tipo()
        );

        Categoria categoria = new Categoria();
        categoria.setNome(nomeNormalizado);
        categoria.setTipo(request.tipo());
        categoria.setPadrao(false);
        categoria.setUsuario(usuario);

        Categoria categoriaSalva = categoriaRepository.save(categoria);

        return converterParaResponse(categoriaSalva, usuarioId);
    }

    @Transactional
    public CategoriaResponse atualizar(
            Long usuarioId,
            Long categoriaId,
            AtualizarCategoriaRequest request
    ) {
        Categoria categoria = buscarCategoriaDoUsuario(categoriaId, usuarioId);

        if (Boolean.TRUE.equals(categoria.getPadrao())) {
            throw new RegraNegocioException(
                    "Categorias padrão não podem ser editadas."
            );
        }

        String nomeNormalizado = normalizarNome(request.nome());

        validarCategoriaDuplicada(
                usuarioId,
                categoria.getId(),
                nomeNormalizado,
                categoria.getTipo()
        );

        categoria.setNome(nomeNormalizado);

        Categoria categoriaAtualizada = categoriaRepository.save(categoria);

        return converterParaResponse(categoriaAtualizada, usuarioId);
    }

    @Transactional
    public void excluir(
            Long usuarioId,
            Long categoriaId
    ) {
        Categoria categoria = buscarCategoriaDoUsuario(categoriaId, usuarioId);

        if (Boolean.TRUE.equals(categoria.getPadrao())) {
            throw new RegraNegocioException(
                    "Categorias padrão não podem ser excluídas."
            );
        }

        boolean possuiTransacoes = transacaoRepository
                .existsByCategoria_IdAndUsuario_Id(categoriaId, usuarioId);

        if (possuiTransacoes) {
            throw new RegraNegocioException(
                    "Esta categoria possui transações vinculadas e não pode ser excluída."
            );
        }

        categoriaRepository.delete(categoria);
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

    private void validarCategoriaDuplicada(
            Long usuarioId,
            Long categoriaAtualId,
            String nome,
            TipoTransacao tipo
    ) {
        categoriaRepository
                .findByUsuario_IdAndNomeIgnoreCaseAndTipo(usuarioId, nome, tipo)
                .filter(categoria -> !categoria.getId().equals(categoriaAtualId))
                .ifPresent(categoria -> {
                    throw new RegraNegocioException(
                            "Já existe uma categoria com este nome e tipo."
                    );
                });
    }

    private CategoriaResponse converterParaResponse(
            Categoria categoria,
            Long usuarioId
    ) {
        long totalTransacoes = transacaoRepository
                .countByCategoria_IdAndUsuario_Id(categoria.getId(), usuarioId);

        boolean personalizada = !Boolean.TRUE.equals(categoria.getPadrao());
        boolean permiteExclusao = personalizada && totalTransacoes == 0;

        return new CategoriaResponse(
                categoria.getId(),
                categoria.getNome(),
                categoria.getTipo(),
                Boolean.TRUE.equals(categoria.getPadrao()),
                totalTransacoes,
                personalizada,
                permiteExclusao
        );
    }

    private String normalizarNome(String nome) {
        return nome.trim();
    }
}