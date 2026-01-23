import { useState, useEffect } from 'react';
import { paymentMethodAPI, PaymentMethodResponse } from '@/lib/api';

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPaymentMethods = async () => {
    try {
      const response = await paymentMethodAPI.getList();
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const getPaymentMethodName = (id: number): string => {
    const method = paymentMethods.find((m) => m.id === id);
    return method?.name || '알 수 없음';
  };

  return {
    paymentMethods,
    loading,
    getPaymentMethodName,
    refetch: loadPaymentMethods,
  };
}
