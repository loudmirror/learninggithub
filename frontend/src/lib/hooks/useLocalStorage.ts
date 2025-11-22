/**
 * useLocalStorage Hook
 * 用于在 localStorage 中持久化数据的自定义 Hook
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * 从 localStorage 获取并解析数据
 */
function getStorageValue<T>(key: string, defaultValue: T): T {
  // 服务端渲染时返回默认值
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * useLocalStorage Hook
 * @param key localStorage 键名
 * @param defaultValue 默认值
 * @returns [value, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // 初始化状态
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getStorageValue(key, defaultValue);
  });

  // 设置新值
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // 支持函数式更新
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // 更新状态
        setStoredValue(valueToStore);

        // 保存到 localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));

          // 触发自定义事件,通知其他组件
          window.dispatchEvent(
            new CustomEvent('localStorageChange', {
              detail: { key, value: valueToStore },
            })
          );
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // 删除值
  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);

        // 触发自定义事件
        window.dispatchEvent(
          new CustomEvent('localStorageChange', {
            detail: { key, value: null },
          })
        );
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  // 监听其他标签页的 localStorage 变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };

    // 监听自定义事件 (同一标签页内的变化)
    const handleCustomStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.key === key) {
        setStoredValue(customEvent.detail.value ?? defaultValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
    };
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
}
