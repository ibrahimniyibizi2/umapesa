// Global error handler for unhandled promise rejections
export class ErrorHandler {
  static init() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Check if it's a message channel error
      if (event.reason?.message?.includes('message channel closed')) {
        console.warn('Message channel communication error - this is usually safe to ignore');
        // Prevent the error from appearing in console
        event.preventDefault();
        return;
      }
      
      // Check if it's a listener/extension error
      if (event.reason?.message?.includes('listener indicated an asynchronous response')) {
        console.warn('Browser extension communication error - safe to ignore');
        event.preventDefault();
        return;
      }
      
      // Log other errors for debugging
      this.logError('Unhandled Promise Rejection', event.reason);
    });

    // Handle general errors
    window.addEventListener('error', (event) => {
      // Filter out extension-related errors
      if (event.error?.message?.includes('Extension context invalidated') ||
          event.error?.message?.includes('message channel closed')) {
        console.warn('Browser extension error - safe to ignore');
        return;
      }
      
      console.error('Global error:', event.error);
      this.logError('Global Error', event.error);
    });
  }

  static logError(type: string, error: any) {
    // In production, you might want to send this to a logging service
    if (import.meta.env.MODE === 'development') {
      console.group(`🚨 ${type}`);
      console.error('Error:', error);
      console.error('Stack:', error?.stack);
      console.groupEnd();
    }
  }

  // Wrapper for async operations that might fail
  static async safeAsync<T>(
    operation: () => Promise<T>,
    fallback?: T,
    errorMessage?: string
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      console.warn(errorMessage || 'Async operation failed:', error);
      return fallback;
    }
  }

  // Wrapper for message channel operations
  static async safeMessageChannel<T>(
    operation: () => Promise<T>,
    timeout: number = 5000
  ): Promise<T | null> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.warn('Message channel operation timed out');
        resolve(null);
      }, timeout);

      operation()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          console.warn('Message channel operation failed:', error);
          resolve(null);
        });
    });
  }
}