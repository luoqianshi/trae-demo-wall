export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const hashPassword = (password: string): string => {
  try {
    return btoa(password);
  } catch {
    return password;
  }
};

export const decryptPassword = (encrypted: string): string => {
  try {
    return atob(encrypted);
  } catch {
    return encrypted;
  }
};
