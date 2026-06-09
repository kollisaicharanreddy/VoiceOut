package com.voiceout.service;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.Arrays;

@Converter
public class DoubleArrayConverter implements AttributeConverter<double[], String> {

    @Override
    public String convertToDatabaseColumn(double[] attribute) {
        if (attribute == null || attribute.length == 0) {
            return null;
        }
        return Arrays.stream(attribute)
                .mapToObj(Double::toString)
                .reduce((left, right) -> left + "," + right)
                .orElse(null);
    }

    @Override
    public double[] convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return new double[0];
        }
        String[] parts = dbData.split(",");
        double[] values = new double[parts.length];
        for (int index = 0; index < parts.length; index++) {
            values[index] = Double.parseDouble(parts[index]);
        }
        return values;
    }
}