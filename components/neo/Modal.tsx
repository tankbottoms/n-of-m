import React, { ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { NEO, SHADOW } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface NeoModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  fullScreen?: boolean;
}

export function NeoModal({ visible, onClose, title, children, fullScreen }: NeoModalProps) {
  const { highlight } = useTheme();

  if (fullScreen) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
      >
        <SafeAreaView style={styles.fullScreenContainer}>
          <View style={[styles.headerBar, { backgroundColor: highlight }]}>
            {title && <Text style={styles.headerTitle}>{title}</Text>}
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>CLOSE</Text>
            </Pressable>
          </View>
          <View style={styles.fullScreenBody}>{children}</View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, SHADOW]}>
          <View style={[styles.headerBar, { backgroundColor: highlight }]}>
            {title && <Text style={styles.headerTitle}>{title}</Text>}
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>CLOSE</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: NEO.bg,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    borderRadius: NEO.radius,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: NEO.borderWidth,
    borderBottomColor: NEO.border,
  },
  headerTitle: {
    fontFamily: NEO.fontUIBold,
    fontSize: 14,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: NEO.border,
    backgroundColor: NEO.bg,
  },
  closeBtnText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 11,
    color: NEO.text,
    letterSpacing: 0.5,
  },
  body: {
    maxHeight: 500,
  },
  bodyContent: {
    padding: 16,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: NEO.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  fullScreenBody: {
    flex: 1,
  },
});
