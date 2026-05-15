// src/components/CepResult.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CepResult({ cep }) {
  if (!cep || cep.erro || !cep.logradouro) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>📍 Endereço encontrado</Text>
      <View style={styles.grid}>
        <Item label="Rua"    valor={cep.logradouro} />
        <Item label="Bairro" valor={cep.bairro} />
        <Item label="Cidade" valor={cep.localidade || cep.cidade} />
        <Item label="Estado" valor={cep.estado} small />
      </View>
    </View>
  );
}

function Item({ label, valor, small }) {
  if (!valor) return null;
  return (
    <View style={[styles.item, small && { flex: 0.4 }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f9f4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#c3e6d0',
  },
  titulo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#27ae60',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: { flex: 1, minWidth: '45%' },
  label: { fontSize: 10, fontWeight: '700', color: '#7fb99a', textTransform: 'uppercase', letterSpacing: 0.4 },
  valor: { fontSize: 13, color: '#1a3a28', fontWeight: '500', marginTop: 1 },
});
