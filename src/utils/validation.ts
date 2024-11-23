// 检查是否包含中文字符
export function containsChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/.test(str);
}

// 检查用户ID是否合法
export function isValidUserId(userId: string): boolean {
  return !containsChinese(userId) && userId.trim().length > 0;
} 