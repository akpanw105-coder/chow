import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import RiderDeliveryDetailScreen from '@/screens/rider/RiderDeliveryDetailScreen';

export default function RiderDeliveryDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RiderDeliveryDetailScreen orderId={id || ''} />;
}
