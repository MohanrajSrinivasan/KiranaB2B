import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey, signal }) => {
        const res = await fetch(queryKey[0], {
          signal,
          credentials: "include",
        });
        
        if (!res.ok) {
          if (res.status >= 500) {
            throw new Error(`Server Error: ${res.status}`);
          }
          
          if (res.status === 401) {
            throw new Error("Unauthorized");
          }
          
          const message = await res.text();
          throw new Error(message || `HTTP Error: ${res.status}`);
        }
        
        return res.json();
      },
    },
  },
});

export async function apiRequest(method, url, data) {
  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const res = await fetch(url, config);
  
  if (!res.ok) {
    if (res.status >= 500) {
      throw new Error(`Server Error: ${res.status}`);
    }
    
    if (res.status === 401) {
      throw new Error("Unauthorized");
    }
    
    const message = await res.text();
    throw new Error(message || `HTTP Error: ${res.status}`);
  }
  
  return res;
}

export { queryClient };