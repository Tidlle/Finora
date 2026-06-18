package br.com.finora.api.exception;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<Map<String, Object>> tratarRegraNegocio(
            RegraNegocioException exception
    ) {
        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("timestamp", OffsetDateTime.now());
        resposta.put("status", HttpStatus.BAD_REQUEST.value());
        resposta.put("erro", "Regra de negócio");
        resposta.put("mensagem", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(resposta);
    }

    @ExceptionHandler(CredenciaisInvalidasException.class)
    public ResponseEntity<Map<String, Object>> tratarCredenciaisInvalidas(
            CredenciaisInvalidasException exception
    ) {
        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("timestamp", OffsetDateTime.now());
        resposta.put("status", HttpStatus.UNAUTHORIZED.value());
        resposta.put("erro", "Não autorizado");
        resposta.put("mensagem", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(resposta);
    }

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<Map<String, Object>> tratarRecursoNaoEncontrado(
            RecursoNaoEncontradoException exception
    ) {
        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("timestamp", OffsetDateTime.now());
        resposta.put("status", HttpStatus.NOT_FOUND.value());
        resposta.put("erro", "Recurso não encontrado");
        resposta.put("mensagem", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(resposta);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, Object>> tratarErroBancoDados(
            DataAccessException exception
    ) {
        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("timestamp", OffsetDateTime.now());
        resposta.put("status", HttpStatus.SERVICE_UNAVAILABLE.value());
        resposta.put("erro", "Erro de banco de dados");
        resposta.put("mensagem", "Não foi possível processar a operação. Tente novamente.");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(resposta);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> tratarErroGenerico(
            Exception exception
    ) {
        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("timestamp", OffsetDateTime.now());
        resposta.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        resposta.put("erro", "Erro interno");
        resposta.put("mensagem", "Ocorreu um erro inesperado. Tente novamente.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resposta);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> tratarValidacao(
            MethodArgumentNotValidException exception
    ) {
        Map<String, String> campos = new LinkedHashMap<>();

        for (FieldError erro : exception.getBindingResult().getFieldErrors()) {
            campos.put(erro.getField(), erro.getDefaultMessage());
        }

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("timestamp", OffsetDateTime.now());
        resposta.put("status", HttpStatus.BAD_REQUEST.value());
        resposta.put("erro", "Dados inválidos");
        resposta.put("campos", campos);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(resposta);
    }
}