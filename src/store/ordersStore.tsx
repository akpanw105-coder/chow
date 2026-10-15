/**
 * Orders Store — Chow
 * Manages active orders, order history, backend persistence, and Realtime updates.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  fetchCustomerOrders,
  placeOrderInBackend,
  PlaceOrderParams,
  subscribeToOrderRealtime,
} from '@/services/orders';
import { useAuth } from '@/store/authStore';
import { Order, OrderStatus } from '@/types';

interface OrdersContextValue {
  orders: Order[];
  activeOrder: Order | null;
  placeOrder: (params: PlaceOrderParams) => Promise<Order>;
  getOrderById: (orderId: string) => Order | undefined;
  simulateAdvanceStatus: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  isLoading: boolean;
}

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_101',
    orderNumber: 'CHOW-8921',
    items: [
      {
        food: {
          id: 'bole_fish',
          name: 'Calabar Bole & Grilled Mackerel',
          shortName: 'Calabar Bole & Fish',
          description: 'Port Harcourt-style roasted plantain with whole charcoal-grilled spiced mackerel.',
          category: 'grills',
          basePrice: 5200,
          rating: 4.8,
          reviewCount: '1.2k+',
          calories: 780,
          prepTime: '25-35 min',
          restaurant: 'Calabar Kitchen',
          distance: '1.2 Km',
          image: require('@/assets/images/food/bole_fish.png'),
        },
        quantity: 2,
        unitPrice: 5200,
      },
      {
        food: {
          id: 'jollof_rice',
          name: 'Smoky Party Jollof & Fried Plantain',
          shortName: 'Smoky Jollof & Dodo Platter',
          description: 'Vibrant smoky reddish-orange long-grain rice with dodo.',
          category: 'rice',
          basePrice: 3800,
          rating: 4.9,
          reviewCount: '2k+',
          calories: 920,
          prepTime: '20-30 min',
          restaurant: 'Rivers Aroma',
          distance: '2.5 Km',
          image: require('@/assets/images/food/jollof_rice.png'),
        },
        quantity: 1,
        unitPrice: 3800,
      },
    ],
    subtotal: 14200,
    deliveryFee: 1200,
    packagingFee: 600,
    discount: 1000,
    total: 15000,
    status: 'on_the_way',
    paymentMethod: 'card',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    deliveryAddress: '14 Marian Road, Calabar',
    recipientPhone: '+234 803 456 7890',
    deliveryNote: 'Gate is black, ring bell twice.',
    estimatedTime: '15-20 min',
    restaurantName: 'Calabar Kitchen',
  },
  {
    id: 'ord_100',
    orderNumber: 'CHOW-7614',
    items: [
      {
        food: {
          id: 'afang_soup',
          name: 'Afang Soup & Swallow',
          shortName: 'Afang Soup & Swallow',
          description: 'Traditional Cross River delicacy slow-cooked with fresh shredded afang.',
          category: 'soups',
          basePrice: 6500,
          rating: 4.9,
          reviewCount: '1.4k+',
          calories: 620,
          prepTime: '20-30 min',
          restaurant: 'Calabar Kitchen',
          distance: '1.2 Km',
          image: require('@/assets/images/food/afang_bowl.png'),
        },
        quantity: 1,
        selectedSwallow: { id: 'pounded_yam', label: 'Pounded Yam' },
        unitPrice: 6500,
      },
    ],
    subtotal: 6500,
    deliveryFee: 1200,
    packagingFee: 600,
    discount: 0,
    total: 8300,
    status: 'delivered',
    paymentMethod: 'card',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    deliveryAddress: '14 Marian Road, Calabar',
    recipientPhone: '+234 803 456 7890',
    estimatedTime: 'Delivered',
    restaurantName: 'Calabar Kitchen',
  },
];

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync with Supabase on customer sign in
  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      if (!user?.id) return;
      setIsLoading(true);
      const dbOrders = await fetchCustomerOrders(user.id);
      if (isMounted) {
        if (dbOrders.length > 0) {
          setOrders(dbOrders);
        }
        setIsLoading(false);
      }
    }
    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const activeOrder = orders.find((o) => o.status !== 'delivered' && o.status !== 'cancelled') ?? null;

  // Supabase Realtime Subscription for active order updates
  useEffect(() => {
    if (!activeOrder?.id) return;
    const unsubscribe = subscribeToOrderRealtime(activeOrder.id, (newStatus) => {
      setOrders((prev) =>
        prev.map((ord) => (ord.id === activeOrder.id ? { ...ord, status: newStatus } : ord))
      );
    });
    return () => {
      unsubscribe();
    };
  }, [activeOrder?.id]);

  const placeOrder = useCallback(
    async (params: PlaceOrderParams): Promise<Order> => {
      try {
        const newOrder = await placeOrderInBackend(params);
        setOrders((prev) => [newOrder, ...prev]);
        return newOrder;
      } catch (err) {
        console.warn('Backend placeOrder fallback to local state:', err);
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const fallbackOrder: Order = {
          id: `ord_${Date.now()}`,
          orderNumber: `CHOW-${randomSuffix}`,
          items: params.items,
          subtotal: params.subtotal,
          deliveryFee: params.deliveryFee,
          packagingFee: params.packagingFee,
          discount: params.discount,
          total: params.total,
          status: 'confirmed',
          paymentMethod: params.paymentMethod,
          createdAt: new Date().toISOString(),
          deliveryAddress: params.deliveryAddress,
          recipientPhone: params.recipientPhone,
          deliveryNote: params.deliveryNote,
          estimatedTime: '25-35 min',
          restaurantName: params.restaurantName || 'Calabar Kitchen',
        };
        setOrders((prev) => [fallbackOrder, ...prev]);
        return fallbackOrder;
      }
    },
    []
  );

  const getOrderById = useCallback(
    (orderId: string) => orders.find((o) => o.id === orderId),
    [orders]
  );

  const simulateAdvanceStatus = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        const flow: Record<OrderStatus, OrderStatus> = {
          pending: 'confirmed',
          confirmed: 'preparing',
          preparing: 'on_the_way',
          on_the_way: 'delivered',
          delivered: 'delivered',
          cancelled: 'cancelled',
        };
        const nextStatus = flow[ord.status];
        return {
          ...ord,
          status: nextStatus,
          estimatedTime: nextStatus === 'delivered' ? 'Delivered' : ord.estimatedTime,
        };
      })
    );
  }, []);

  const cancelOrder = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId ? { ...ord, status: 'cancelled' as OrderStatus } : ord
      )
    );
  }, []);

  return (
    <OrdersContext.Provider
      value={{
        orders,
        activeOrder,
        placeOrder,
        getOrderById,
        simulateAdvanceStatus,
        cancelOrder,
        isLoading,
      }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used inside <OrdersProvider>');
  return ctx;
}
