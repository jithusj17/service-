export const Permissions = {
  // Customer Permissions
  CUSTOMER_READ: 'customer.read',
  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_UPDATE: 'customer.update',

  // Asset Permissions
  ASSET_READ: 'asset.read',
  ASSET_CREATE: 'asset.create',
  ASSET_UPDATE: 'asset.update',

  // Service Request Permissions
  SERVICE_REQUEST_READ: 'service_request.read',
  SERVICE_REQUEST_CREATE: 'service_request.create',
  SERVICE_REQUEST_UPDATE: 'service_request.update',

  // Repair/Work Order Permissions
  WORK_ORDER_READ: 'work_order.read',
  WORK_ORDER_CREATE: 'work_order.create',
  WORK_ORDER_UPDATE: 'work_order.update',
  WORK_ORDER_ASSIGN: 'work_order.assign',

  // Diagnosis Permissions
  DIAGNOSIS_READ: 'diagnosis.read',
  DIAGNOSIS_CREATE: 'diagnosis.create',
  DIAGNOSIS_UPDATE: 'diagnosis.update',

  // Estimate Permissions
  ESTIMATE_READ: 'estimate.read',
  ESTIMATE_CREATE: 'estimate.create',
  ESTIMATE_UPDATE: 'estimate.update',
  ESTIMATE_APPROVE: 'estimate.approve',

  REPAIR_READ: 'repair.read',
  REPAIR_CREATE: 'repair.create',
  REPAIR_UPDATE: 'repair.update',

  // Inventory Permissions
  INVENTORY_READ: 'inventory.read',
  INVENTORY_UPDATE: 'inventory.update',

  // Invoice Permissions
  INVOICE_READ: 'invoice.read',
  INVOICE_CREATE: 'invoice.create',

  // Payment Permissions
  PAYMENT_READ: 'payment.read',

  // User/Staff Permissions
  USER_READ: 'user.read',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
