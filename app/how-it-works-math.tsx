import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';
import { NeoCard, NeoButton } from '../components/neo';
import { NEO } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export default function HowItWorksMathScreen() {
  const { highlight } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'THE MATH' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>The Mathematics</Text>
        <Text style={styles.subtitle}>
          How Shamir's Secret Sharing works under the hood.
        </Text>

        <NeoCard title="Polynomial Secret Sharing" style={styles.section}>
          <Text style={styles.text}>
            The core insight: a polynomial of degree (M-1) is uniquely determined
            by any M points on it, but M-1 or fewer points leave it completely
            undetermined.
          </Text>
        </NeoCard>

        <NeoCard title="Step 1: Construct Polynomial" style={styles.section}>
          <Text style={styles.text}>
            Given a secret S and threshold M, construct a random polynomial:{'\n\n'}
          </Text>
          <Text style={styles.math}>
            f(x) = S + a1*x + a2*x^2 + ... + a(M-1)*x^(M-1)
          </Text>
          <Text style={[styles.text, { marginTop: 12 }]}>
            Where S is the secret (constant term) and a1...a(M-1) are random
            coefficients. The polynomial has degree M-1.
          </Text>
        </NeoCard>

        <NeoCard title="Step 2: Generate Shares" style={styles.section}>
          <Text style={styles.text}>
            Each share is a point (i, f(i)) evaluated at x = 1, 2, ..., N:{'\n\n'}
          </Text>
          <Text style={styles.math}>
            Share 1 = (1, f(1)){'\n'}
            Share 2 = (2, f(2)){'\n'}
            Share 3 = (3, f(3)){'\n'}
            ...{'\n'}
            Share N = (N, f(N))
          </Text>
        </NeoCard>

        <NeoCard title="Step 3: Reconstruct via Lagrange Interpolation" style={styles.section}>
          <Text style={styles.text}>
            Given M points, use Lagrange interpolation to find f(0) = S:{'\n\n'}
          </Text>
          <Text style={styles.math}>
            S = f(0) = sum_i [ y_i * product_j ( -x_j / (x_i - x_j) ) ]
          </Text>
          <Text style={[styles.text, { marginTop: 12 }]}>
            This is computed over a finite field (GF(256) in this implementation)
            to keep shares the same size as the secret.
          </Text>
        </NeoCard>

        <NeoCard title="Finite Field Arithmetic (GF(256))" style={styles.section}>
          <Text style={styles.text}>
            All arithmetic operates in GF(2^8) using the irreducible polynomial
            x^8 + x^4 + x^3 + x + 1 (0x11B):{'\n\n'}
            {'\u2022'} Addition = XOR{'\n'}
            {'\u2022'} Multiplication via log/exp tables{'\n'}
            {'\u2022'} Each byte of the secret is split independently{'\n'}
            {'\u2022'} Shares are exactly the same length as the secret
          </Text>
        </NeoCard>

        <NeoCard title="Security Proof" style={styles.section}>
          <Text style={styles.text}>
            With fewer than M shares, every possible secret value is equally
            consistent with the known shares. This is information-theoretic
            security -- no amount of computation can narrow down the secret.
            Even a quantum computer cannot break this scheme.
          </Text>
        </NeoCard>

        <NeoCard title="Example: 2 of 3" style={styles.section}>
          <Text style={styles.text}>
            Secret S = 42, random coefficient a1 = 7:{'\n\n'}
          </Text>
          <Text style={styles.math}>
            f(x) = 42 + 7x{'\n\n'}
            Share 1: f(1) = 49{'\n'}
            Share 2: f(2) = 56{'\n'}
            Share 3: f(3) = 63
          </Text>
          <Text style={[styles.text, { marginTop: 12 }]}>
            Any 2 shares define the line uniquely. Any single share is consistent
            with every possible secret value (infinitely many lines pass through
            one point).
          </Text>
        </NeoCard>

        <NeoButton
          title="Back"
          variant="secondary"
          onPress={() => router.back()}
          style={{ marginTop: 16, marginBottom: 20 }}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEO.bg },
  content: { padding: 16, paddingBottom: 40 },
  heading: {
    fontFamily: NEO.fontUIBold,
    fontSize: 24,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  section: { marginBottom: 16 },
  text: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: NEO.text,
    lineHeight: 24,
  },
  math: {
    fontFamily: NEO.fontMono,
    fontSize: 14,
    color: NEO.text,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: NEO.border,
    padding: 12,
    lineHeight: 22,
  },
});
