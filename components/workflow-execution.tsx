/**
 * Workflow Execution Controls
 * 
 * Client component for running workflows and testing individual nodes.
 */

"use client";

import { useState } from "react";
import { Panel, useReactFlow, useStore } from "@xyflow/react";
import { 
  PlayIcon, 
  Loader2Icon, 
  CheckCircleIcon, 
  XCircleIcon,
  ChevronRightIcon,
  XIcon
} from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { ScrollArea } from "./ui/scroll-area";

type ExecutionLog = {
  nodeId: string;
  nodeType: string;
  status: "success" | "error" | "running";
  input?: unknown;
  output?: unknown;
  error?: string;
  timestamp: string;
};

type ExecutionResult = {
  success: boolean;
  executionId?: string;
  logs?: ExecutionLog[];
  error?: string;
  result?: unknown;
};

export const WorkflowExecutionControls = ({ workflowId }: { workflowId: string }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const { getNodes, getEdges } = useReactFlow();

  const handleRunWorkflow = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const nodes = getNodes();
      const edges = getEdges();

      const response = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          nodes,
          edges,
        }),
      });

      const data = await response.json();
      setResult(data);
      setShowLogs(true);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Failed to execute workflow",
      });
      setShowLogs(true);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <>
      <Panel
        className="m-4 flex items-center gap-2 rounded-full border bg-card/90 p-1 drop-shadow-xs backdrop-blur-sm"
        position="top-right"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-full gap-2 px-4"
              onClick={handleRunWorkflow}
              disabled={isRunning}
              variant={result?.success ? "outline" : "default"}
              size="sm"
            >
              {isRunning ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : result?.success ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  Run Again
                </>
              ) : result?.error ? (
                <>
                  <XCircleIcon className="h-4 w-4 text-red-600" />
                  Retry
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4" />
                  Run Workflow
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Execute the entire workflow</TooltipContent>
        </Tooltip>

        {result && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => setShowLogs(true)}
          >
            View Logs
          </Button>
        )}
      </Panel>

      {/* Execution Logs Sheet */}
      <Sheet open={showLogs} onOpenChange={setShowLogs}>
        <SheetContent className="w-100 sm:w-135">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Execution Results
              {result?.success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-600" />
              )}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-4">
            {result?.error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 mb-4">
                <p className="text-red-600 font-medium">Error</p>
                <p className="text-sm text-muted-foreground">{result.error}</p>
              </div>
            )}

            {result?.logs?.map((log, index) => (
              <div
                key={`${log.nodeId}-${index}`}
                className="border-b border-border py-3 last:border-b-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  {log.status === "success" ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  ) : log.status === "running" ? (
                    <Loader2Icon className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium text-sm">{log.nodeType}</span>
                  <span className="text-xs text-muted-foreground">
                    ({log.nodeId})
                  </span>
                </div>

                {log.input !== undefined && log.input !== null && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Input
                    </summary>
                    <pre className="bg-muted rounded p-2 mt-1 overflow-x-auto">
                      {String(JSON.stringify(log.input, null, 2))}
                    </pre>
                  </details>
                )}

                {log.output !== undefined && log.output !== null && (
                  <details className="text-xs mt-1">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Output
                    </summary>
                    <pre className="bg-muted rounded p-2 mt-1 overflow-x-auto">
                      {String(JSON.stringify(log.output, null, 2))}
                    </pre>
                  </details>
                )}

                {log.error && (
                  <div className="mt-1 text-xs text-red-600 bg-red-500/10 rounded p-2">
                    {log.error}
                  </div>
                )}

                <div className="text-[10px] text-muted-foreground mt-1">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}

            {result?.result !== undefined && result?.result !== null && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="font-medium text-green-600 mb-2">Final Result</p>
                <pre className="text-xs overflow-x-auto">
                  {String(JSON.stringify(result.result, null, 2))}
                </pre>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};
