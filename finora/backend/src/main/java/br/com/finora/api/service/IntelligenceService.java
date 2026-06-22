package br.com.finora.api.service;

import br.com.finora.api.dto.CategoriaResponse;
import br.com.finora.api.dto.IntelligenceCategoriaDto;
import br.com.finora.api.dto.IntelligenceLoteResponse;
import br.com.finora.api.dto.IntelligenceSugestaoLoteItem;
import br.com.finora.api.dto.IntelligenceSugestaoRequest;
import br.com.finora.api.dto.IntelligenceSugestaoResponse;
import br.com.finora.api.enums.TipoTransacao;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class IntelligenceService {

    private static final Logger log = LoggerFactory.getLogger(IntelligenceService.class);

    private final CategoriaService categoriaService;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final boolean habilitado;

    public IntelligenceService(
            CategoriaService categoriaService,
            ObjectMapper objectMapper,
            @Value("${finora.intelligence.url:}") String intelligenceUrl
    ) {
        this.categoriaService = categoriaService;
        this.objectMapper = objectMapper;
        this.habilitado = intelligenceUrl != null && !intelligenceUrl.isBlank();

        if (this.habilitado) {
            this.restClient = RestClient.builder()
                    .baseUrl(intelligenceUrl)
                    .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .build();
            log.info("Finora Intelligence habilitado: {}", intelligenceUrl);
        } else {
            this.restClient = null;
            log.warn("Finora Intelligence desabilitado (FINORA_INTELLIGENCE_URL não configurado).");
        }
    }

    public IntelligenceSugestaoResponse sugerirCategoria(
            Long usuarioId,
            IntelligenceSugestaoRequest request
    ) {
        if (!habilitado) {
            return fallbackSugestao(request.descricao());
        }

        List<IntelligenceCategoriaDto> categorias = buscarCategoriasDoUsuario(usuarioId);

        try {
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("descricao", request.descricao());
            payload.put("tipo", request.tipo().name());
            ArrayNode cats = payload.putArray("categoriasDisponiveis");
            for (IntelligenceCategoriaDto c : categorias) {
                ObjectNode cat = cats.addObject();
                cat.put("id", c.id());
                cat.put("nome", c.nome());
                cat.put("tipo", c.tipo().name());
            }

            JsonNode resposta = restClient.post()
                    .uri("/sugerir-categoria")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(JsonNode.class);

            return extrairSugestao(resposta);
        } catch (RestClientException e) {
            log.warn("Intelligence indisponível ao sugerir categoria: {}", e.getMessage());
            return fallbackSugestao(request.descricao());
        }
    }

    public IntelligenceLoteResponse sugerirCategoriasLote(
            Long usuarioId,
            List<IntelligenceSugestaoRequest> transacoes
    ) {
        if (!habilitado) {
            return fallbackLote(transacoes);
        }

        List<IntelligenceCategoriaDto> categorias = buscarCategoriasDoUsuario(usuarioId);

        try {
            ObjectNode payload = objectMapper.createObjectNode();

            ArrayNode txs = payload.putArray("transacoes");
            for (IntelligenceSugestaoRequest t : transacoes) {
                ObjectNode tx = txs.addObject();
                tx.put("descricao", t.descricao());
                tx.put("tipo", t.tipo().name());
            }

            ArrayNode cats = payload.putArray("categoriasDisponiveis");
            for (IntelligenceCategoriaDto c : categorias) {
                ObjectNode cat = cats.addObject();
                cat.put("id", c.id());
                cat.put("nome", c.nome());
                cat.put("tipo", c.tipo().name());
            }

            JsonNode resposta = restClient.post()
                    .uri("/sugerir-categorias-lote")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(JsonNode.class);

            return extrairLote(resposta);
        } catch (RestClientException e) {
            log.warn("Intelligence indisponível ao sugerir lote: {}", e.getMessage());
            return fallbackLote(transacoes);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private List<IntelligenceCategoriaDto> buscarCategoriasDoUsuario(Long usuarioId) {
        return categoriaService.listar(usuarioId, null)
                .stream()
                .map(c -> new IntelligenceCategoriaDto(c.id(), c.nome(), c.tipo()))
                .toList();
    }

    private IntelligenceSugestaoResponse extrairSugestao(JsonNode node) {
        if (node == null) return fallbackSugestao(null);
        Long catId = node.hasNonNull("categoriaId") ? node.get("categoriaId").asLong() : null;
        String catNome = node.hasNonNull("categoriaNome") ? node.get("categoriaNome").asText() : null;
        double confianca = node.path("confianca").asDouble(0.0);
        String motivo = node.path("motivo").asText("Sem informação.");
        return new IntelligenceSugestaoResponse(catId, catNome, confianca, motivo);
    }

    private IntelligenceLoteResponse extrairLote(JsonNode node) {
        if (node == null || !node.has("sugestoes")) return fallbackLote(List.of());
        List<IntelligenceSugestaoLoteItem> itens = new ArrayList<>();
        for (JsonNode s : node.get("sugestoes")) {
            Long catId = s.hasNonNull("categoriaId") ? s.get("categoriaId").asLong() : null;
            String catNome = s.hasNonNull("categoriaNome") ? s.get("categoriaNome").asText() : null;
            itens.add(new IntelligenceSugestaoLoteItem(
                    s.path("descricao").asText(),
                    catId,
                    catNome,
                    s.path("confianca").asDouble(0.0),
                    s.path("motivo").asText("Sem informação.")
            ));
        }
        return new IntelligenceLoteResponse(itens);
    }

    private IntelligenceSugestaoResponse fallbackSugestao(String descricao) {
        return new IntelligenceSugestaoResponse(
                null, null, 0.0,
                "Serviço de inteligência indisponível no momento."
        );
    }

    private IntelligenceLoteResponse fallbackLote(List<IntelligenceSugestaoRequest> transacoes) {
        List<IntelligenceSugestaoLoteItem> itens = transacoes.stream()
                .map(t -> new IntelligenceSugestaoLoteItem(
                        t.descricao(), null, null, 0.0,
                        "Serviço de inteligência indisponível no momento."
                ))
                .toList();
        return new IntelligenceLoteResponse(itens);
    }
}
