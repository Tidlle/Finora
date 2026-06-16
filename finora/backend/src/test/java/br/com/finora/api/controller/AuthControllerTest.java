package br.com.finora.api.controller;

import br.com.finora.api.dto.CadastroResponse;
import br.com.finora.api.dto.LoginResponse;
import br.com.finora.api.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@TestPropertySource(properties = {
        "finora.jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "finora.jwt.issuer=finora-api",
        "finora.jwt.expiracao-segundos=3600"
})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @Test
    void cadastro_deveRetornar201_quandoBodyValido() throws Exception {
        CadastroResponse response = new CadastroResponse(1L, "Maria Silva", "maria@exemplo.com", 13, "Conta criada com sucesso.");
        when(authService.cadastrar(any())).thenReturn(response);

        String body = objectMapper.writeValueAsString(Map.of(
                "nome", "Maria Silva",
                "email", "maria@exemplo.com",
                "senha", "Senha@123"
        ));

        mockMvc.perform(post("/auth/cadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("maria@exemplo.com"))
                .andExpect(jsonPath("$.mensagem").value("Conta criada com sucesso."));
    }

    @Test
    void cadastro_deveRetornar400_quandoEmailInvalido() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "nome", "Maria Silva",
                "email", "email-invalido",
                "senha", "Senha@123"
        ));

        mockMvc.perform(post("/auth/cadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cadastro_deveRetornar400_quandoBodyVazio() throws Exception {
        mockMvc.perform(post("/auth/cadastro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_deveRetornar200_quandoCredenciaisValidas() throws Exception {
        LoginResponse response = new LoginResponse(1L, "Maria Silva", "maria@exemplo.com", "token.jwt", "Bearer", 3600L, "Login realizado com sucesso.");
        when(authService.login(any())).thenReturn(response);

        String body = objectMapper.writeValueAsString(Map.of(
                "email", "maria@exemplo.com",
                "senha", "Senha@123"
        ));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token.jwt"))
                .andExpect(jsonPath("$.tipoToken").value("Bearer"));
    }

    @Test
    void login_deveRetornar400_quandoSemBody() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
