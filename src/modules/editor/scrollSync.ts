/**
 * 滚动同步工具 - 优化版
 * 用于在编辑区域和预览区域之间同步滚动位置
 * 性能优化：延迟控制在100ms以内，防抖机制，性能监控
 */

// 性能监控数据
export interface ScrollSyncMetrics {
  syncCount: number;
  avgSyncDelay: number;
  lastSyncTimestamp: number;
  syncAccuracy: number;
  cpuSamples: number[];
}

// 性能监控状态
const metrics: ScrollSyncMetrics = {
  syncCount: 0,
  avgSyncDelay: 0,
  lastSyncTimestamp: 0,
  syncAccuracy: 100,
  cpuSamples: []
};

// 记录同步开始时间
let syncStartTime = 0;

/**
 * 计算相对滚动位置（0-1）
 * 优化：添加小数位精度控制，减少计算误差
 */
export function getRelativeScrollPosition(element: HTMLElement): number {
  const { scrollTop, scrollHeight, clientHeight } = element;
  const maxScrollTop = scrollHeight - clientHeight;
  if (maxScrollTop <= 0) return 0;
  
  // 计算相对位置，保留4位小数精度
  const position = Math.max(0, Math.min(1, scrollTop / maxScrollTop));
  return Math.round(position * 10000) / 10000;
}

/**
 * 根据相对位置设置滚动
 * 优化：支持即时同步和动画同步两种模式
 */
export function setRelativeScrollPosition(
  element: HTMLElement, 
  relativePosition: number, 
  useAnimation: boolean = true
): void {
  const { scrollHeight, clientHeight } = element;
  const maxScrollTop = scrollHeight - clientHeight;
  if (maxScrollTop <= 0) return;
  
  const targetScrollTop = Math.max(0, Math.min(maxScrollTop, relativePosition * maxScrollTop));
  
  // 优化：如果位置差异很小，直接设置，避免不必要的动画
  const currentPosition = getRelativeScrollPosition(element);
  const positionDiff = Math.abs(relativePosition - currentPosition);
  
  if (positionDiff < 0.001) {
    return; // 位置几乎相同，跳过
  }
  
  if (useAnimation && positionDiff > 0.01) {
    smoothScrollTo(element, targetScrollTop, 150); // 减少动画时长到150ms
  } else {
    element.scrollTop = targetScrollTop; // 直接设置，无动画
  }
}

/**
 * 平滑滚动到指定位置
 * 优化：更高效的动画算法，支持中断
 */
let currentAnimationId: number | null = null;

export function smoothScrollTo(
  element: HTMLElement, 
  targetScrollTop: number, 
  duration: number = 150
): void {
  // 取消之前的动画
  if (currentAnimationId) {
    cancelAnimationFrame(currentAnimationId);
  }
  
  const startScrollTop = element.scrollTop;
  const distance = targetScrollTop - startScrollTop;
  
  // 如果距离很小，直接设置
  if (Math.abs(distance) < 1) {
    element.scrollTop = targetScrollTop;
    return;
  }
  
  const startTime = performance.now();
  
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(1, elapsed / duration);
    
    // 使用更流畅的缓动曲线：ease-out-cubic
    const easeOutProgress = 1 - Math.pow(1 - progress, 3);
    const currentScrollTop = startScrollTop + distance * easeOutProgress;
    
    element.scrollTop = currentScrollTop;
    
    if (progress < 1) {
      currentAnimationId = requestAnimationFrame(animate);
    } else {
      currentAnimationId = null;
    }
  };
  
  currentAnimationId = requestAnimationFrame(animate);
}

/**
 * 取消当前滚动动画
 */
export function cancelScrollAnimation(): void {
  if (currentAnimationId) {
    cancelAnimationFrame(currentAnimationId);
    currentAnimationId = null;
  }
}

/**
 * 性能监控：记录同步开始
 */
export function recordSyncStart(): void {
  syncStartTime = performance.now();
}

/**
 * 性能监控：记录同步完成
 */
export function recordSyncComplete(): void {
  const endTime = performance.now();
  const syncDelay = endTime - syncStartTime;
  
  metrics.syncCount++;
  metrics.lastSyncTimestamp = endTime;
  
  // 更新平均延迟
  metrics.avgSyncDelay = (metrics.avgSyncDelay * (metrics.syncCount - 1) + syncDelay) / metrics.syncCount;
  
  // 采样CPU（简化版）
  if (metrics.syncCount % 10 === 0) {
    metrics.cpuSamples.push(syncDelay);
    if (metrics.cpuSamples.length > 100) {
      metrics.cpuSamples.shift();
    }
  }
}

/**
 * 获取性能监控数据
 */
export function getMetrics(): ScrollSyncMetrics {
  return { ...metrics };
}

/**
 * 重置性能监控
 */
export function resetMetrics(): void {
  metrics.syncCount = 0;
  metrics.avgSyncDelay = 0;
  metrics.lastSyncTimestamp = 0;
  metrics.syncAccuracy = 100;
  metrics.cpuSamples = [];
}

/**
 * 防抖函数 - 优化滚动事件处理
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T, 
  wait: number = 16
): ((...args: Parameters<T>) => void) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      if (lastArgs) {
        func(...(lastArgs as Parameters<T>));
      }
      timeoutId = null;
    }, wait);
  };
  
  return debounced;
}

/**
 * 节流函数 - 用于高频事件
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T, 
  limit: number = 16
): ((...args: Parameters<T>) => void) {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
