"use client";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react";
import { toast } from "sonner";

const RequestContext = createContext(false);
export const useFormRequest = () => useContext(RequestContext);

/** Tracks the actual submit promise, including client validation and server errors. */
export function RequestForm({
  onSubmit,
  children,
  ...props
}: Omit<ComponentProps<"form">, "onSubmit"> & {
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void | Promise<unknown>;
}) {
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  return (
    <RequestContext.Provider value={pending}>
      <form
        {...props}
        aria-busy={pending}
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy.current) return;
          busy.current = true;
          setPending(true);
          try {
            await onSubmit?.(event);
          } catch {
            toast.error(
              "Permintaan belum berhasil. Periksa koneksi dan coba kembali.",
            );
          } finally {
            busy.current = false;
            setPending(false);
          }
        }}
      >
        {children}
      </form>
    </RequestContext.Provider>
  );
}
