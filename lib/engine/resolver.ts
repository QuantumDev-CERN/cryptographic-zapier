/**
 * Workflow Execution Resolver
 * 
 * Main execution engine that orchestrates workflow execution.
 * Takes node schemas, resolves variables, executes via provider adapters,
 * and produces predictable JSON output.
 */

import type {
  Credentials,
  ExecutionContext,
  ExecutionError,
  NodeExecutionResult,
  NodeSchema,
  OperationId,
  ProviderId,
  WorkflowExecutionResult,
} from "./types";
import { getProviderAdapter } from "./adapters";
import { interpolateConfig, validateVariables } from "./interpolation";
import { createError, normalizeError } from "./rate-limit";
import { getCredentialManager, createApiKeyCredentials } from "./credentials";
import { env } from "../env";

// ============================================================================
// Types
// ============================================================================

/**
 * Workflow node as stored in the database
 */
export type WorkflowNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

/**
 * Workflow edge as stored in the database
 */
export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
};

/**
 * Workflow content structure
 */
export type WorkflowContent = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

/**
 * Node type to schema mapping
 */
export type NodeTypeMapping = {
  type: string;
  provider: ProviderId;
  operation: OperationId;
};

// ============================================================================
// Node Type Registry
// ============================================================================

/**
 * Maps UI node types to provider operations
 */
const nodeTypeRegistry: Map<string, NodeTypeMapping> = new Map([
  // Trigger nodes
  ["trigger", { type: "trigger", provider: "webhook", operation: "trigger" }],
  ["webhook", { type: "webhook", provider: "webhook", operation: "trigger" }],
  
  // OpenAI nodes
  ["openai", { type: "openai", provider: "openai", operation: "chat.completion" }],
  ["openaiChat", { type: "openaiChat", provider: "openai", operation: "chat.completion" }],
  ["openaiImage", { type: "openaiImage", provider: "openai", operation: "images.generate" }],
  ["openaiEmbedding", { type: "openaiEmbedding", provider: "openai", operation: "embeddings.create" }],
  
  // Google nodes
  ["gmail", { type: "gmail", provider: "google", operation: "gmail.send" }],
  ["gmailSend", { type: "gmailSend", provider: "google", operation: "gmail.send" }],
  ["gmailRead", { type: "gmailRead", provider: "google", operation: "gmail.read" }],
  ["googleSheets", { type: "googleSheets", provider: "google", operation: "sheets.appendRow" }],
  ["sheetsAppend", { type: "sheetsAppend", provider: "google", operation: "sheets.appendRow" }],
  ["sheetsUpdate", { type: "sheetsUpdate", provider: "google", operation: "sheets.updateRow" }],
  ["sheetsFind", { type: "sheetsFind", provider: "google", operation: "sheets.findRow" }],
  ["sheetsGet", { type: "sheetsGet", provider: "google", operation: "sheets.getRows" }],
  
  // Email nodes (Resend)
  ["email", { type: "email", provider: "email", operation: "send" }],
  ["emailSend", { type: "emailSend", provider: "email", operation: "send" }],
  
  // Transform nodes
  ["jsonParse", { type: "jsonParse", provider: "transform", operation: "json.parse" }],
  ["jsonStringify", { type: "jsonStringify", provider: "transform", operation: "json.stringify" }],
  ["template", { type: "template", provider: "transform", operation: "text.template" }],
  ["filter", { type: "filter", provider: "transform", operation: "array.filter" }],
  ["map", { type: "map", provider: "transform", operation: "array.map" }],
  
  // Flow control nodes (Make.com style)
  ["flow", { type: "flow", provider: "flow", operation: "flow.iterate" }],
  ["flowIterator", { type: "flowIterator", provider: "flow", operation: "flow.iterate" }],
  ["flowEndIterator", { type: "flowEndIterator", provider: "flow", operation: "flow.endIterate" }],
  ["flowAggregator", { type: "flowAggregator", provider: "flow", operation: "flow.aggregate" }],
  ["flowRouter", { type: "flowRouter", provider: "flow", operation: "flow.route" }],
  ["flowFilter", { type: "flowFilter", provider: "flow", operation: "flow.filter" }],
  
  // HTTP nodes
  ["httpRequest", { type: "httpRequest", provider: "webhook", operation: "request" }],
]);

/**
 * Get node type mapping
 */
export function getNodeTypeMapping(nodeType: string): NodeTypeMapping | null {
  return nodeTypeRegistry.get(nodeType) || null;
}

/**
 * Register a custom node type
 */
export function registerNodeType(mapping: NodeTypeMapping): void {
  nodeTypeRegistry.set(mapping.type, mapping);
}

// ============================================================================
// Execution Resolver
// ============================================================================

export class WorkflowResolver {
  private userId: string;
  private workflowId: string;
  
  constructor(userId: string, workflowId: string) {
    this.userId = userId;
    this.workflowId = workflowId;
  }
  
  /**
   * Execute a complete workflow
   */
  async execute(
    content: WorkflowContent,
    triggerInput: Record<string, unknown>
  ): Promise<WorkflowExecutionResult> {
    const executionId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const nodeResults: Array<{ nodeId: string; nodeType: string; result: NodeExecutionResult }> = [];
    
    // Initialize execution context
    const context: ExecutionContext = {
      workflowId: this.workflowId,
      executionId,
      userId: this.userId,
      triggerInput,
      nodeOutputs: new Map(),
      variables: {},
      credentials: new Map(),
    };
    
    try {
      // Build execution order
      const executionOrder = this.buildExecutionOrder(content.nodes, content.edges);
      
      if (executionOrder.length === 0) {
        return {
          success: false,
          executionId,
          workflowId: this.workflowId,
          startedAt,
          completedAt: new Date().toISOString(),
          duration: 0,
          error: createError("EMPTY_WORKFLOW", "No executable nodes in workflow"),
          nodeResults,
        };
      }
      
      // Load credentials for all providers in the workflow
      await this.loadWorkflowCredentials(executionOrder, context);
      
      // Build edge map for finding downstream nodes
      const edgeMap = this.buildEdgeMap(content.edges);
      
      // Execute nodes in order (with iteration support)
      let i = 0;
      while (i < executionOrder.length) {
        const node = executionOrder[i];
        const result = await this.executeNode(node, context);
        
        nodeResults.push({
          nodeId: node.id,
          nodeType: node.type,
          result,
        });
        
        // Store output for variable interpolation
        context.nodeOutputs.set(node.id, result);
        
        // Stop on error
        if (!result.success) {
          return {
            success: false,
            executionId,
            workflowId: this.workflowId,
            startedAt,
            completedAt: new Date().toISOString(),
            duration: Date.now() - new Date(startedAt).getTime(),
            error: result.error,
            nodeResults,
          };
        }
        
        // Check for iterator - execute downstream nodes for each item
        if (result.output && (result.output as any)._flowType === "iterator") {
          const iterationData = (result.output as any)._iterationData;
          const downstreamNodeIds = edgeMap.get(node.id) || [];
          
          // Find downstream nodes until we hit an aggregator or end
          const nodesToIterate = this.getNodesUntilAggregator(
            downstreamNodeIds,
            executionOrder,
            edgeMap
          );
          
          if (nodesToIterate.length > 0 && iterationData?.items?.length > 0) {
            // Execute the downstream nodes for EACH item
            const aggregatedResults: unknown[] = [];
            
            for (let itemIndex = 0; itemIndex < iterationData.items.length; itemIndex++) {
              const item = iterationData.items[itemIndex];
              
              // Set flow context for this iteration
              (context as any)._flowContext = {
                item,
                index: itemIndex,
                totalItems: iterationData.items.length,
                isLastItem: itemIndex === iterationData.items.length - 1,
                currentItem: item,
              };
              
              // Also set in variables for {{flow.item}} interpolation
              context.variables = {
                ...context.variables,
                flow: {
                  item,
                  index: itemIndex,
                  totalItems: iterationData.items.length,
                },
              };
              
              // Execute each downstream node for this item
              for (const iterNode of nodesToIterate) {
                const iterResult = await this.executeNode(iterNode, context);
                
                nodeResults.push({
                  nodeId: iterNode.id,
                  nodeType: iterNode.type,
                  result: iterResult,
                });
                
                context.nodeOutputs.set(iterNode.id, iterResult);
                
                // Check if this is an aggregator - collect results
                if (iterResult.output && (iterResult.output as any)._flowType === "aggregator") {
                  if ((iterResult.output as any)._aggregationComplete) {
                    aggregatedResults.push((iterResult.output as any).data);
                  }
                }
                
                // Stop iteration branch on error
                if (!iterResult.success) {
                  return {
                    success: false,
                    executionId,
                    workflowId: this.workflowId,
                    startedAt,
                    completedAt: new Date().toISOString(),
                    duration: Date.now() - new Date(startedAt).getTime(),
                    error: iterResult.error,
                    nodeResults,
                  };
                }
                
                // Check for filter that blocks execution
                if ((iterResult.output as any)?._filterPassed === false) {
                  break; // Skip rest of this iteration
                }
              }
            }
            
            // Clear flow context after iteration
            delete (context as any)._flowContext;
            
            // Skip the nodes we just iterated over
            const iteratedNodeIds = new Set(nodesToIterate.map(n => n.id));
            while (i + 1 < executionOrder.length && iteratedNodeIds.has(executionOrder[i + 1].id)) {
              i++;
            }
          }
        }
        
        // Check for filter that stops execution
        if ((result.output as any)?._filterPassed === false && (result.output as any)?._stopExecution) {
          // Filter blocked - stop this execution path
          break;
        }
        
        i++;
      }
      
      // Get final output from last node
      const lastNodeId = executionOrder[executionOrder.length - 1].id;
      const finalOutput = context.nodeOutputs.get(lastNodeId)?.output || {};
      
      return {
        success: true,
        executionId,
        workflowId: this.workflowId,
        startedAt,
        completedAt: new Date().toISOString(),
        duration: Date.now() - new Date(startedAt).getTime(),
        output: finalOutput,
        nodeResults,
      };
    } catch (error) {
      return {
        success: false,
        executionId,
        workflowId: this.workflowId,
        startedAt,
        completedAt: new Date().toISOString(),
        duration: Date.now() - new Date(startedAt).getTime(),
        error: normalizeError(error),
        nodeResults,
      };
    }
  }
  
  /**
   * Build edge map for quick lookup of downstream nodes
   */
  private buildEdgeMap(edges: WorkflowEdge[]): Map<string, string[]> {
    const edgeMap = new Map<string, string[]>();
    for (const edge of edges) {
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, []);
      }
      edgeMap.get(edge.source)!.push(edge.target);
    }
    return edgeMap;
  }
  
  /**
   * Get nodes between iterator start and end (or aggregator)
   */
  private getNodesUntilAggregator(
    startNodeIds: string[],
    executionOrder: WorkflowNode[],
    edgeMap: Map<string, string[]>
  ): WorkflowNode[] {
    const result: WorkflowNode[] = [];
    const visited = new Set<string>();
    const queue = [...startNodeIds];
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      const node = executionOrder.find(n => n.id === nodeId);
      if (!node) continue;
      
      result.push(node);
      
      // Check the operation for this node
      const mapping = getNodeTypeMapping(node.type);
      
      // Also check node.data.mode for flow nodes
      const nodeMode = (node.data as any)?.mode;
      const operation = mapping?.operation;
      
      // Stop at endIterator or aggregator - include them but don't go further
      if (operation === "flow.endIterate" || 
          operation === "flow.aggregate" ||
          nodeMode === "endIterator" ||
          nodeMode === "aggregator") {
        continue; // Include this node but don't traverse past it
      }
      
      // Add downstream nodes
      const downstream = edgeMap.get(nodeId) || [];
      for (const downId of downstream) {
        if (!visited.has(downId)) {
          queue.push(downId);
        }
      }
    }
    
    // Sort by execution order
    const orderIndex = new Map(executionOrder.map((n, i) => [n.id, i]));
    result.sort((a, b) => (orderIndex.get(a.id) || 0) - (orderIndex.get(b.id) || 0));
    
    return result;
  }
  
  /**
   * Execute a single node
   */
  private async executeNode(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const startedAt = new Date().toISOString();
    
    try {
      // Get node type mapping
      let mapping = getNodeTypeMapping(node.type);
      
      if (!mapping) {
        // Skip unknown node types (like "drop" placeholder nodes)
        return {
          success: true,
          output: {},
          metadata: {
            startedAt,
            completedAt: new Date().toISOString(),
            duration: 0,
            retryCount: 0,
          },
        };
      }
      
      // For flow nodes, check the mode to determine the actual operation
      if (mapping.provider === "flow" && node.data.mode) {
        const mode = node.data.mode as string;
        const operationMap: Record<string, string> = {
          iterator: "flow.iterate",
          endIterator: "flow.endIterate",
          aggregator: "flow.aggregate",
          router: "flow.route",
          filter: "flow.filter",
        };
        if (operationMap[mode]) {
          mapping = { ...mapping, operation: operationMap[mode] as any };
        }
      }
      
      // Get provider adapter
      const adapter = getProviderAdapter(mapping.provider);
      
      // Interpolate variables in node config
      const interpolatedConfig = interpolateConfig(node.data, context);
      
      // Get credentials for provider
      const credentials = context.credentials.get(mapping.provider);
      
      if (!credentials) {
        throw createError(
          "MISSING_CREDENTIALS",
          `No credentials found for provider: ${mapping.provider}`,
          { provider: mapping.provider, retryable: false }
        );
      }
      
      // Execute via provider adapter
      return adapter.execute(
        mapping.operation,
        interpolatedConfig,
        credentials,
        context
      );
    } catch (error) {
      return {
        success: false,
        output: {},
        error: normalizeError(error),
        metadata: {
          startedAt,
          completedAt: new Date().toISOString(),
          duration: Date.now() - new Date(startedAt).getTime(),
          retryCount: 0,
        },
      };
    }
  }
  
  /**
   * Load credentials for all providers used in the workflow
   */
  private async loadWorkflowCredentials(
    nodes: WorkflowNode[],
    context: ExecutionContext
  ): Promise<void> {
    // Get unique providers
    const providers = new Set<ProviderId>();
    
    for (const node of nodes) {
      const mapping = getNodeTypeMapping(node.type);
      if (mapping) {
        providers.add(mapping.provider);
      }
    }
    
    // Load credentials for each provider
    const credentialManager = getCredentialManager();
    
    for (const provider of providers) {
      // First try to get from database
      let credentials = await credentialManager.getCredentials(this.userId, provider);
      
      // Fall back to environment variables
      if (!credentials) {
        credentials = this.getEnvCredentials(provider);
      }
      
      if (credentials) {
        context.credentials.set(provider, credentials);
      }
    }
  }
  
  /**
   * Get credentials from environment variables (fallback)
   */
  private getEnvCredentials(provider: ProviderId): Credentials | null {
    switch (provider) {
      case "openai":
        // Use OpenAI API key from env only
        if (env.OPENAI_API_KEY) {
          return createApiKeyCredentials(env.OPENAI_API_KEY);
        }
        break;
      
      case "email":
        if (env.RESEND_TOKEN) {
          return createApiKeyCredentials(env.RESEND_TOKEN);
        }
        break;
      
      case "google":
        // Check for service account credentials in env
        const googleCreds = process.env.GOOGLE_SHEETS_CREDENTIALS;
        if (googleCreds) {
          try {
            const parsed = JSON.parse(googleCreds);
            return {
              type: "service_account",
              clientEmail: parsed.client_email,
              privateKey: parsed.private_key,
              projectId: parsed.project_id,
            };
          } catch {
            // Invalid JSON, ignore
          }
        }
        break;
      
      case "webhook":
      case "transform":
      case "flow":
        // These don't require credentials - they're local operations
        return createApiKeyCredentials("none");
    }
    
    return null;
  }
  
  /**
   * Build execution order from nodes and edges (topological sort)
   */
  private buildExecutionOrder(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): WorkflowNode[] {
    const order: WorkflowNode[] = [];
    const visited = new Set<string>();
    
    // Find trigger node(s)
    const triggerNodes = nodes.filter(n => 
      n.type === "trigger" || n.type === "webhook"
    );
    
    if (triggerNodes.length === 0) {
      // No trigger, start from nodes with no incoming edges
      const hasIncoming = new Set(edges.map(e => e.target));
      const startNodes = nodes.filter(n => !hasIncoming.has(n.id) && n.type !== "drop");
      
      if (startNodes.length === 0 && nodes.length > 0) {
        // Just take the first non-drop node
        const firstNode = nodes.find(n => n.type !== "drop");
        if (firstNode) startNodes.push(firstNode);
      }
      
      triggerNodes.push(...startNodes);
    }
    
    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    for (const edge of edges) {
      if (!adjacency.has(edge.source)) {
        adjacency.set(edge.source, []);
      }
      adjacency.get(edge.source)!.push(edge.target);
    }
    
    // BFS from trigger nodes
    const queue = triggerNodes.map(n => n.id);
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      const node = nodes.find(n => n.id === nodeId);
      if (node && node.type !== "drop") {
        order.push(node);
      }
      
      const targets = adjacency.get(nodeId) || [];
      for (const targetId of targets) {
        if (!visited.has(targetId)) {
          queue.push(targetId);
        }
      }
    }
    
    return order;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a workflow resolver for a user
 */
export function createWorkflowResolver(
  userId: string,
  workflowId: string
): WorkflowResolver {
  return new WorkflowResolver(userId, workflowId);
}

/**
 * Execute a workflow (convenience function)
 */
export async function executeWorkflow(
  userId: string,
  workflowId: string,
  content: WorkflowContent,
  triggerInput: Record<string, unknown>
): Promise<WorkflowExecutionResult> {
  const resolver = createWorkflowResolver(userId, workflowId);
  return resolver.execute(content, triggerInput);
}
