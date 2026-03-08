import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ImpersonatedUser {
  userId: string;
  email: string;
  displayName: string;
}

interface ImpersonationContextType {
  impersonating: ImpersonatedUser | null;
  startImpersonating: (user: ImpersonatedUser) => void;
  stopImpersonating: () => void;
  /** Returns impersonated user_id if active, otherwise null */
  effectiveUserId: string | null;
}

const ImpersonationContext = createContext<ImpersonationContextType>({
  impersonating: null,
  startImpersonating: () => {},
  stopImpersonating: () => {},
  effectiveUserId: null,
});

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonating, setImpersonating] = useState<ImpersonatedUser | null>(null);

  const startImpersonating = useCallback((user: ImpersonatedUser) => {
    setImpersonating(user);
  }, []);

  const stopImpersonating = useCallback(() => {
    setImpersonating(null);
  }, []);

  return (
    <ImpersonationContext.Provider
      value={{
        impersonating,
        startImpersonating,
        stopImpersonating,
        effectiveUserId: impersonating?.userId ?? null,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export const useImpersonation = () => useContext(ImpersonationContext);
