import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImageUploadField from '../../../components/admin/ImageUploadField';
import { useAdminData } from '../../../features/admin/AdminDataContext';
import colors from '../../../theme/colors';

export default function AdminBannersScreen({ navigation }) {
  const {
    banners,
    bannersLoading,
    bannersError,
    refreshBanners,
    addBanner,
    updateBanner,
    deleteBanner,
  } = useAdminData();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [images, setImages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const reset = () => {
    setName('');
    setImages([]);
    setEditing(null);
    setError('');
  };
  const closeModal = () => {
    if (saving || uploading) return;
    setModalVisible(false);
    reset();
  };
  const add = () => {
    reset();
    setModalVisible(true);
  };
  const edit = item => {
    setEditing(item);
    setName(item.name);
    setImages([item.image]);
    setError('');
    setModalVisible(true);
  };
  const save = async () => {
    if (saving || uploading) return;
    if (!name.trim() || !images[0]) {
      setError('Enter the banner name and select one image.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { name: name.trim(), image: images[0] };
      if (editing) await updateBanner(editing.id, payload, editing.version);
      else await addBanner(payload);
      setModalVisible(false);
      reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const remove = item =>
    Alert.alert('Delete banner?', `Delete "${item.name}" and its image?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteBanner(item.id).catch(e =>
            Alert.alert('Unable to delete banner', e.message),
          ),
      },
    ]);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={navigation.goBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Home banners</Text>
          <Text style={styles.headerText}>Manage carousel images</Text>
        </View>
        <Pressable onPress={add} style={styles.headerAdd}>
          <Ionicons name={'add'} size={23} color={colors.background} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Modal
          animationType={'slide'}
          onRequestClose={closeModal}
          statusBarTranslucent
          transparent
          visible={modalVisible}
        >
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.modalDismissArea} onPress={closeModal} />
            <View style={styles.formCard}>
              <View style={styles.formHead}>
                <Text style={styles.formTitle}>
                  {editing ? 'Edit banner' : 'Add banner'}
                </Text>
                <Pressable onPress={closeModal} style={styles.closeButton}>
                  <Ionicons name={'close'} size={21} color={colors.primary} />
                </Pressable>
              </View>
              <Text style={styles.label}>Banner name *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                maxLength={100}
                placeholder="Enter banner name"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
              <ImageUploadField
                kind="banner"
                images={images}
                onChange={setImages}
                onBusyChange={setUploading}
                disabled={saving}
              />
              {editing && (
                <View style={styles.note}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={colors.accent}
                  />
                  <Text style={styles.noteText}>
                    When you save a different image, the previous image is
                    removed from Cloudinary.
                  </Text>
                </View>
              )}
              {Boolean(error) && <Text style={styles.error}>{error}</Text>}
              <Pressable
                onPress={save}
                disabled={saving || uploading}
                style={styles.save}
              >
                <Text style={styles.saveText}>
                  {saving
                    ? 'Saving...'
                    : editing
                    ? 'Save changes'
                    : 'Add banner'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <View style={styles.listHead}>
          <Text style={styles.listTitle}>Current banners</Text>
          <Text style={styles.count}>{banners.length}</Text>
        </View>
        {bannersLoading && (
          <Text style={styles.message}>Loading banners...</Text>
        )}
        {Boolean(bannersError) && (
          <Pressable onPress={refreshBanners}>
            <Text style={styles.error}>{bannersError} Tap to retry.</Text>
          </Pressable>
        )}
        {banners.map((item, index) => (
          <View key={item.id} style={styles.bannerCard}>
            <View style={styles.imageWrap}>
              <Image
                source={{ uri: item.image }}
                resizeMode="cover"
                style={styles.preview}
              />
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>Banner {index + 1}</Text>
              </View>
            </View>
            <View style={styles.bannerBody}>
              <View style={styles.bannerCopy}>
                <Text numberOfLines={1} style={styles.bannerName}>
                  {item.name}
                </Text>
                <Text style={styles.liveText}>Live on home page</Text>
              </View>
              <Pressable onPress={() => edit(item)} style={styles.iconButton}>
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => remove(item)} style={styles.iconButton}>
                <Ionicons name="trash-outline" size={20} color="#C83E3E" />
              </Pressable>
            </View>
          </View>
        ))}
        {!bannersLoading && !bannersError && !banners.length && (
          <Text style={styles.message}>
            No banners yet. The app will continue showing its default carousel.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerText: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
    textAlign: 'center',
  },
  headerAdd: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.accent,
  },
  content: { padding: 20, paddingBottom: 45 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(3,20,40,0.48)',
  },
  modalDismissArea: { flex: 1 },
  formCard: {
    padding: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.background,
  },
  formHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  formTitle: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  closeButton: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  label: {
    marginBottom: 7,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    height: 50,
    marginBottom: 15,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    fontSize: 12,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 13,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#FFF5EF',
  },
  noteText: {
    flex: 1,
    marginLeft: 7,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
  },
  error: { marginBottom: 12, color: '#C83E3E', fontSize: 10 },
  save: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  saveText: { color: colors.background, fontSize: 13, fontWeight: '800' },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 23,
    marginBottom: 11,
  },
  listTitle: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  count: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9,
    backgroundColor: '#FFF0E8',
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
  },
  bannerCard: {
    overflow: 'hidden',
    marginBottom: 13,
    borderRadius: 19,
    backgroundColor: colors.background,
  },
  imageWrap: { position: 'relative' },
  preview: { width: '100%', height: 145 },
  positionBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: 'rgba(4,31,63,0.82)',
  },
  positionText: {
    color: colors.background,
    fontSize: 9,
    fontWeight: '800',
  },
  bannerBody: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  bannerName: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  bannerCopy: { flex: 1 },
  liveText: {
    marginTop: 3,
    color: '#3B8C6E',
    fontSize: 9,
    fontWeight: '600',
  },
  iconButton: {
    minWidth: 39,
    height: 39,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  editText: {
    marginLeft: 4,
    marginRight: 7,
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  message: {
    paddingVertical: 20,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});
