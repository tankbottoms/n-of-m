import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router, Stack } from 'expo-router';
import { NeoCard, NeoButton } from '../components/neo';
import { NEO } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import QRCode from 'react-native-qrcode-svg';

export default function HowItWorksScreen() {
  const { highlight } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'HOW IT WORKS' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>How It Works</Text>
        <Text style={styles.subtitle}>
          A complete guide to Shamir's Secret Sharing for cryptocurrency wallets.
        </Text>

        {/* Step 1 */}
        <NeoCard title="1. Generate a Seed Phrase" style={styles.section}>
          <Text style={styles.text}>
            Your wallet starts with a BIP39 seed phrase -- 12 to 24 random words
            that encode the master key for all your Ethereum addresses. This app
            generates these words using cryptographic randomness.
          </Text>
        </NeoCard>

        {/* Step 2 */}
        <NeoCard title="2. Split Into Shares" style={styles.section}>
          <Text style={styles.text}>
            Instead of storing your seed phrase in one place (a single point of failure),
            Shamir's Secret Sharing splits it into N separate shares. Each share alone
            reveals nothing about your seed phrase.
          </Text>
          <View style={styles.qrRow}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.qrExample}>
                <QRCode
                  value={`SHARE_${i}_OF_3_EXAMPLE`}
                  size={80}
                  backgroundColor="white"
                  color="black"
                />
                <Text style={styles.qrLabel}>Share {i}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.text, { marginTop: 12 }]}>
            Each share is encoded as a QR code and printed on a card for physical storage.
          </Text>
        </NeoCard>

        {/* Step 3 */}
        <NeoCard title="3. Set a Threshold" style={styles.section}>
          <Text style={styles.text}>
            You choose M (threshold) and N (total shares). Any M of N shares can
            reconstruct the original seed phrase. For example:
          </Text>
          <View style={styles.exampleBox}>
            <View style={styles.exampleRow}>
              <View style={[styles.numberBox, { backgroundColor: highlight }]}>
                <Text style={styles.numberText}>2</Text>
              </View>
              <Text style={styles.text}> of </Text>
              <View style={[styles.numberBox, { backgroundColor: highlight }]}>
                <Text style={styles.numberText}>3</Text>
              </View>
              <Text style={[styles.text, { marginLeft: 12 }]}>-- Lose one, still recover</Text>
            </View>
            <View style={[styles.exampleRow, { marginTop: 8 }]}>
              <View style={[styles.numberBox, { backgroundColor: highlight }]}>
                <Text style={styles.numberText}>3</Text>
              </View>
              <Text style={styles.text}> of </Text>
              <View style={[styles.numberBox, { backgroundColor: highlight }]}>
                <Text style={styles.numberText}>5</Text>
              </View>
              <Text style={[styles.text, { marginLeft: 12 }]}>-- Lose two, still recover</Text>
            </View>
          </View>
        </NeoCard>

        {/* Step 4 */}
        <NeoCard title="4. Distribute and Store" style={styles.section}>
          <Text style={styles.text}>
            Print the QR code cards and store them in separate secure locations:
            a home safe, bank safety deposit box, trusted family member, etc.
            Geographic distribution protects against local disasters.
          </Text>
        </NeoCard>

        {/* Step 5 */}
        <NeoCard title="5. Recover When Needed" style={styles.section}>
          <Text style={styles.text}>
            To recover your wallet, gather enough share cards to meet the threshold.
            Scan each QR code with this app and it reconstructs your original seed
            phrase using polynomial interpolation.
          </Text>
        </NeoCard>

        {/* Security properties */}
        <NeoCard title="Security Properties" style={styles.section}>
          <Text style={styles.text}>
            {'\u2022'} Any M-1 or fewer shares reveal ZERO information about the secret{'\n'}
            {'\u2022'} Shares are mathematically independent of each other{'\n'}
            {'\u2022'} No trusted dealer needed after initial split{'\n'}
            {'\u2022'} Information-theoretically secure (not just computationally)
          </Text>
        </NeoCard>

        <NeoButton
          title="The Mathematics"
          variant="secondary"
          onPress={() => router.push('/how-it-works-math')}
          style={{ marginTop: 16 }}
        />

        <NeoButton
          title="Back to Home"
          variant="secondary"
          onPress={() => router.back()}
          style={{ marginTop: 12, marginBottom: 20 }}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEO.bg },
  content: { padding: 16, paddingTop: 56, paddingBottom: 40 },
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
  qrRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: NEO.border,
    backgroundColor: '#FAFAFA',
  },
  qrExample: {
    alignItems: 'center',
  },
  qrLabel: {
    fontFamily: NEO.fontMono,
    fontSize: 11,
    color: '#666',
    marginTop: 6,
  },
  exampleBox: {
    marginTop: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: NEO.border,
    backgroundColor: '#FAFAFA',
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberBox: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
  },
  numberText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 20,
    color: NEO.text,
  },
});
