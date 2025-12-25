/**
 * Node Schema Definitions
 * 
 * Declarative schemas for all node types. These define:
 * - UI structure (inputs, labels, types)
 * - Provider/operation mapping
 * - Output structure
 * 
 * NO EXECUTION LOGIC HERE - all execution happens in provider adapters.
 */

import type { NodeSchema } from "../engine/types";

// ============================================================================
// Trigger Nodes
// ============================================================================

export const triggerSchema: NodeSchema = {
  type: "trigger",
  provider: "webhook",
  operation: "trigger",
  name: "Webhook Trigger",
  description: "Starts the workflow when a webhook is received",
  icon: "Zap",
  color: "yellow",
  category: "trigger",
  inputs: [
    {
      key: "webhookPath",
      label: "Webhook Path",
      type: "string",
      required: false,
      placeholder: "/api/webhook/my-workflow",
      description: "Custom path for this webhook (auto-generated if empty)",
    },
  ],
  outputs: [
    { key: "body", label: "Request Body", type: "object" },
    { key: "headers", label: "Headers", type: "object" },
    { key: "query", label: "Query Parameters", type: "object" },
    { key: "triggeredAt", label: "Triggered At", type: "string" },
  ],
};

// ============================================================================
// OpenAI Nodes
// ============================================================================

export const openaiChatSchema: NodeSchema = {
  type: "openai",
  provider: "openai",
  operation: "chat.completion",
  name: "OpenAI Chat",
  description: "Generate text using GPT models",
  icon: "BrainCircuit",
  color: "emerald",
  category: "action",
  inputs: [
    {
      key: "model",
      label: "Model",
      type: "select",
      required: true,
      default: "gpt-4o-mini",
      options: [
        { value: "gpt-4o", label: "GPT-4o (Most Capable)" },
        { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast & Cheap)" },
        { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
        { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Legacy)" },
      ],
    },
    {
      key: "systemPrompt",
      label: "System Prompt",
      type: "textarea",
      required: false,
      placeholder: "You are a helpful assistant...",
      description: "Sets the behavior of the AI",
      supportsVariables: true,
    },
    {
      key: "prompt",
      label: "User Prompt",
      type: "textarea",
      required: true,
      placeholder: "Summarize this: {{previous.output}}",
      description: "The main instruction or question",
      supportsVariables: true,
    },
    {
      key: "maxTokens",
      label: "Max Tokens",
      type: "number",
      required: false,
      default: 1000,
      description: "Maximum length of the response",
    },
    {
      key: "temperature",
      label: "Temperature",
      type: "number",
      required: false,
      default: 0.7,
      description: "Creativity level (0-2). Lower = more deterministic",
    },
  ],
  outputs: [
    { key: "content", label: "Response Content", type: "string" },
    { key: "output", label: "Output (alias)", type: "string" },
    { key: "usage", label: "Token Usage", type: "object" },
    { key: "finishReason", label: "Finish Reason", type: "string" },
  ],
};

export const openaiImageSchema: NodeSchema = {
  type: "openaiImage",
  provider: "openai",
  operation: "images.generate",
  name: "OpenAI Image",
  description: "Generate images using DALL-E",
  icon: "Image",
  color: "purple",
  category: "action",
  inputs: [
    {
      key: "prompt",
      label: "Image Description",
      type: "textarea",
      required: true,
      placeholder: "A serene landscape with mountains at sunset",
      supportsVariables: true,
    },
    {
      key: "model",
      label: "Model",
      type: "select",
      required: false,
      default: "dall-e-3",
      options: [
        { value: "dall-e-3", label: "DALL-E 3 (Best Quality)" },
        { value: "dall-e-2", label: "DALL-E 2 (Faster)" },
      ],
    },
    {
      key: "size",
      label: "Size",
      type: "select",
      required: false,
      default: "1024x1024",
      options: [
        { value: "1024x1024", label: "Square (1024x1024)" },
        { value: "1792x1024", label: "Landscape (1792x1024)" },
        { value: "1024x1792", label: "Portrait (1024x1792)" },
      ],
    },
    {
      key: "quality",
      label: "Quality",
      type: "select",
      required: false,
      default: "standard",
      options: [
        { value: "standard", label: "Standard" },
        { value: "hd", label: "HD (More Detail)" },
      ],
    },
  ],
  outputs: [
    { key: "url", label: "Image URL", type: "string" },
    { key: "revisedPrompt", label: "Revised Prompt", type: "string" },
  ],
};

// ============================================================================
// Gmail Nodes
// ============================================================================

export const gmailSendSchema: NodeSchema = {
  type: "gmail",
  provider: "google",
  operation: "gmail.send",
  name: "Gmail Send",
  description: "Send an email via Gmail API",
  icon: "Mail",
  color: "red",
  category: "action",
  inputs: [
    {
      key: "to",
      label: "To",
      type: "string",
      required: true,
      placeholder: "recipient@example.com",
      description: "Recipient email address(es), comma-separated for multiple",
      supportsVariables: true,
    },
    {
      key: "subject",
      label: "Subject",
      type: "string",
      required: true,
      placeholder: "Email subject",
      supportsVariables: true,
    },
    {
      key: "body",
      label: "Body (Plain Text)",
      type: "textarea",
      required: true,
      placeholder: "Email body...",
      supportsVariables: true,
    },
    {
      key: "html",
      label: "Body (HTML)",
      type: "textarea",
      required: false,
      placeholder: "<h1>Hello!</h1>",
      description: "Optional HTML version of the email",
      supportsVariables: true,
    },
    {
      key: "cc",
      label: "CC",
      type: "string",
      required: false,
      placeholder: "cc@example.com",
      supportsVariables: true,
    },
    {
      key: "bcc",
      label: "BCC",
      type: "string",
      required: false,
      placeholder: "bcc@example.com",
      supportsVariables: true,
    },
  ],
  outputs: [
    { key: "messageId", label: "Message ID", type: "string" },
    { key: "threadId", label: "Thread ID", type: "string" },
    { key: "success", label: "Success", type: "boolean" },
  ],
};

// ============================================================================
// Google Sheets Nodes
// ============================================================================

export const sheetsAppendSchema: NodeSchema = {
  type: "googleSheets",
  provider: "google",
  operation: "sheets.appendRow",
  name: "Sheets: Append Row",
  description: "Append a new row to a Google Sheet",
  icon: "Table",
  color: "green",
  category: "action",
  inputs: [
    {
      key: "spreadsheetId",
      label: "Spreadsheet ID",
      type: "string",
      required: true,
      placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      description: "Found in the spreadsheet URL after /d/",
      supportsVariables: true,
    },
    {
      key: "sheetName",
      label: "Sheet Name",
      type: "string",
      required: false,
      default: "Sheet1",
      placeholder: "Sheet1",
      supportsVariables: true,
    },
    {
      key: "values",
      label: "Row Values",
      type: "json",
      required: true,
      placeholder: '["{{trigger.name}}", "{{previous.output}}", "{{trigger.email}}"]',
      description: "JSON array of values to append as a new row",
      supportsVariables: true,
    },
  ],
  outputs: [
    { key: "updatedRange", label: "Updated Range", type: "string" },
    { key: "updatedRows", label: "Updated Rows", type: "number" },
    { key: "appendedRow", label: "Appended Row", type: "array" },
    { key: "success", label: "Success", type: "boolean" },
  ],
};

export const sheetsFindSchema: NodeSchema = {
  type: "sheetsFind",
  provider: "google",
  operation: "sheets.findRow",
  name: "Sheets: Find Row",
  description: "Find rows matching a value in a column",
  icon: "Search",
  color: "green",
  category: "action",
  inputs: [
    {
      key: "spreadsheetId",
      label: "Spreadsheet ID",
      type: "string",
      required: true,
      supportsVariables: true,
    },
    {
      key: "sheetName",
      label: "Sheet Name",
      type: "string",
      required: false,
      default: "Sheet1",
      supportsVariables: true,
    },
    {
      key: "column",
      label: "Search Column",
      type: "string",
      required: true,
      placeholder: "A",
      description: "Column letter to search (A, B, C, etc.)",
    },
    {
      key: "value",
      label: "Search Value",
      type: "string",
      required: true,
      supportsVariables: true,
    },
    {
      key: "matchType",
      label: "Match Type",
      type: "select",
      required: false,
      default: "exact",
      options: [
        { value: "exact", label: "Exact Match" },
        { value: "contains", label: "Contains" },
        { value: "startsWith", label: "Starts With" },
      ],
    },
  ],
  outputs: [
    { key: "found", label: "Found", type: "boolean" },
    { key: "count", label: "Match Count", type: "number" },
    { key: "rows", label: "Matched Rows", type: "array" },
    { key: "firstMatch", label: "First Match", type: "object" },
  ],
};

export const sheetsUpdateSchema: NodeSchema = {
  type: "sheetsUpdate",
  provider: "google",
  operation: "sheets.updateRow",
  name: "Sheets: Update Row",
  description: "Update a specific row in a Google Sheet",
  icon: "Edit",
  color: "green",
  category: "action",
  inputs: [
    {
      key: "spreadsheetId",
      label: "Spreadsheet ID",
      type: "string",
      required: true,
      supportsVariables: true,
    },
    {
      key: "range",
      label: "Range",
      type: "string",
      required: true,
      placeholder: "Sheet1!A2:D2",
      description: "The range to update (e.g., Sheet1!A2:D2)",
      supportsVariables: true,
    },
    {
      key: "values",
      label: "Values",
      type: "json",
      required: true,
      placeholder: '["value1", "value2", "value3"]',
      supportsVariables: true,
    },
  ],
  outputs: [
    { key: "updatedRange", label: "Updated Range", type: "string" },
    { key: "updatedRows", label: "Updated Rows", type: "number" },
    { key: "success", label: "Success", type: "boolean" },
  ],
};

// ============================================================================
// Email Node (Resend)
// ============================================================================

export const emailSendSchema: NodeSchema = {
  type: "email",
  provider: "email",
  operation: "send",
  name: "Send Email",
  description: "Send an email via Resend API",
  icon: "Mail",
  color: "blue",
  category: "action",
  inputs: [
    {
      key: "to",
      label: "To",
      type: "string",
      required: true,
      placeholder: "recipient@example.com",
      supportsVariables: true,
    },
    {
      key: "subject",
      label: "Subject",
      type: "string",
      required: true,
      placeholder: "Email subject",
      supportsVariables: true,
    },
    {
      key: "text",
      label: "Body (Plain Text)",
      type: "textarea",
      required: false,
      placeholder: "Plain text email body...",
      supportsVariables: true,
    },
    {
      key: "html",
      label: "Body (HTML)",
      type: "textarea",
      required: false,
      placeholder: "<h1>Hello!</h1>",
      supportsVariables: true,
    },
    {
      key: "from",
      label: "From",
      type: "string",
      required: false,
      placeholder: "noreply@yourdomain.com",
      description: "Sender email (uses default if empty)",
      supportsVariables: true,
    },
  ],
  outputs: [
    { key: "messageId", label: "Message ID", type: "string" },
    { key: "success", label: "Success", type: "boolean" },
  ],
};

// ============================================================================
// HTTP Request Node
// ============================================================================

export const httpRequestSchema: NodeSchema = {
  type: "httpRequest",
  provider: "webhook",
  operation: "request",
  name: "HTTP Request",
  description: "Make an HTTP request to any API",
  icon: "Globe",
  color: "slate",
  category: "action",
  inputs: [
    {
      key: "url",
      label: "URL",
      type: "string",
      required: true,
      placeholder: "https://api.example.com/endpoint",
      supportsVariables: true,
    },
    {
      key: "method",
      label: "Method",
      type: "select",
      required: false,
      default: "GET",
      options: [
        { value: "GET", label: "GET" },
        { value: "POST", label: "POST" },
        { value: "PUT", label: "PUT" },
        { value: "PATCH", label: "PATCH" },
        { value: "DELETE", label: "DELETE" },
      ],
    },
    {
      key: "headers",
      label: "Headers",
      type: "json",
      required: false,
      placeholder: '{"Authorization": "Bearer {{env.API_KEY}}"}',
      supportsVariables: true,
    },
    {
      key: "body",
      label: "Body",
      type: "json",
      required: false,
      placeholder: '{"key": "value"}',
      supportsVariables: true,
    },
  ],
  outputs: [
    { key: "status", label: "Status Code", type: "number" },
    { key: "data", label: "Response Data", type: "object" },
    { key: "headers", label: "Response Headers", type: "object" },
    { key: "success", label: "Success", type: "boolean" },
  ],
};

// ============================================================================
// Transform Nodes
// ============================================================================

export const jsonParseSchema: NodeSchema = {
  type: "jsonParse",
  provider: "transform",
  operation: "json.parse",
  name: "Parse JSON",
  description: "Parse a JSON string into an object",
  icon: "Braces",
  color: "orange",
  category: "transform",
  inputs: [
    {
      key: "data",
      label: "JSON String",
      type: "textarea",
      required: true,
      placeholder: "{{previous.output}}",
      supportsVariables: true,
    },
    {
      key: "path",
      label: "Extract Path",
      type: "string",
      required: false,
      placeholder: "data.items[0].name",
      description: "Optional path to extract from the parsed JSON",
    },
  ],
  outputs: [
    { key: "data", label: "Parsed Data", type: "object" },
    { key: "output", label: "Output (alias)", type: "object" },
  ],
};

export const templateSchema: NodeSchema = {
  type: "template",
  provider: "transform",
  operation: "text.template",
  name: "Text Template",
  description: "Create text from a template with variable substitution",
  icon: "FileText",
  color: "orange",
  category: "transform",
  inputs: [
    {
      key: "template",
      label: "Template",
      type: "textarea",
      required: true,
      placeholder: "Hello {{trigger.name}}, your order #{{previous.orderId}} is ready!",
      supportsVariables: true,
    },
    {
      key: "variables",
      label: "Additional Variables",
      type: "json",
      required: false,
      placeholder: '{"customVar": "value"}',
    },
  ],
  outputs: [
    { key: "data", label: "Result", type: "string" },
    { key: "output", label: "Output (alias)", type: "string" },
  ],
};

export const filterSchema: NodeSchema = {
  type: "filter",
  provider: "transform",
  operation: "array.filter",
  name: "Filter Array",
  description: "Filter an array based on a condition",
  icon: "Filter",
  color: "orange",
  category: "transform",
  inputs: [
    {
      key: "array",
      label: "Array",
      type: "json",
      required: true,
      placeholder: "{{previous.output}}",
      supportsVariables: true,
    },
    {
      key: "field",
      label: "Field to Check",
      type: "string",
      required: true,
      placeholder: "status",
    },
    {
      key: "operator",
      label: "Operator",
      type: "select",
      required: true,
      default: "equals",
      options: [
        { value: "equals", label: "Equals" },
        { value: "notEquals", label: "Not Equals" },
        { value: "contains", label: "Contains" },
        { value: "gt", label: "Greater Than" },
        { value: "lt", label: "Less Than" },
        { value: "exists", label: "Exists" },
      ],
    },
    {
      key: "value",
      label: "Value",
      type: "string",
      required: false,
      supportsVariables: true,
    },
  ],
  outputs: [
    { key: "data", label: "Filtered Array", type: "array" },
    { key: "count", label: "Result Count", type: "number" },
    { key: "output", label: "Output (alias)", type: "array" },
  ],
};

// ============================================================================
// Combined Schemas with Operations
// ============================================================================

/**
 * Gmail combined schema with all operations
 */
export const gmailSchema: NodeSchema = {
  type: "gmail",
  provider: "google",
  operation: "gmail.send",
  name: "Gmail",
  description: "Send and manage emails with Gmail",
  icon: "Mail",
  color: "red",
  category: "action",
  inputs: gmailSendSchema.inputs,
  outputs: gmailSendSchema.outputs,
  operations: [
    { id: "gmail.send", label: "Send Email", description: "Send a new email" },
    { id: "gmail.createDraft", label: "Create Draft", description: "Create a draft email" },
    { id: "gmail.read", label: "Read Email", description: "Read a specific email by ID" },
    { id: "gmail.search", label: "Search Emails", description: "Search emails with a query" },
    { id: "gmail.watchInbox", label: "Watch Inbox", description: "Trigger on new emails" },
  ],
};

/**
 * Google Sheets combined schema with all operations
 */
export const googleSheetsSchema: NodeSchema = {
  type: "googleSheets",
  provider: "google",
  operation: "sheets.appendRow",
  name: "Google Sheets",
  description: "Read and write data in Google Sheets",
  icon: "Table",
  color: "green",
  category: "action",
  inputs: sheetsAppendSchema.inputs,
  outputs: sheetsAppendSchema.outputs,
  operations: [
    { id: "sheets.appendRow", label: "Append Row", description: "Add a new row to a sheet" },
    { id: "sheets.getRows", label: "Get Rows", description: "Read rows from a sheet" },
    { id: "sheets.findRow", label: "Find Row", description: "Find a row by column value" },
    { id: "sheets.updateRow", label: "Update Row", description: "Update a row by column value" },
    { id: "sheets.deleteRow", label: "Delete Row", description: "Delete a row by column value" },
  ],
};

/**
 * Transform combined schema with all operations
 */
export const transformSchema: NodeSchema = {
  type: "transform",
  provider: "transform",
  operation: "transform.jsonParse",
  name: "Transform",
  description: "Transform and manipulate data",
  icon: "Wrench",
  color: "purple",
  category: "utility",
  inputs: jsonParseSchema.inputs,
  outputs: jsonParseSchema.outputs,
  operations: [
    { id: "transform.jsonParse", label: "Parse JSON", description: "Parse a JSON string into an object" },
    { id: "transform.jsonStringify", label: "Stringify JSON", description: "Convert an object to JSON string" },
    { id: "transform.textTemplate", label: "Text Template", description: "Create text with variable substitution" },
    { id: "transform.arrayFilter", label: "Filter Array", description: "Filter array items by condition" },
    { id: "transform.arrayMap", label: "Map Array", description: "Extract values from array items" },
  ],
};

// ============================================================================
// Flow Control Nodes (Make.com-style)
// ============================================================================

/**
 * Iterator Schema - Splits array into individual items (1 → N)
 */
export const flowIteratorSchema: NodeSchema = {
  type: "flowIterator",
  provider: "flow",
  operation: "flow.iterate",
  name: "Iterator",
  description: "Split an array into individual items for processing",
  icon: "SplitSquareHorizontal",
  color: "cyan",
  category: "utility",
  inputs: [
    {
      key: "arrayPath",
      label: "Array Path",
      type: "string",
      required: true,
      placeholder: "{{previous.items}} or data.results",
      description: "Path to the array to iterate over",
    },
    {
      key: "itemVariable",
      label: "Item Variable Name",
      type: "string",
      required: false,
      placeholder: "item",
      description: "Variable name for current item (default: item)",
    },
    {
      key: "indexVariable",
      label: "Index Variable Name",
      type: "string",
      required: false,
      placeholder: "index",
      description: "Variable name for current index (default: index)",
    },
  ],
  outputs: [
    { key: "item", label: "Current Item", type: "any" },
    { key: "index", label: "Current Index", type: "number" },
    { key: "totalItems", label: "Total Items", type: "number" },
  ],
};

/**
 * Aggregator Schema - Combines multiple items into one (N → 1)
 */
export const flowAggregatorSchema: NodeSchema = {
  type: "flowAggregator",
  provider: "flow",
  operation: "flow.aggregate",
  name: "Aggregator",
  description: "Combine multiple items into a single output",
  icon: "Combine",
  color: "cyan",
  category: "utility",
  inputs: [
    {
      key: "aggregationMode",
      label: "Aggregation Mode",
      type: "select",
      required: true,
      options: [
        { value: "array", label: "Collect to Array" },
        { value: "first", label: "First Item Only" },
        { value: "last", label: "Last Item Only" },
        { value: "concat", label: "Concatenate (Text)" },
        { value: "sum", label: "Sum (Numbers)" },
        { value: "count", label: "Count Items" },
        { value: "custom", label: "Custom Expression" },
      ],
      description: "How to combine the items",
    },
    {
      key: "targetField",
      label: "Target Field",
      type: "string",
      required: false,
      placeholder: "value or items[0].name",
      description: "Extract specific field from each item before aggregating",
    },
    {
      key: "groupByField",
      label: "Group By Field",
      type: "string",
      required: false,
      placeholder: "category or status",
      description: "Group items by this field before aggregating",
    },
    {
      key: "maxItems",
      label: "Max Items",
      type: "number",
      required: false,
      placeholder: "100",
      description: "Maximum items to aggregate (stops early if reached)",
    },
    {
      key: "customExpression",
      label: "Custom Expression",
      type: "string",
      required: false,
      placeholder: "items.reduce((a, b) => a + b, 0)",
      description: "JavaScript expression (items available in scope)",
    },
  ],
  outputs: [
    { key: "data", label: "Aggregated Result", type: "any" },
    { key: "count", label: "Items Processed", type: "number" },
  ],
};

/**
 * Router Schema - Conditional branching
 */
export const flowRouterSchema: NodeSchema = {
  type: "flowRouter",
  provider: "flow",
  operation: "flow.route",
  name: "Router",
  description: "Route data to different paths based on conditions",
  icon: "GitBranch",
  color: "cyan",
  category: "utility",
  inputs: [
    {
      key: "conditions",
      label: "Routing Conditions",
      type: "array",
      required: true,
      description: "Define conditions and target paths",
    },
    {
      key: "defaultPath",
      label: "Default Path",
      type: "string",
      required: false,
      placeholder: "default",
      description: "Path to use when no conditions match",
    },
  ],
  outputs: [
    { key: "data", label: "Routed Data", type: "any" },
    { key: "matchedPaths", label: "Matched Paths", type: "array" },
  ],
};

/**
 * Filter Schema - Allow/block based on conditions
 */
export const flowFilterSchema: NodeSchema = {
  type: "flowFilter",
  provider: "flow",
  operation: "flow.filter",
  name: "Filter",
  description: "Allow or block execution based on conditions",
  icon: "Filter",
  color: "cyan",
  category: "utility",
  inputs: [
    {
      key: "filterField",
      label: "Field to Check",
      type: "string",
      required: true,
      placeholder: "{{previous.status}} or data.value",
      description: "Field or value to evaluate",
    },
    {
      key: "filterOperator",
      label: "Operator",
      type: "select",
      required: true,
      options: [
        { value: "equals", label: "Equals" },
        { value: "notEquals", label: "Not Equals" },
        { value: "contains", label: "Contains" },
        { value: "notContains", label: "Does Not Contain" },
        { value: "startsWith", label: "Starts With" },
        { value: "endsWith", label: "Ends With" },
        { value: "gt", label: "Greater Than" },
        { value: "gte", label: "Greater Than or Equal" },
        { value: "lt", label: "Less Than" },
        { value: "lte", label: "Less Than or Equal" },
        { value: "exists", label: "Exists (not null)" },
        { value: "notExists", label: "Does Not Exist" },
        { value: "isEmpty", label: "Is Empty" },
        { value: "isNotEmpty", label: "Is Not Empty" },
        { value: "regex", label: "Matches Regex" },
      ],
      description: "Comparison operator",
    },
    {
      key: "filterValue",
      label: "Compare Value",
      type: "string",
      required: false,
      placeholder: "active or {{trigger.threshold}}",
      description: "Value to compare against (not needed for exists/isEmpty)",
    },
    {
      key: "passThrough",
      label: "Pass Through Data",
      type: "boolean",
      required: false,
      description: "Pass original data through (default: true)",
    },
  ],
  outputs: [
    { key: "data", label: "Filtered Data", type: "any" },
    { key: "passed", label: "Filter Passed", type: "boolean" },
  ],
};

/**
 * Flow combined schema with all operations (unified node)
 */
export const flowSchema: NodeSchema = {
  type: "flow",
  provider: "flow",
  operation: "flow.iterate",
  name: "Flow Control",
  description: "Control workflow execution with iteration, aggregation, routing, and filtering",
  icon: "GitBranch",
  color: "cyan",
  category: "utility",
  inputs: flowIteratorSchema.inputs,
  outputs: flowIteratorSchema.outputs,
  operations: [
    { id: "flow.iterate", label: "Iterator", description: "Split array into individual items (1 → N)" },
    { id: "flow.aggregate", label: "Aggregator", description: "Combine items into single output (N → 1)" },
    { id: "flow.route", label: "Router", description: "Route to different paths based on conditions" },
    { id: "flow.filter", label: "Filter", description: "Allow or block execution based on conditions" },
  ],
};

// ============================================================================
// Schema Registry
// ============================================================================

export const nodeSchemas: Record<string, NodeSchema> = {
  trigger: triggerSchema,
  openai: openaiChatSchema,
  openaiChat: openaiChatSchema,
  openaiImage: openaiImageSchema,
  gmail: gmailSendSchema,
  gmailSend: gmailSendSchema,
  googleSheets: sheetsAppendSchema,
  sheetsAppend: sheetsAppendSchema,
  sheetsFind: sheetsFindSchema,
  sheetsUpdate: sheetsUpdateSchema,
  email: emailSendSchema,
  emailSend: emailSendSchema,
  httpRequest: httpRequestSchema,
  jsonParse: jsonParseSchema,
  template: templateSchema,
  filter: filterSchema,
  // Flow control nodes
  flow: flowSchema,
  flowIterator: flowIteratorSchema,
  flowAggregator: flowAggregatorSchema,
  flowRouter: flowRouterSchema,
  flowFilter: flowFilterSchema,
};

/**
 * Get schema for a node type
 */
export function getNodeSchema(nodeType: string): NodeSchema | undefined {
  return nodeSchemas[nodeType];
}

/**
 * Get all available node schemas
 */
export function getAllNodeSchemas(): NodeSchema[] {
  return Object.values(nodeSchemas);
}

/**
 * Get schemas by category
 */
export function getNodeSchemasByCategory(category: NodeSchema["category"]): NodeSchema[] {
  return Object.values(nodeSchemas).filter(schema => schema.category === category);
}
