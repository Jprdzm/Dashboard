export function requireAuth(user) {
  if (!user?.id) {
    throw new Error('Se requiere autenticación para esta operación.');
  }
  return user.id;
}

export function enrichWithUser(data, user) {
  const userId = requireAuth(user);
  return { ...data, user_id: userId };
}
