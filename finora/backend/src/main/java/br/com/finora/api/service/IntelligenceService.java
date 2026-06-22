package br.com.finora.api.service;

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

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class IntelligenceService {

    private static final Logger log = LoggerFactory.getLogger(IntelligenceService.class);

    // ── Dicionário local: palavra-chave normalizada → nome semântico normalizado
    private static final Map<String, String> PALAVRAS_CHAVE = new LinkedHashMap<>();

    static {
        // Transporte
        PALAVRAS_CHAVE.put("uber", "transporte");
        PALAVRAS_CHAVE.put("99pop", "transporte");
        PALAVRAS_CHAVE.put("99app", "transporte");
        PALAVRAS_CHAVE.put("taxi", "transporte");
        PALAVRAS_CHAVE.put("cabify", "transporte");
        PALAVRAS_CHAVE.put("gasolina", "transporte");
        PALAVRAS_CHAVE.put("combustivel", "transporte");
        PALAVRAS_CHAVE.put("etanol", "transporte");
        PALAVRAS_CHAVE.put("posto", "transporte");
        PALAVRAS_CHAVE.put("shell", "transporte");
        PALAVRAS_CHAVE.put("ipiranga", "transporte");
        PALAVRAS_CHAVE.put("metro", "transporte");
        PALAVRAS_CHAVE.put("onibus", "transporte");
        PALAVRAS_CHAVE.put("estacionamento", "transporte");
        PALAVRAS_CHAVE.put("pedagio", "transporte");
        PALAVRAS_CHAVE.put("passagem", "transporte");
        PALAVRAS_CHAVE.put("brt", "transporte");
        // Alimentação
        PALAVRAS_CHAVE.put("mercado", "alimentacao");
        PALAVRAS_CHAVE.put("supermercado", "alimentacao");
        PALAVRAS_CHAVE.put("carrefour", "alimentacao");
        PALAVRAS_CHAVE.put("assai", "alimentacao");
        PALAVRAS_CHAVE.put("atacadao", "alimentacao");
        PALAVRAS_CHAVE.put("hortifruti", "alimentacao");
        PALAVRAS_CHAVE.put("padaria", "alimentacao");
        PALAVRAS_CHAVE.put("restaurante", "alimentacao");
        PALAVRAS_CHAVE.put("ifood", "alimentacao");
        PALAVRAS_CHAVE.put("rappi", "alimentacao");
        PALAVRAS_CHAVE.put("acougue", "alimentacao");
        PALAVRAS_CHAVE.put("lanche", "alimentacao");
        PALAVRAS_CHAVE.put("pizza", "alimentacao");
        PALAVRAS_CHAVE.put("hamburger", "alimentacao");
        PALAVRAS_CHAVE.put("burger", "alimentacao");
        PALAVRAS_CHAVE.put("cafe", "alimentacao");
        PALAVRAS_CHAVE.put("mcdonalds", "alimentacao");
        PALAVRAS_CHAVE.put("subway", "alimentacao");
        PALAVRAS_CHAVE.put("feira", "alimentacao");
        PALAVRAS_CHAVE.put("mercearia", "alimentacao");
        PALAVRAS_CHAVE.put("comida", "alimentacao");
        PALAVRAS_CHAVE.put("extra", "alimentacao");
        // Saúde
        PALAVRAS_CHAVE.put("farmacia", "saude");
        PALAVRAS_CHAVE.put("drogaria", "saude");
        PALAVRAS_CHAVE.put("drogasil", "saude");
        PALAVRAS_CHAVE.put("ultrafarma", "saude");
        PALAVRAS_CHAVE.put("hospital", "saude");
        PALAVRAS_CHAVE.put("consulta", "saude");
        PALAVRAS_CHAVE.put("exame", "saude");
        PALAVRAS_CHAVE.put("medicamento", "saude");
        PALAVRAS_CHAVE.put("remedio", "saude");
        PALAVRAS_CHAVE.put("clinica", "saude");
        PALAVRAS_CHAVE.put("dental", "saude");
        PALAVRAS_CHAVE.put("dentista", "saude");
        PALAVRAS_CHAVE.put("laboratorio", "saude");
        PALAVRAS_CHAVE.put("unimed", "saude");
        PALAVRAS_CHAVE.put("amil", "saude");
        // Lazer
        PALAVRAS_CHAVE.put("cinema", "lazer");
        PALAVRAS_CHAVE.put("ingresso", "lazer");
        PALAVRAS_CHAVE.put("festa", "lazer");
        PALAVRAS_CHAVE.put("teatro", "lazer");
        PALAVRAS_CHAVE.put("clube", "lazer");
        PALAVRAS_CHAVE.put("parque", "lazer");
        PALAVRAS_CHAVE.put("viagem", "lazer");
        PALAVRAS_CHAVE.put("hotel", "lazer");
        PALAVRAS_CHAVE.put("airbnb", "lazer");
        // Assinaturas (verificadas antes de Lazer para netflix/spotify não caírem em Lazer)
        PALAVRAS_CHAVE.put("netflix", "assinaturas");
        PALAVRAS_CHAVE.put("spotify", "assinaturas");
        PALAVRAS_CHAVE.put("disney", "assinaturas");
        PALAVRAS_CHAVE.put("hbomax", "assinaturas");
        PALAVRAS_CHAVE.put("globoplay", "assinaturas");
        PALAVRAS_CHAVE.put("icloud", "assinaturas");
        PALAVRAS_CHAVE.put("assinatura", "assinaturas");
        // Moradia
        PALAVRAS_CHAVE.put("aluguel", "moradia");
        PALAVRAS_CHAVE.put("condominio", "moradia");
        PALAVRAS_CHAVE.put("energia", "moradia");
        PALAVRAS_CHAVE.put("enel", "moradia");
        PALAVRAS_CHAVE.put("cemig", "moradia");
        PALAVRAS_CHAVE.put("copel", "moradia");
        PALAVRAS_CHAVE.put("sabesp", "moradia");
        PALAVRAS_CHAVE.put("internet", "moradia");
        PALAVRAS_CHAVE.put("claro", "moradia");
        PALAVRAS_CHAVE.put("vivo", "moradia");
        PALAVRAS_CHAVE.put("comgas", "moradia");
        PALAVRAS_CHAVE.put("iptu", "moradia");
        PALAVRAS_CHAVE.put("manutencao", "moradia");
        // Educação
        PALAVRAS_CHAVE.put("faculdade", "educacao");
        PALAVRAS_CHAVE.put("fiap", "educacao");
        PALAVRAS_CHAVE.put("curso", "educacao");
        PALAVRAS_CHAVE.put("escola", "educacao");
        PALAVRAS_CHAVE.put("livro", "educacao");
        PALAVRAS_CHAVE.put("mensalidade", "educacao");
        PALAVRAS_CHAVE.put("colegio", "educacao");
        PALAVRAS_CHAVE.put("universidade", "educacao");
        PALAVRAS_CHAVE.put("udemy", "educacao");
        PALAVRAS_CHAVE.put("coursera", "educacao");
        // Salário
        PALAVRAS_CHAVE.put("salario", "salario");
        PALAVRAS_CHAVE.put("remuneracao", "salario");
        PALAVRAS_CHAVE.put("pagamento", "salario");
        // Receitas
        PALAVRAS_CHAVE.put("pix recebido", "receitas");
        PALAVRAS_CHAVE.put("reembolso", "receitas");
        PALAVRAS_CHAVE.put("rendimento", "receitas");
        PALAVRAS_CHAVE.put("dividendo", "receitas");
        PALAVRAS_CHAVE.put("freelance", "receitas");
        PALAVRAS_CHAVE.put("freela", "receitas");
        PALAVRAS_CHAVE.put("bonus", "receitas");
        PALAVRAS_CHAVE.put("renda", "receitas");
        // Outros / genérico (deve ficar por último para não sobrepor categorias específicas)
        PALAVRAS_CHAVE.put("compra", "outros");
    }

    // Aliases: nomes alternativos que o usuário pode ter dado à categoria
    private static final Map<String, List<String>> ALIASES_SEMANTICOS = new LinkedHashMap<>();

    static {
        ALIASES_SEMANTICOS.put("receitas",    List.of("receita", "entradas", "entrada", "renda", "ganhos", "ganho", "rendimentos"));
        ALIASES_SEMANTICOS.put("salario",     List.of("salarios", "vencimento", "vencimentos", "remuneracao", "renda"));
        ALIASES_SEMANTICOS.put("alimentacao", List.of("refeicao", "refeicoes", "comida", "gastronomia", "nutricao"));
        ALIASES_SEMANTICOS.put("transporte",  List.of("mobilidade", "locomocao", "veiculos", "veiculo"));
        ALIASES_SEMANTICOS.put("moradia",     List.of("habitacao", "residencia", "casa", "contas", "domicilio"));
        ALIASES_SEMANTICOS.put("saude",       List.of("medico", "medica", "bem estar", "bem-estar", "saude e bem estar"));
        ALIASES_SEMANTICOS.put("lazer",       List.of("entretenimento", "diversao", "hobby", "hobbies", "recreacao"));
        ALIASES_SEMANTICOS.put("educacao",    List.of("ensino", "formacao", "aprendizado", "estudos", "conhecimento"));
        ALIASES_SEMANTICOS.put("assinaturas", List.of("assinatura", "streaming", "subscricao", "servicos digitais"));
        ALIASES_SEMANTICOS.put("outros",      List.of("outro", "geral", "gerais", "diversas", "diversos", "despesas", "compras", "outras", "miscelanea"));
    }

    private final CategoriaService categoriaService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final boolean pythonHabilitado;
    private final RestClient restClient;

    public IntelligenceService(
            CategoriaService categoriaService,
            @Value("${finora.intelligence.url:}") String intelligenceUrl
    ) {
        this.categoriaService = categoriaService;
        this.pythonHabilitado = intelligenceUrl != null && !intelligenceUrl.isBlank();

        if (this.pythonHabilitado) {
            this.restClient = RestClient.builder()
                    .baseUrl(intelligenceUrl)
                    .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .build();
            log.info("Finora Intelligence (Python) habilitado: {}", intelligenceUrl);
        } else {
            this.restClient = null;
            log.info("Finora Intelligence rodando com classificador local (FINORA_INTELLIGENCE_URL não configurado).");
        }
    }

    public IntelligenceSugestaoResponse sugerirCategoria(
            Long usuarioId,
            IntelligenceSugestaoRequest request
    ) {
        List<IntelligenceCategoriaDto> categorias = buscarCategoriasDoUsuario(usuarioId);

        if (pythonHabilitado) {
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
                log.warn("Python indisponível, usando classificador local: {}", e.getMessage());
            }
        }

        // Classificador local como primário (sem Python) ou fallback (Python offline)
        IntelligenceSugestaoLoteItem item = categorizarLocal(
                request.descricao(), request.tipo(), categorias
        );
        return new IntelligenceSugestaoResponse(
                item.categoriaId(), item.categoriaNome(), item.confianca(), item.motivo()
        );
    }

    public IntelligenceLoteResponse sugerirCategoriasLote(
            Long usuarioId,
            List<IntelligenceSugestaoRequest> transacoes
    ) {
        List<IntelligenceCategoriaDto> categorias = buscarCategoriasDoUsuario(usuarioId);

        if (pythonHabilitado) {
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
                log.warn("Python indisponível, usando classificador local: {}", e.getMessage());
            }
        }

        // Classificador local
        return categorizarLocalLote(transacoes, categorias);
    }

    // ── Classificador local por palavras-chave ────────────────────────────────

    private IntelligenceLoteResponse categorizarLocalLote(
            List<IntelligenceSugestaoRequest> transacoes,
            List<IntelligenceCategoriaDto> categorias
    ) {
        List<IntelligenceSugestaoLoteItem> itens = transacoes.stream()
                .map(t -> categorizarLocal(t.descricao(), t.tipo(), categorias))
                .toList();
        return new IntelligenceLoteResponse(itens);
    }

    private IntelligenceSugestaoLoteItem categorizarLocal(
            String descricao,
            TipoTransacao tipo,
            List<IntelligenceCategoriaDto> todasCategorias
    ) {
        String descNorm = normalizar(descricao);

        List<IntelligenceCategoriaDto> doTipo = todasCategorias.stream()
                .filter(c -> c.tipo() == tipo)
                .toList();

        if (doTipo.isEmpty()) {
            return semSugestao(descricao);
        }

        // Busca primeira palavra-chave presente na descrição
        String categoriaSemNorm = null;
        String palavraEncontrada = null;

        for (Map.Entry<String, String> entry : PALAVRAS_CHAVE.entrySet()) {
            if (descNorm.contains(entry.getKey())) {
                categoriaSemNorm = entry.getValue();
                palavraEncontrada = entry.getKey();
                break;
            }
        }

        if (categoriaSemNorm == null) {
            return semSugestao(descricao);
        }

        // Busca categoria do usuário com nome mais próximo (exata → parcial)
        final String catAlvo = categoriaSemNorm;
        IntelligenceCategoriaDto melhor = null;

        for (IntelligenceCategoriaDto c : doTipo) {
            if (normalizar(c.nome()).equals(catAlvo)) {
                melhor = c;
                break;
            }
        }

        if (melhor == null) {
            for (IntelligenceCategoriaDto c : doTipo) {
                String nomeNorm = normalizar(c.nome());
                if (nomeNorm.contains(catAlvo) || catAlvo.contains(nomeNorm)) {
                    melhor = c;
                    break;
                }
            }
        }

        // Tenta aliases semânticos (ex: "receitas" → "entradas", "renda", etc.)
        if (melhor == null) {
            List<String> aliases = ALIASES_SEMANTICOS.getOrDefault(catAlvo, List.of());
            outer:
            for (String alias : aliases) {
                for (IntelligenceCategoriaDto c : doTipo) {
                    String nomeNorm = normalizar(c.nome());
                    if (nomeNorm.equals(alias) || nomeNorm.contains(alias) || alias.contains(nomeNorm)) {
                        melhor = c;
                        break outer;
                    }
                }
            }
        }

        if (melhor == null) {
            return semSugestao(descricao);
        }

        return new IntelligenceSugestaoLoteItem(
                descricao,
                melhor.id(),
                melhor.nome(),
                0.9,
                "Encontrado \"" + palavraEncontrada + "\" → " + melhor.nome() + "."
        );
    }

    private static String normalizar(String texto) {
        if (texto == null) return "";
        String semAcento = Normalizer.normalize(texto, Normalizer.Form.NFD);
        semAcento = semAcento.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return semAcento.toLowerCase();
    }

    private static IntelligenceSugestaoLoteItem semSugestao(String descricao) {
        return new IntelligenceSugestaoLoteItem(
                descricao, null, null, 0.0,
                "Nenhuma palavra-chave reconhecida na descrição."
        );
    }

    // ── Parsers da resposta Python ────────────────────────────────────────────

    private IntelligenceSugestaoResponse extrairSugestao(JsonNode node) {
        if (node == null) return new IntelligenceSugestaoResponse(null, null, 0.0, "Resposta vazia.");
        Long catId = node.hasNonNull("categoriaId") ? node.get("categoriaId").asLong() : null;
        String catNome = node.hasNonNull("categoriaNome") ? node.get("categoriaNome").asText() : null;
        double confianca = node.path("confianca").asDouble(0.0);
        String motivo = node.path("motivo").asText("Sem informação.");
        return new IntelligenceSugestaoResponse(catId, catNome, confianca, motivo);
    }

    private IntelligenceLoteResponse extrairLote(JsonNode node) {
        if (node == null || !node.has("sugestoes")) return categorizarLocalLote(List.of(), List.of());
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

    // ── Repositório de categorias ─────────────────────────────────────────────

    private List<IntelligenceCategoriaDto> buscarCategoriasDoUsuario(Long usuarioId) {
        return categoriaService.listar(usuarioId, null)
                .stream()
                .map(c -> new IntelligenceCategoriaDto(c.id(), c.nome(), c.tipo()))
                .toList();
    }
}
