"use client";

import * as React from "react";

// --- Types ---

type DialogType =
  | "add-domain"
  | "edit-domain"
  | "remove-domain"
  | "run-scan"
  | null;

interface DialogData {
  domain?: string;
}

interface DialogState {
  activeDialog: DialogType;
  dialogData: DialogData;
  formState: {
    domain: string;
    error: string;
  };
  isLoading: boolean;
}

interface DialogContextValue extends DialogState {
  openDialog: (type: NonNullable<DialogType>, data?: DialogData) => void;
  closeDialog: () => void;
  setFormField: (field: "domain", value: string) => void;
  setFormError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

// --- Context ---

const DialogContext = React.createContext<DialogContextValue | null>(null);

const initialState: DialogState = {
  activeDialog: null,
  dialogData: {},
  formState: {
    domain: "",
    error: "",
  },
  isLoading: false,
};

// --- Provider ---

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<DialogState>(initialState);

  const openDialog = React.useCallback(
    (type: NonNullable<DialogType>, data?: DialogData) => {
      setState({
        activeDialog: type,
        dialogData: data ?? {},
        formState: {
          domain: data?.domain ?? "",
          error: "",
        },
        isLoading: false,
      });
    },
    []
  );

  const closeDialog = React.useCallback(() => {
    setState(initialState);
  }, []);

  const setFormField = React.useCallback(
    (field: "domain", value: string) => {
      setState((prev) => ({
        ...prev,
        formState: { ...prev.formState, [field]: value, error: "" },
      }));
    },
    []
  );

  const setFormError = React.useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      formState: { ...prev.formState, error },
    }));
  }, []);

  const setLoading = React.useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const value = React.useMemo(
    () => ({
      ...state,
      openDialog,
      closeDialog,
      setFormField,
      setFormError,
      setLoading,
    }),
    [state, openDialog, closeDialog, setFormField, setFormError, setLoading]
  );

  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
}

// --- Hook ---

export function useDialogs() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("useDialogs must be used within a DialogProvider");
  }
  return context;
}

// --- Domain Validation Utilities ---

/**
 * Normalizes a raw domain input:
 * - trims whitespace
 * - strips protocol (http:// or https://)
 * - strips www. prefix
 * - strips trailing slash
 */
export function normalizeDomain(raw: string): string {
  let domain = raw.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, "");
  domain = domain.replace(/^www\./, "");
  domain = domain.replace(/\/+$/, "");
  return domain;
}

/**
 * Validates a normalized domain string.
 * Returns an error message string, or empty string if valid.
 */
export function validateDomain(domain: string): string {
  if (!domain) {
    return "Domain is required.";
  }

  // Basic domain format: at least one label, a dot, and a TLD of 2+ chars
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return "Enter a valid domain (e.g. company.com).";
  }

  return "";
}
