export type AdminModuleKey =
  | "orders"
  | "quotes"
  | "invoices"
  | "fileUploads"
  | "coupons"
  | "reviews"
  | "newsletter"
  | "shipping"
  | "paymentMethods"
  | "usersRoles"
  | "emailTemplates"
  | "activityLogs"
  | "backups"
  | "security"
  | "categories"
  | "products";

export type ModulePermission = "view" | "create" | "update" | "delete";
