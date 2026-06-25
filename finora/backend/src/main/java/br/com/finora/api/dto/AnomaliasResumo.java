package br.com.finora.api.dto;

public record AnomaliasResumo(
        int totalAnomalias,
        int anomaliasAltaSeveridade,
        String categoriaMaisCritica
) {}
