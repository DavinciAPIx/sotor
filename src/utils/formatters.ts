
/**
 * Format date to be in a more concise format (DD/MM/YY)
 */
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(2);
  
  return `${day}/${month}/${year}`;
};

/**
 * Get status color based on transaction status
 */
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'text-green-700 bg-green-50 border border-green-200';
    case 'pending':
      return 'text-amber-700 bg-amber-50 border border-amber-200';
    case 'failed':
      return 'text-red-700 bg-red-50 border border-red-200';
    default:
      return 'text-gray-700 bg-gray-50 border border-gray-200';
  }
};

/**
 * Translate status to Arabic
 */
export const translateStatus = (status: string) => {
  switch (status) {
    case 'paid':
      return 'مكتمل';
    case 'pending':
      return 'قيد المعالجة';
    case 'failed':
      return 'فشلت';
    default:
      return status;
  }
};
