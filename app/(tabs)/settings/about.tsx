import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { NeoCard, NeoButton, NeoBadge } from '../../../components/neo';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';

export default function AboutScreen() {
  const { highlight } = useTheme();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.brandName}>n of m</Text>
        <Text style={styles.appName}>SHAMIR</Text>
        <Text style={styles.tagline}>Ethereum Seed Phrase Manager</Text>
        <NeoBadge text="v1.0.0" variant="highlight" />
      </View>

      <NeoCard title="About" style={styles.section}>
        <Text style={styles.bodyText}>
          SHAMIR is a secure, offline tool for generating BIP39 seed phrases
          and splitting them into Shamir secret shares. Export shares as
          printable QR code cards and reconstruct your seed phrase by scanning
          the required threshold of shares.
        </Text>
      </NeoCard>

      <NeoCard title="How It Works" style={styles.section}>
        <View style={styles.step}>
          <Text style={styles.stepNum}>1</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Generate</Text>
            <Text style={styles.stepDesc}>
              Create a BIP39 mnemonic seed phrase with configurable word count
              (12-24 words) and derive Ethereum addresses.
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepNum}>2</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Split</Text>
            <Text style={styles.stepDesc}>
              Split the seed phrase into N shares using Shamir's Secret Sharing.
              Choose the threshold M -- any M shares can reconstruct the original.
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepNum}>3</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Export</Text>
            <Text style={styles.stepDesc}>
              Generate a PDF with QR code cards for each share. Print and
              distribute shares to different secure locations.
            </Text>
          </View>
        </View>

        <View style={[styles.step, styles.stepLast]}>
          <Text style={styles.stepNum}>4</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Reconstruct</Text>
            <Text style={styles.stepDesc}>
              Scan the threshold number of share QR codes to reconstruct the
              original seed phrase and recover your wallet.
            </Text>
          </View>
        </View>
      </NeoCard>

      <NeoCard title="Security" style={styles.section}>
        <View style={styles.securityItem}>
          <Text style={styles.securityBullet}>*</Text>
          <Text style={styles.securityText}>
            Fully offline -- no network requests, no telemetry, no analytics.
          </Text>
        </View>
        <View style={styles.securityItem}>
          <Text style={styles.securityBullet}>*</Text>
          <Text style={styles.securityText}>
            Vault data is encrypted at rest using AES-256 with a device-bound
            master key stored in the secure enclave.
          </Text>
        </View>
        <View style={styles.securityItem}>
          <Text style={styles.securityBullet}>*</Text>
          <Text style={styles.securityText}>
            Optional PIN protection adds a second factor for accessing stored
            secrets.
          </Text>
        </View>
        <View style={styles.securityItem}>
          <Text style={styles.securityBullet}>*</Text>
          <Text style={styles.securityText}>
            Shamir's Secret Sharing uses GF(256) polynomial interpolation --
            mathematically proven information-theoretic security.
          </Text>
        </View>
        <View style={styles.securityItem}>
          <Text style={styles.securityBullet}>*</Text>
          <Text style={styles.securityText}>
            No third-party servers. Your secrets never leave your device except
            as printed QR codes.
          </Text>
        </View>
      </NeoCard>

      <NeoButton
        title="How It Works"
        variant="secondary"
        onPress={() => router.push('/how-it-works')}
        style={{ marginTop: 8 }}
      />
      <NeoButton
        title="The Mathematics"
        variant="secondary"
        onPress={() => router.push('/how-it-works-math')}
        style={{ marginTop: 8 }}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Built with Expo, React Native, and ethers.js
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEO.bg },
  content: { padding: 16, paddingBottom: 60 },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  brandName: {
    fontFamily: NEO.fontUI,
    fontSize: 16,
    color: '#999',
    letterSpacing: 2,
    marginBottom: 2,
  },
  appName: {
    fontFamily: NEO.fontUIBold,
    fontSize: 42,
    color: NEO.text,
    letterSpacing: 6,
    marginBottom: 4,
  },
  tagline: {
    fontFamily: NEO.fontUI,
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  bodyText: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: NEO.text,
    lineHeight: 24,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  stepLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  stepNum: {
    fontFamily: NEO.fontUIBold,
    fontSize: 24,
    color: '#CCC',
    width: 28,
    textAlign: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: NEO.fontUIBold,
    fontSize: 16,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  stepDesc: {
    fontFamily: NEO.fontUI,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  securityItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  securityBullet: {
    fontFamily: NEO.fontUIBold,
    fontSize: 14,
    color: '#999',
    width: 12,
  },
  securityText: {
    fontFamily: NEO.fontUI,
    fontSize: 14,
    color: NEO.text,
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  footerText: {
    fontFamily: NEO.fontUI,
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
