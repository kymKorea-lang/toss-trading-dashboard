import { apiGet } from './auth.js';
export const getHoldings    = (sym='') => apiGet(`/api/v1/holdings${sym?'?symbol='+sym:''}`, true);
export const getBuyingPower = cur      => apiGet(`/api/v1/buying-power?currency=${cur}`, true);
export const getSellable    = sym      => apiGet(`/api/v1/sellable-quantity?symbol=${sym}`, true);
export const getCommissions = ()       => apiGet('/api/v1/commissions', true);
