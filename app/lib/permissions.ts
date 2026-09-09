export function hasPermission(
  permissions: string[] | undefined,
  permission: string
) {
  return permissions?.includes(permission) ?? false;
}