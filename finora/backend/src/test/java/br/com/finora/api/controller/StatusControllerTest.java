package br.com.finora.api.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StatusController.class)
@TestPropertySource(properties = {
        "finora.jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "finora.jwt.issuer=finora-api",
        "finora.jwt.expiracao-segundos=3600"
})
class StatusControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void status_deveRetornar200_comJsonEsperado() throws Exception {
        mockMvc.perform(get("/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aplicacao").value("Finora API"))
                .andExpect(jsonPath("$.status").value("funcionando"));
    }
}
