import { WorkflowLogicResult } from "./workflow_types.ts";

export interface FlowRequest {
  id: string;
  date: Date;
  executedSuccessful: boolean;
  request: {
    url: string;
    body: Record<string, unknown>|string|undefined
  }
}

export interface FlowRun {
  id: string;
  date: Date;
  flowRequestRef: string;
  result: WorkflowLogicResult
}