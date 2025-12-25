/**
 * Node Outputs Context
 * 
 * Stores execution results from tested/run nodes for easy reference
 */

"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type NodeOutput = {
  nodeId: string;
  nodeType: string;
  timestamp: string;
  output: unknown;
};

type NodeOutputsContextType = {
  outputs: NodeOutput[];
  addOutput: (nodeId: string, nodeType: string, output: unknown) => void;
  clearOutputs: () => void;
  getOutput: (nodeId: string) => NodeOutput | undefined;
};

const NodeOutputsContext = createContext<NodeOutputsContextType | undefined>(undefined);

export const NodeOutputsProvider = ({ children }: { children: ReactNode }) => {
  const [outputs, setOutputs] = useState<NodeOutput[]>([]);

  const addOutput = (nodeId: string, nodeType: string, output: unknown) => {
    setOutputs((prev) => {
      // Remove existing output for this node
      const filtered = prev.filter((o) => o.nodeId !== nodeId);
      // Add new output at the beginning
      return [
        {
          nodeId,
          nodeType,
          timestamp: new Date().toISOString(),
          output,
        },
        ...filtered,
      ];
    });
  };

  const clearOutputs = () => {
    setOutputs([]);
  };

  const getOutput = (nodeId: string) => {
    return outputs.find((o) => o.nodeId === nodeId);
  };

  return (
    <NodeOutputsContext.Provider value={{ outputs, addOutput, clearOutputs, getOutput }}>
      {children}
    </NodeOutputsContext.Provider>
  );
};

export const useNodeOutputs = () => {
  const context = useContext(NodeOutputsContext);
  if (!context) {
    throw new Error("useNodeOutputs must be used within NodeOutputsProvider");
  }
  return context;
};
