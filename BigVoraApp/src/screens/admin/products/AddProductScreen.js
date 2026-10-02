import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminData } from '../../../features/admin/AdminDataContext';
import ImageUploadField from '../../../components/admin/ImageUploadField';
import colors from '../../../theme/colors';

const units = ['Piece', 'Kg', 'Gram', 'Litre', 'Pack', 'Bag', 'Box'];
function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}) {
  return (
    <>
      <Text style={styles.label}>{label} *</Text>
      <View style={[styles.field, multiline && styles.multiline]}>
        <Ionicons name={icon} size={19} color={colors.textMuted} />
        <TextInput
          value={String(value)}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[styles.input, multiline && styles.multilineInput]}
        />
      </View>
    </>
  );
}
function Selector({ label, value, placeholder, onPress }) {
  return (
    <>
      <Text style={styles.label}>{label} *</Text>
      <Pressable onPress={onPress} style={styles.field}>
        <Ionicons name="list-outline" size={19} color={colors.textMuted} />
        <Text style={[styles.selectorText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
    </>
  );
}
function PickerModal({ visible, title, items, onSelect, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.primary} />
            </Pressable>
          </View>
          {items.map(item => (
            <Pressable
              key={item}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              style={styles.option}
            >
              <Text style={styles.optionText}>{item}</Text>
              <Ionicons
                name="chevron-forward"
                size={17}
                color={colors.textMuted}
              />
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function AddProductScreen({ navigation, route }) {
  const {
    addProduct,
    updateProduct,
    products,
    categories,
    categoriesLoading,
    categoriesError,
    refreshCategories,
    refreshProducts,
    productRules,
    productRulesLoading,
    productRulesError,
    refreshProductRules,
  } = useAdminData();
  const existing = products.find(item => item.id === route.params?.id);
  const editing = Boolean(route.params?.id);
  const [values, setValues] = useState({
    sku: existing?.sku || '',
    name: existing?.name || '',
    category: existing?.category || '',
    price: existing?.price || '',
    mrp: existing?.mrp || existing?.price || '',
    costPrice: existing?.costPrice || '',
    stock: existing?.stock || '',
    reorderLevel: existing?.reorderLevel || '',
    unit: existing?.unit || '',
  });
  const [ruleIds, setRuleIds] = useState(existing?.ruleIds || []);
  const [description, setDescription] = useState(existing?.description || '');
  const [version] = useState(existing?.version);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState(existing?.images || []);
  const [uploading, setUploading] = useState(false);
  const [picker, setPicker] = useState(null);
  const [error, setError] = useState('');
  const set = (key, value) =>
    setValues(current => ({ ...current, [key]: value }));
  const toggleRule = id =>
    setRuleIds(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id],
    );
  const save = async () => {
    if (saving || uploading) return;
    if (categoriesLoading) {
      setError('Categories are loading. Please wait.');
      return;
    }
    if (categoriesError) {
      setError(categoriesError);
      return;
    }
    const category = categories.find(item => item.name === values.category);
    if (!category) {
      setError('Select a saved category. Create one in Categories if needed.');
      return;
    }
    if (
      Object.values(values).some(value => !String(value).trim()) ||
      !description.trim()
    ) {
      setError('Complete all required product and inventory fields.');
      return;
    }
    if (
      Number(values.price) <= 0 ||
      Number(values.mrp) < Number(values.price) ||
      Number(values.costPrice) < 0 ||
      Number(values.stock) < 0 ||
      Number(values.reorderLevel) < 0
    ) {
      setError(
        'MRP must be at least the selling price and all prices and quantities must be valid.',
      );
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...values,
        description,
        images,
        ruleIds,
        categoryId: category.id,
      };
      if (editing) await updateProduct(existing.id, payload, version);
      else await addProduct(payload);
      navigation.goBack();
    } catch (e) {
      setError(e.message);
      if (e.status === 409) await refreshProducts();
    } finally {
      setSaving(false);
    }
  };
  if (editing && !existing)
    return (
      <SafeAreaView style={styles.container}>
        <Text>Product not found.</Text>
        <Pressable onPress={navigation.goBack}>
          <Text>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={navigation.goBack} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </Pressable>
          <View>
            <Text style={styles.title}>
              {editing ? 'Edit product' : 'Add product'}
            </Text>
            <Text style={styles.subtitle}>Product and inventory setup</Text>
          </View>
          <View style={styles.spacer} />
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {Boolean(categoriesError) && (
            <Pressable onPress={refreshCategories}>
              <Text style={styles.errorText}>
                {categoriesError} Tap to retry.
              </Text>
            </Pressable>
          )}
          {!categoriesLoading &&
            !categoriesError &&
            categories.length === 0 && (
              <Text style={styles.help}>
                Create a category from the Categories panel before adding
                products.
              </Text>
            )}
          <ImageUploadField
            kind="product"
            images={images}
            onChange={setImages}
            onBusyChange={setUploading}
            disabled={saving}
          />
          <Text style={styles.section}>Product information</Text>
          <Field
            label="Product name"
            icon="cube-outline"
            value={values.name}
            onChangeText={value => set('name', value)}
            placeholder="Enter product name"
          />
          <Field
            label={'SKU'}
            icon={'barcode-outline'}
            value={values.sku}
            onChangeText={value =>
              set('sku', value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))
            }
            placeholder={'Example: BV-RICE-001'}
          />
          <Text style={styles.help}>
            Use a unique SKU with letters, numbers, hyphens or underscores.
          </Text>
          <Selector
            label="Category"
            value={values.category}
            placeholder="Select from categories"
            onPress={() => setPicker('category')}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Field
                label="Selling price"
                icon="cash-outline"
                value={values.price}
                onChangeText={value => set('price', value)}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.half}>
              <Field
                label="MRP"
                icon="pricetag-outline"
                value={values.mrp}
                onChangeText={value => set('mrp', value)}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <Field
            label="Cost price"
            icon="wallet-outline"
            value={values.costPrice}
            onChangeText={value => set('costPrice', value)}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <Text style={styles.help}>
            The customer discount is calculated automatically from MRP and
            selling price.
          </Text>
          <Text style={styles.section}>Inventory controls</Text>
          <View style={styles.row}>
            <View style={styles.half}>
              <Field
                label={editing ? 'Available stock' : 'Opening stock'}
                icon="layers-outline"
                value={values.stock}
                onChangeText={value => set('stock', value)}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.half}>
              <Field
                label="Reorder at"
                icon="alert-circle-outline"
                value={values.reorderLevel}
                onChangeText={value => set('reorderLevel', value)}
                placeholder="10"
                keyboardType="number-pad"
              />
            </View>
          </View>
          <Selector
            label="Unit of measurement"
            value={values.unit}
            placeholder="Select unit"
            onPress={() => setPicker('unit')}
          />
          <Text style={styles.help}>
            A low-stock alert appears when available quantity reaches the
            reorder level.
          </Text>
          <Field
            label="Description"
            icon="document-text-outline"
            value={description}
            onChangeText={setDescription}
            placeholder="Product details for customers"
            multiline
          />
          <Text style={styles.section}>Product rules</Text>
          <Text style={styles.help}>
            Select the customer promises that apply to this product.
          </Text>
          {productRulesLoading ? (
            <Text style={styles.help}>Loading product rules...</Text>
          ) : (
            productRules
              .filter(rule => rule.isActive || ruleIds.includes(rule.id))
              .map(rule => (
                <Pressable
                  key={rule.id}
                  onPress={() => toggleRule(rule.id)}
                  style={[
                    styles.ruleOption,
                    ruleIds.includes(rule.id) && styles.ruleOptionActive,
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      ruleIds.includes(rule.id) && styles.checkboxActive,
                    ]}
                  >
                    {ruleIds.includes(rule.id) && (
                      <Ionicons
                        name="checkmark"
                        size={15}
                        color={colors.background}
                      />
                    )}
                  </View>
                  <Ionicons name={rule.icon} size={21} color={colors.accent} />
                  <View style={styles.ruleCopy}>
                    <Text style={styles.ruleTitle}>{rule.title}</Text>
                    <Text style={styles.ruleDescription}>
                      {rule.description}
                    </Text>
                  </View>
                </Pressable>
              ))
          )}
          {Boolean(productRulesError) && (
            <Pressable onPress={refreshProductRules}>
              <Text style={styles.errorText}>
                {productRulesError} Tap to retry.
              </Text>
            </Pressable>
          )}
          {Boolean(error) && (
            <View style={styles.error}>
              <Ionicons name="alert-circle-outline" size={17} color="#C83E3E" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <Pressable onPress={save} disabled={saving} style={styles.save}>
            <Text style={styles.saveText}>
              {saving
                ? 'Saving...'
                : editing
                ? 'Save changes'
                : 'Create product'}
            </Text>
            <Ionicons name="checkmark" size={20} color={colors.background} />
          </Pressable>
        </ScrollView>
        <PickerModal
          visible={picker === 'category'}
          title="Select category"
          items={categories.map(item => item.name)}
          onSelect={value => set('category', value)}
          onClose={() => setPicker(null)}
        />
        <PickerModal
          visible={picker === 'unit'}
          title="Select unit"
          items={units}
          onSelect={value => set('unit', value)}
          onClose={() => setPicker(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
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
  title: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 9,
    textAlign: 'center',
  },
  spacer: { width: 40 },
  content: { padding: 20, paddingBottom: 40 },
  section: {
    marginTop: 3,
    marginBottom: 13,
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  label: {
    marginBottom: 7,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  field: {
    height: 53,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: colors.background,
  },
  input: { flex: 1, marginLeft: 9, color: colors.text, fontSize: 12 },
  multiline: { height: 105, alignItems: 'flex-start', paddingTop: 15 },
  multilineInput: { height: 77, paddingTop: 0 },
  selectorText: { flex: 1, marginLeft: 9, color: colors.text, fontSize: 12 },
  placeholder: { color: colors.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  help: {
    marginTop: -5,
    marginBottom: 18,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },
  ruleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.background,
  },
  ruleOptionActive: { borderColor: colors.accent, backgroundColor: '#FFF8F4' },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 6,
  },
  checkboxActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  ruleCopy: { flex: 1, marginLeft: 9 },
  ruleTitle: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  ruleDescription: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 13,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
  },
  errorText: { flex: 1, marginLeft: 7, color: '#C83E3E', fontSize: 10 },
  save: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.accent,
  },
  saveText: {
    marginRight: 8,
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#061A3A88',
  },
  sheet: {
    padding: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: colors.background,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sheetTitle: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  option: {
    height: 49,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: { color: colors.text, fontSize: 13, fontWeight: '600' },
});
