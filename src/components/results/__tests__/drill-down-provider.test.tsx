import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  drillDownReducer,
  DrillDownProvider,
  useDrillDown,
  type DrillDownState,
  type DrillDownAction,
} from "../drill-down-provider";

const initialState: DrillDownState = {
  type: null,
  value: null,
  nodeIndex: null,
};

describe("drillDownReducer", () => {
  it("SELECT_COMPANY sets company selection", () => {
    const action: DrillDownAction = {
      type: "SELECT_COMPANY",
      company: "Google",
      nodeIndex: 3,
    };
    const result = drillDownReducer(initialState, action);
    expect(result).toEqual({
      type: "company",
      value: "Google",
      nodeIndex: 3,
    });
  });

  it("SELECT_ROLE sets role selection", () => {
    const action: DrillDownAction = {
      type: "SELECT_ROLE",
      role: "Engineer",
      nodeIndex: 7,
    };
    const result = drillDownReducer(initialState, action);
    expect(result).toEqual({
      type: "role",
      value: "Engineer",
      nodeIndex: 7,
    });
  });

  it("CLEAR resets state", () => {
    const currentState: DrillDownState = {
      type: "company",
      value: "Google",
      nodeIndex: 3,
    };
    const result = drillDownReducer(currentState, { type: "CLEAR" });
    expect(result).toEqual(initialState);
  });

  it("SELECT_COMPANY with same value toggles off (CLEAR)", () => {
    const currentState: DrillDownState = {
      type: "company",
      value: "Google",
      nodeIndex: 3,
    };
    const action: DrillDownAction = {
      type: "SELECT_COMPANY",
      company: "Google",
      nodeIndex: 3,
    };
    const result = drillDownReducer(currentState, action);
    expect(result).toEqual(initialState);
  });

  it("SELECT_ROLE with same value toggles off (CLEAR)", () => {
    const currentState: DrillDownState = {
      type: "role",
      value: "Engineer",
      nodeIndex: 7,
    };
    const action: DrillDownAction = {
      type: "SELECT_ROLE",
      role: "Engineer",
      nodeIndex: 7,
    };
    const result = drillDownReducer(currentState, action);
    expect(result).toEqual(initialState);
  });

  it("SELECT_COMPANY with different value changes selection", () => {
    const currentState: DrillDownState = {
      type: "company",
      value: "Google",
      nodeIndex: 3,
    };
    const action: DrillDownAction = {
      type: "SELECT_COMPANY",
      company: "Meta",
      nodeIndex: 5,
    };
    const result = drillDownReducer(currentState, action);
    expect(result).toEqual({
      type: "company",
      value: "Meta",
      nodeIndex: 5,
    });
  });

  it("SELECT_ROLE with different value changes selection", () => {
    const currentState: DrillDownState = {
      type: "role",
      value: "Engineer",
      nodeIndex: 7,
    };
    const action: DrillDownAction = {
      type: "SELECT_ROLE",
      role: "Manager",
      nodeIndex: 9,
    };
    const result = drillDownReducer(currentState, action);
    expect(result).toEqual({
      type: "role",
      value: "Manager",
      nodeIndex: 9,
    });
  });

  it("SELECT_COMPANY with null nodeIndex sets state correctly", () => {
    const action: DrillDownAction = {
      type: "SELECT_COMPANY",
      company: "Google",
      nodeIndex: null,
    };
    const result = drillDownReducer(initialState, action);
    expect(result).toEqual({
      type: "company",
      value: "Google",
      nodeIndex: null,
    });
  });

  it("SELECT_COMPANY with null nodeIndex toggles off when same company selected", () => {
    const currentState: DrillDownState = {
      type: "company",
      value: "Google",
      nodeIndex: null,
    };
    const action: DrillDownAction = {
      type: "SELECT_COMPANY",
      company: "Google",
      nodeIndex: null,
    };
    const result = drillDownReducer(currentState, action);
    expect(result).toEqual(initialState);
  });

  it("SELECT_COMPANY with null nodeIndex switches to different company", () => {
    const currentState: DrillDownState = {
      type: "company",
      value: "Google",
      nodeIndex: null,
    };
    const action: DrillDownAction = {
      type: "SELECT_COMPANY",
      company: "Meta",
      nodeIndex: null,
    };
    const result = drillDownReducer(currentState, action);
    expect(result).toEqual({
      type: "company",
      value: "Meta",
      nodeIndex: null,
    });
  });
});

describe("useDrillDown", () => {
  it("returns state and dispatch when used inside DrillDownProvider", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DrillDownProvider>{children}</DrillDownProvider>
    );

    const { result } = renderHook(() => useDrillDown(), { wrapper });

    expect(result.current.state).toEqual(initialState);
    expect(typeof result.current.dispatch).toBe("function");
  });

  it("throws when used outside DrillDownProvider", () => {
    expect(() => {
      renderHook(() => useDrillDown());
    }).toThrow();
  });

  it("dispatches actions correctly through the provider", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DrillDownProvider>{children}</DrillDownProvider>
    );

    const { result } = renderHook(() => useDrillDown(), { wrapper });

    act(() => {
      result.current.dispatch({
        type: "SELECT_COMPANY",
        company: "Google",
        nodeIndex: 3,
      });
    });

    expect(result.current.state).toEqual({
      type: "company",
      value: "Google",
      nodeIndex: 3,
    });

    // Toggle off
    act(() => {
      result.current.dispatch({
        type: "SELECT_COMPANY",
        company: "Google",
        nodeIndex: 3,
      });
    });

    expect(result.current.state).toEqual(initialState);
  });
});
