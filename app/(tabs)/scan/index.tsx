import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NeoButton, NeoCard, NeoBadge } from '../../../components/neo';
import { ScanProgress } from '../../../components/ScanProgress';
import { NEO, SHADOW } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useScanner } from '../../../hooks/useScanner';
import { useScanFlow } from '../../../hooks/useScanFlow';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIEWFINDER_SIZE = SCREEN_WIDTH * 0.7;
const TEST_MODE = process.env.EXPO_PUBLIC_TEST_MODE === 'true';

export default function ScanScreen() {
  const { highlight } = useTheme();
  const scanner = useScanner();
  const { update } = useScanFlow();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const lastScannedRef = useRef<string>('');
  const cooldownRef = useRef(false);
  const navigatedRef = useRef(false);
  const [testInput, setTestInput] = useState('');

  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    // Prevent duplicate scans with cooldown
    if (cooldownRef.current) return;
    if (data === lastScannedRef.current) return;

    cooldownRef.current = true;
    lastScannedRef.current = data;

    scanner.onScan(data);

    // Reset cooldown after 1.5s to allow scanning next code
    setTimeout(() => {
      cooldownRef.current = false;
    }, 1500);
  }, [scanner]);

  // Navigate when state transitions (once only)
  useEffect(() => {
    if (navigatedRef.current) return;

    if (scanner.state === 'pin_required') {
      navigatedRef.current = true;
      update({ shares: scanner.scannedShares });
      router.push('/(tabs)/scan/pin');
    } else if (scanner.state === 'reconstructing') {
      navigatedRef.current = true;
      update({ shares: scanner.scannedShares });
      router.push('/(tabs)/scan/result');
    }
  }, [scanner.state, scanner.scannedShares, update]);

  const handleReset = useCallback(() => {
    scanner.reset();
    lastScannedRef.current = '';
    cooldownRef.current = false;
    navigatedRef.current = false;
    setScanning(false);
  }, [scanner]);

  const handleStartScanning = useCallback(() => {
    scanner.setState('scanning');
    setScanning(true);
  }, [scanner]);

  const handleTestScan = useCallback(() => {
    if (testInput.trim()) {
      handleBarCodeScanned({ data: testInput.trim() });
      setTestInput('');
    }
  }, [testInput, handleBarCodeScanned]);

  // Permission not yet determined (skip in test mode -- no camera needed)
  if (!TEST_MODE && !permission) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <NeoCard title="Camera">
            <Text style={styles.text}>Checking camera permission...</Text>
          </NeoCard>
        </View>
      </View>
    );
  }

  // Permission denied (skip in test mode)
  if (!TEST_MODE && !permission?.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <NeoCard title="Camera Access">
            <Text style={styles.text}>
              Camera access is required to scan QR codes containing Shamir shares.
              Your camera feed is processed locally and never leaves the device.
            </Text>
            <NeoButton
              title="Grant Camera Access"
              onPress={requestPermission}
              style={{ marginTop: 16 }}
            />
          </NeoCard>
        </View>
      </View>
    );
  }

  // Idle state - show start button
  if (!scanning && scanner.state === 'idle') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.heading}>Scan Shares</Text>
          <Text style={styles.subtitle}>
            Scan QR codes from your Shamir share cards to reconstruct your secret mnemonic.
          </Text>
          <NeoCard title="Instructions">
            <Text style={styles.text}>
              1. Gather enough share cards to meet the threshold{'\n'}
              2. Scan each QR code one at a time{'\n'}
              3. Enter your PIN or passphrase if required{'\n'}
              4. Your mnemonic will be reconstructed
            </Text>
          </NeoCard>
          <NeoButton
            title="Start Scanning"
            onPress={handleStartScanning}
            style={{ marginTop: 24 }}
          />
        </View>
      </View>
    );
  }

  // Active scanning state
  return (
    <View style={styles.container}>
      {/* Progress overlay at top */}
      {scanner.targetTotal > 0 && (
        <View style={[styles.progressOverlay, { backgroundColor: NEO.bg }]}>
          <ScanProgress
            scanned={scanner.scannedShares.length}
            threshold={scanner.targetThreshold}
            total={scanner.targetTotal}
          />
        </View>
      )}

      {/* Camera viewfinder / Test mode input */}
      {TEST_MODE ? (
        <View style={styles.testInputContainer}>
          <Text style={styles.testModeLabel}>TEST MODE</Text>
          <TextInput
            testID="test-scan-input"
            style={styles.testInput}
            value={testInput}
            onChangeText={setTestInput}
            placeholder="Paste SharePayload JSON here..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
          <NeoButton
            testID="test-scan-submit"
            title="Inject Scan"
            onPress={handleTestScan}
            style={{ marginTop: 12 }}
          />
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={handleBarCodeScanned}
          />
          {/* Viewfinder overlay - positioned above camera */}
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              <View style={[styles.viewfinder, { borderColor: highlight }]} />
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom} />
          </View>
        </View>
      )}

      {/* Error display */}
      {scanner.error && (
        <View style={styles.errorContainer}>
          <NeoBadge text={scanner.error} variant="outline" style={styles.errorBadge} />
        </View>
      )}

      {/* Scan status */}
      <View style={styles.bottomBar}>
        {scanner.scannedShares.length === 0 ? (
          <Text style={styles.instruction}>
            Point camera at a share QR code
          </Text>
        ) : (
          <Text style={styles.instruction}>
            Share #{scanner.scannedShares[scanner.scannedShares.length - 1].shareIndex} scanned
            {scanner.scannedShares.length < scanner.targetThreshold &&
              ` - need ${scanner.targetThreshold - scanner.scannedShares.length} more`}
          </Text>
        )}

        <NeoButton
          title="Reset"
          variant="secondary"
          size="sm"
          onPress={handleReset}
          style={{ marginTop: 12 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEO.bg },
  content: { padding: 16, paddingTop: 16 },
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
  text: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: NEO.text,
    lineHeight: 24,
  },
  progressOverlay: {
    borderBottomWidth: NEO.borderWidth,
    borderBottomColor: NEO.border,
    zIndex: 10,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: VIEWFINDER_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    borderWidth: 3,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 20,
  },
  errorBadge: {
    backgroundColor: '#FFF0F0',
    borderColor: '#CC0000',
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: NEO.borderWidth,
    borderTopColor: NEO.border,
    alignItems: 'center',
    backgroundColor: NEO.bg,
  },
  instruction: {
    fontFamily: NEO.fontUI,
    fontSize: 14,
    color: NEO.text,
    textAlign: 'center',
  },
  testInputContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  testModeLabel: {
    fontFamily: NEO.fontUIBold,
    fontSize: 12,
    color: '#CC6600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  testInput: {
    fontFamily: NEO.fontMono,
    fontSize: 13,
    color: NEO.text,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
  },
});
