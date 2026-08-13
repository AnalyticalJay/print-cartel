type CustomerIdentity = { id?: number | null; email?: string | null } | null | undefined;
type CustomerOrderIdentity = { userId?: number | null; customerEmail?: string | null };

export function isCustomerOrderOwner(order: CustomerOrderIdentity, user: CustomerIdentity): boolean {
  if (!user) return false;
  if (typeof user.id === "number" && order.userId === user.id) return true;
  const orderEmail = order.customerEmail?.trim().toLowerCase();
  const userEmail = user.email?.trim().toLowerCase();
  return Boolean(orderEmail && userEmail && orderEmail === userEmail);
}
