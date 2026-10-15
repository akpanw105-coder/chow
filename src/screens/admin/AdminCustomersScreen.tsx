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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ChowColors, Radius, Shadows } from '@/constants/theme';
import { formatPrice } from '@/data/foods';
import { fetchAdminCustomers, AdminCustomerSummary } from '@/services/admin';

export default function AdminCustomersScreen() {
  const [customers, setCustomers] = useState<AdminCustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadCustomers = useCallback(async () => {
    try {
      const data = await fetchAdminCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchAdminCustomers();
        if (active) setCustomers(data);
      } catch (err) {
        console.error('Failed to load customers:', err);
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
    loadCustomers();
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.fullName && c.fullName.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Search Bar */}
      <View style={styles.searchHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color={ChowColors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={ChowColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer name, phone or email..."
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
      </View>

      {/* Customer Count Summary */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {filtered.length} registered {filtered.length === 1 ? 'user' : 'users'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ChowColors.primary} />
          <Text style={styles.loadingText}>Loading customer directory...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={54} color={ChowColors.textMuted} />
          <Text style={styles.emptyTitle}>No users found</Text>
          <Text style={styles.emptyDesc}>No accounts match your search criteria.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ChowColors.primary]} />}
          renderItem={({ item }) => (
            <View style={styles.customerCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.fullName || 'U').slice(0, 1).toUpperCase()}
                </Text>
              </View>

              <View style={styles.customerMeta}>
                <View style={styles.nameRow}>
                  <Text style={styles.customerName}>{item.fullName || 'Customer'}</Text>
                  <View style={styles.roleTag}>
                    <Text style={styles.roleTagText}>
                      {(item.role || 'customer').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {item.phone ? (
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={13} color={ChowColors.textSecondary} />
                    <Text style={styles.contactText}>{item.phone}</Text>
                  </View>
                ) : null}

                {item.email ? (
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={13} color={ChowColors.textSecondary} />
                    <Text style={styles.contactText}>{item.email}</Text>
                  </View>
                ) : null}

                {/* Metrics */}
                <View style={styles.statsRow}>
                  <View style={styles.statChip}>
                    <Text style={styles.statChipVal}>{item.ordersCount || 0}</Text>
                    <Text style={styles.statChipLabel}>Orders</Text>
                  </View>
                  <View style={styles.statChip}>
                    <Text style={styles.statChipVal}>
                      {formatPrice(item.totalSpentNaira || 0)}
                    </Text>
                    <Text style={styles.statChipLabel}>Total Spent</Text>
                  </View>
                  <View style={styles.statChip}>
                    <Text style={styles.statChipVal}>
                      {new Date(item.createdAt).toLocaleDateString('en-GB', {
                        month: 'short',
                        year: '2-digit',
                      })}
                    </Text>
                    <Text style={styles.statChipLabel}>Joined</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChowColors.canvas,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
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
  summaryBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: ChowColors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  customerCard: {
    flexDirection: 'row',
    backgroundColor: ChowColors.surface,
    borderRadius: Radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: ChowColors.border,
    gap: 14,
    ...Shadows.card,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.circle,
    backgroundColor: ChowColors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: ChowColors.primary,
  },
  customerMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: ChowColors.textPrimary,
  },
  roleTag: {
    backgroundColor: ChowColors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: ChowColors.textSecondary,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  contactText: {
    fontSize: 12,
    color: ChowColors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: ChowColors.border,
  },
  statChip: {
    backgroundColor: ChowColors.canvas,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.chip,
    borderWidth: 1,
    borderColor: ChowColors.border,
  },
  statChipVal: {
    fontSize: 12,
    fontWeight: '700',
    color: ChowColors.textPrimary,
  },
  statChipLabel: {
    fontSize: 10,
    color: ChowColors.textSecondary,
    marginTop: 1,
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
});
