import { router } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Switch,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ChowColors, Radius, Shadows } from '@/constants/theme';
import { formatPrice } from '@/data/foods';
import {
  fetchAdminProducts,
  updateProductAvailability,
  saveAdminProduct,
  AdminProductPayload,
} from '@/services/admin';

interface ProductItem {
  id: string;
  name: string;
  shortName: string;
  categoryId: string;
  categoryName: string;
  priceNaira: number;
  isAvailable: boolean;
  description: string;
  restaurantName: string;
  prepTimeText?: string;
}

export default function AdminMenuScreen() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Edit/Create Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductItem> | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const data = await fetchAdminProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load menu products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchAdminProducts();
        if (active) setProducts(data);
      } catch (err) {
        console.error('Failed to load menu products:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleToggleAvailability = async (product: ProductItem) => {
    const nextVal = !product.isAvailable;
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isAvailable: nextVal } : p))
    );

    const success = await updateProductAvailability(product.id, nextVal);
    if (!success) {
      Alert.alert('Error', 'Failed to update item availability in database.');
      // Revert optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isAvailable: product.isAvailable } : p))
      );
    }
  };

  const handleOpenEdit = (product?: ProductItem) => {
    if (product) {
      setEditingProduct({ ...product });
    } else {
      setEditingProduct({
        name: '',
        description: '',
        priceNaira: 0,
        categoryName: 'Main Dishes',
        categoryId: 'cat_soups',
        isAvailable: true,
      });
    }
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct?.name?.trim()) {
      Alert.alert('Validation Error', 'Dish name is required.');
      return;
    }
    if (!editingProduct?.priceNaira || Number(editingProduct.priceNaira) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price in Naira.');
      return;
    }

    setSaving(true);
    try {
      const payload: AdminProductPayload = {
        id: editingProduct.id,
        name: editingProduct.name,
        shortName: editingProduct.shortName || editingProduct.name,
        categoryId: editingProduct.categoryId || 'cat_soups',
        priceNaira: Number(editingProduct.priceNaira),
        description: editingProduct.description || '',
        restaurantName: editingProduct.restaurantName || 'Calabar Kitchen',
        isAvailable: editingProduct.isAvailable ?? true,
      };

      const res = await saveAdminProduct(payload);
      if (res.success) {
        Alert.alert('Success', 'Menu catalog updated successfully.');
        setModalVisible(false);
        setEditingProduct(null);
        loadProducts();
      } else {
        Alert.alert('Error', res.error || 'Failed to save product.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  // Derive categories
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.categoryName || 'General')))];

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchCat =
      selectedCategory === 'all' || (p.categoryName || 'General') === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Search & Actions Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color={ChowColors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={ChowColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food catalog..."
            placeholderTextColor={ChowColors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={ChowColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenEdit()}>
          <Ionicons name="add" size={20} color={ChowColors.surface} />
          <Text style={styles.addBtnText}>New Dish</Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <View style={styles.catWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catContent}>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, active && styles.catPillActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.catText, active && styles.catTextActive]}>
                  {cat === 'all' ? 'All Dishes' : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Catalog List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ChowColors.primary} />
          <Text style={styles.loadingText}>Fetching menu catalog...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="fast-food-outline" size={54} color={ChowColors.textMuted} />
          <Text style={styles.emptyTitle}>No dishes found</Text>
          <Text style={styles.emptyDesc}>Try adjusting your search query or category filter.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ChowColors.primary]} />}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={styles.productMain}>
                <View style={styles.productHeaderRow}>
                  <View style={styles.productTitleGroup}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productCategory}>{item.categoryName || 'General'}</Text>
                  </View>
                  <Text style={styles.productPrice}>{formatPrice(item.priceNaira)}</Text>
                </View>

                {item.description ? (
                  <Text style={styles.productDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>

              <View style={styles.productActionsRow}>
                <View style={styles.availabilityGroup}>
                  <Switch
                    value={item.isAvailable}
                    onValueChange={() => handleToggleAvailability(item)}
                    trackColor={{ false: ChowColors.border, true: `${ChowColors.success}80` }}
                    thumbColor={item.isAvailable ? ChowColors.success : ChowColors.surface}
                  />
                  <Text
                    style={[
                      styles.availText,
                      { color: item.isAvailable ? ChowColors.success : ChowColors.textMuted },
                    ]}
                  >
                    {item.isAvailable ? 'Available' : 'Sold Out'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleOpenEdit(item)}
                >
                  <Ionicons name="create-outline" size={16} color={ChowColors.primary} />
                  <Text style={styles.editBtnText}>Edit Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Edit / Add Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct?.id ? 'Edit Menu Dish' : 'Create New Dish'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={ChowColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Dish Name / Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Seafood Okro & Pounded Yam"
                  placeholderTextColor={ChowColors.textMuted}
                  value={editingProduct?.name || ''}
                  onChangeText={(val) => setEditingProduct((prev) => ({ ...prev, name: val }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Price (₦ Naira) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 4500"
                  placeholderTextColor={ChowColors.textMuted}
                  keyboardType="numeric"
                  value={editingProduct?.priceNaira ? String(editingProduct.priceNaira) : ''}
                  onChangeText={(val) => setEditingProduct((prev) => ({ ...prev, priceNaira: Number(val) || 0 }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Rich fresh seafood, dry fish, prawns and local spices..."
                  placeholderTextColor={ChowColors.textMuted}
                  multiline
                  numberOfLines={3}
                  value={editingProduct?.description || ''}
                  onChangeText={(val) => setEditingProduct((prev) => ({ ...prev, description: val }))}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.formLabel}>Available for Ordering</Text>
                <Switch
                  value={editingProduct?.isAvailable ?? true}
                  onValueChange={(val) => setEditingProduct((prev) => ({ ...prev, isAvailable: val }))}
                  trackColor={{ false: ChowColors.border, true: `${ChowColors.success}80` }}
                  thumbColor={editingProduct?.isAvailable ? ChowColors.success : ChowColors.surface}
                />
              </View>

              <TouchableOpacity
                style={styles.saveSubmitBtn}
                onPress={handleSaveProduct}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={ChowColors.surface} />
                ) : (
                  <Text style={styles.saveSubmitText}>Save to Menu Catalog</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChowColors.canvas,
  },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    alignItems: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.circle,
    backgroundColor: ChowColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.input,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: ChowColors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: ChowColors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChowColors.primary,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: Radius.button,
    gap: 6,
  },
  addBtnText: {
    color: ChowColors.surface,
    fontWeight: '700',
    fontSize: 13,
  },
  catWrapper: {
    marginVertical: 10,
  },
  catContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: ChowColors.surface,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  catPillActive: {
    backgroundColor: ChowColors.textPrimary,
    borderColor: ChowColors.textPrimary,
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
    color: ChowColors.textSecondary,
  },
  catTextActive: {
    color: ChowColors.surface,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  productCard: {
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: ChowColors.border,
    ...Shadows.card,
  },
  productMain: {
    marginBottom: 12,
  },
  productHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productTitleGroup: {
    flex: 1,
    paddingRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: ChowColors.textPrimary,
  },
  productCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: ChowColors.primary,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: ChowColors.textPrimary,
  },
  productDesc: {
    fontSize: 13,
    color: ChowColors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  productActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ChowColors.border,
  },
  availabilityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.button,
    backgroundColor: ChowColors.secondaryLight,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: ChowColors.primary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 13,
    color: ChowColors.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: ChowColors.textPrimary,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 13,
    color: ChowColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: ChowColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChowColors.textPrimary,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ChowColors.textPrimary,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: ChowColors.canvas,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: ChowColors.textPrimary,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  saveSubmitBtn: {
    backgroundColor: ChowColors.primary,
    height: 48,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  saveSubmitText: {
    color: ChowColors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
});
