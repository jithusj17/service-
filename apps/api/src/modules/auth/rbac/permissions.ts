export const Permissions = {
  // Customer Permissions
  CUSTOMER_READ: 'customer.read',
  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_UPDATE: 'customer.update',

  // Asset Permissions
  ASSET_READ: 'asset.read',
  ASSET_CREATE: 'asset.create',
  ASSET_UPDATE: 'asset.update',

  // Repair Permissions
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
