import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../features/auth/AuthContext';
import { API_BASE_URL } from '../../config/api';
import colors from '../../theme/colors';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const wait = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds));
function labelFor(kind) {
  if (kind === 'product') return 'Product images';
  if (kind === 'banner') return 'Banner image';
  return 'Category image';
}
function connectionMessage(error) {
  if (error?.name === 'AbortError')
    return 'Image upload timed out. Please try again.';
  if (API_BASE_URL.includes('localhost'))
    return 'Cannot reach the local API. Keep the backend running and run: adb reverse tcp:5000 tcp:5000';
  return 'Unable to connect to the image server. Check your connection and try again.';
}

export default function ImageUploadField({
  kind,
  images,
  onChange,
  onBusyChange,
  disabled = false,
}) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const limit = kind === 'product' ? 8 : 1;
  const full = images.length >= limit;
  const upload = async assets => {
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120000);
      try {
        const form = new FormData();
        form.append('kind', kind);
        for (const asset of assets)
          form.append('images', {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `bigvora-${Date.now()}.jpg`,
          });
        const response = await fetch(`${API_BASE_URL}/admin/uploads`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
          signal: controller.signal,
        });
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('The image server returned an invalid response.');
        }
        if (!response.ok || !data.success)
          throw new Error(data.message || 'Image upload failed.');
        return data.data.images;
      } catch (e) {
        lastError = e;
        if (
          !(e instanceof TypeError) &&
          e?.message !== 'Network request failed' &&
          e?.name !== 'AbortError'
        )
          throw e;
        if (attempt === 0) await wait(600);
      } finally {
        clearTimeout(timer);
      }
    }
    throw new Error(connectionMessage(lastError));
  };
  const pick = async () => {
    if (busy || disabled || (full && kind === 'product')) return;
    setError('');
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit:
          kind === 'product' ? Math.max(1, limit - images.length) : 1,
        maxWidth: 2000,
        maxHeight: 2000,
        quality: 0.85,
      });
      if (result.didCancel) return;
      if (result.errorCode)
        throw new Error(
          result.errorMessage || 'Unable to open the photo library.',
        );
      if (!result.assets?.length) throw new Error('No image was selected.');
      const invalid = result.assets.find(
        asset =>
          !asset.uri ||
          !allowedTypes.includes(asset.type) ||
          Number(asset.fileSize || 0) > 5 * 1024 * 1024,
      );
      if (invalid)
        throw new Error('Choose JPEG, PNG or WebP images smaller than 5 MB.');
      if (!token)
        throw new Error(
          'Your admin session has expired. Please sign in again.',
        );
      setBusy(true);
      onBusyChange?.(true);
      const uploaded = await upload(result.assets);
      onChange(
        kind === 'product'
          ? [...images, ...uploaded].slice(0, limit)
          : uploaded,
      );
    } catch (e) {
      setError(
        e.message === 'Network request failed'
          ? connectionMessage(e)
          : e.message || 'Image upload failed. Please try again.',
      );
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };
  const remove = index => {
    if (!busy && !disabled)
      onChange(images.filter((_, itemIndex) => itemIndex !== index));
  };
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View>
          <Text style={styles.label}>{labelFor(kind)} *</Text>
          <Text style={styles.hint}>
            {kind === 'product'
              ? `${images.length}/${limit} selected`
              : 'One landscape image recommended'}
          </Text>
        </View>
        {kind === 'product' && images.length > 0 && (
          <Text style={styles.counter}>
            {images.length}/{limit}
          </Text>
        )}
      </View>
      {images.length > 0 && (
        <View style={styles.previews}>
          {images.map((uri, index) => (
            <View
              key={`${uri}-${index}`}
              style={[
                styles.previewCard,
                kind !== 'product' && styles.singlePreview,
              ]}
            >
              <Image
                source={{ uri }}
                resizeMode="cover"
                style={styles.preview}
              />
              <Pressable
                accessibilityLabel="Remove image"
                disabled={busy || disabled}
                onPress={() => remove(index)}
                style={styles.remove}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={colors.background}
                />
              </Pressable>
              {index === 0 && kind === 'product' && (
                <View style={styles.primary}>
                  <Text style={styles.primaryText}>PRIMARY</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={busy || disabled || (full && kind === 'product')}
        onPress={pick}
        style={[
          styles.selector,
          (busy || disabled || (full && kind === 'product')) &&
            styles.selectorDisabled,
        ]}
      >
        {busy ? (
          <>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.selectorTitle}>Uploading image...</Text>
            <Text style={styles.selectorText}>
              Please keep this screen open
            </Text>
          </>
        ) : (
          <>
            <View style={styles.selectorIcon}>
              <Ionicons
                name={
                  images.length && kind !== 'product'
                    ? 'swap-horizontal-outline'
                    : 'cloud-upload-outline'
                }
                size={25}
                color={colors.accent}
              />
            </View>
            <Text style={styles.selectorTitle}>
              {images.length && kind !== 'product'
                ? 'Choose replacement image'
                : images.length
                ? 'Add more images'
                : 'Choose from gallery'}
            </Text>
            <Text style={styles.selectorText}>
              JPEG, PNG or WebP ? Maximum 5 MB
            </Text>
          </>
        )}
      </Pressable>
      {Boolean(error) && (
        <View style={styles.error}>
          <Ionicons name="cloud-offline-outline" size={18} color="#C83E3E" />
          <View style={styles.errorCopy}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable disabled={busy} onPress={pick}>
              <Text style={styles.retry}>Choose image again</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { marginBottom: 18 },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  hint: { marginTop: 3, color: colors.textMuted, fontSize: 9 },
  counter: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: '#FFF0E8',
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
  },
  previews: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5 },
  previewCard: {
    width: 82,
    height: 82,
    overflow: 'hidden',
    marginRight: 9,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  singlePreview: { width: '100%', height: 150, marginRight: 0 },
  preview: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#061A3ACC',
  },
  primary: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  primaryText: { color: colors.background, fontSize: 7, fontWeight: '800' },
  selector: {
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    borderRadius: 16,
    backgroundColor: '#FFF9F5',
  },
  selectorDisabled: { opacity: 0.55 },
  selectorIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    borderRadius: 13,
    backgroundColor: '#FFF0E8',
  },
  selectorTitle: {
    marginTop: 6,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  selectorText: { marginTop: 4, color: colors.textMuted, fontSize: 9 },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
  },
  errorCopy: { flex: 1, marginLeft: 8 },
  errorText: { color: '#C83E3E', fontSize: 10, lineHeight: 15 },
  retry: {
    marginTop: 6,
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
  },
});
