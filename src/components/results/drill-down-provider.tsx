"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";

export type SelectionType = "company" | "role" | null;

export interface DrillDownState {
  type: SelectionType;
  value: string | null;
  nodeIndex: number | null;
}

export type DrillDownAction =
  | { type: "SELECT_COMPANY"; company: string; nodeIndex: number | null }
  | { type: "SELECT_ROLE"; role: string; nodeIndex: number | null }
  | { type: "CLEAR" };

const INITIAL_STATE: DrillDownState = {
  type: null,
  value: null,
  nodeIndex: null,
};

export function drillDownReducer(
  state: DrillDownState,
  action: DrillDownAction,
): DrillDownState {
  switch (action.type) {
    case "SELECT_COMPANY": {
      // Toggle off if same company already selected
      if (state.type === "company" && state.value === action.company) {
        return INITIAL_STATE;
      }
      return { type: "company", value: action.company, nodeIndex: action.nodeIndex };
    }
    case "SELECT_ROLE": {
      // Toggle off if same role already selected
      if (state.type === "role" && state.value === action.role) {
        return INITIAL_STATE;
      }
      return { type: "role", value: action.role, nodeIndex: action.nodeIndex };
    }
    case "CLEAR":
      return INITIAL_STATE;
    default:
      return state;
  }
}

const DrillDownContext = createContext<{
  state: DrillDownState;
  dispatch: React.Dispatch<DrillDownAction>;
} | null>(null);

export function DrillDownProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(drillDownReducer, INITIAL_STATE);

  return (
    <DrillDownContext.Provider value={{ state, dispatch }}>
      {children}
    </DrillDownContext.Provider>
  );
}

export function useDrillDown() {
  const context = useContext(DrillDownContext);
  if (context === null) {
    throw new Error("useDrillDown must be used within a DrillDownProvider");
  }
  return context;
}
