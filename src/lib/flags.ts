export const isLocalMode = () => {
    // Check if running in browser
    if (typeof window !== 'undefined') {
      // In browser, this must be exposed via NEXT_PUBLIC_ env var or API
      // For now, let's rely on environment variable exposed to client
      return process.env.NEXT_PUBLIC_LOCAL_MODE === '1';
    }
  
    // In server
    return process.env.LOCAL_MODE === '1' || process.env.NEXT_PUBLIC_LOCAL_MODE === '1';
  };
  
  export const canUseLocalModel = () => isLocalMode();
  
