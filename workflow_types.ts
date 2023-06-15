export interface Step {
  stepId: string;
}

export interface StepResultSavedAsVariable {
  /**
   * Used for the variables in each (or the next steps available)
   */
  stepVariable: string;
}

/**
 * Check stuff, if its not equal the expected result throw Error
 */
export interface CheckStep extends Step {
  stepType: "CHECK";
  conditionFormula: string;
  conditionExpectedResult: string;
}

export interface HttpStep extends Step, StepResultSavedAsVariable {
  stepType: "HTTP";
  method: "GET" | "POST";
  url: string;
  body?: string;
}

export interface ResponseStep extends Step {
  stepType: "RESPOND";
  body: string;
}

export type ALL_STEPS = HttpStep | CheckStep | ResponseStep;

export interface Workflow {
  id: string;
  name: string;
  adminKey: string;
  isActive: boolean;
  steps: ALL_STEPS[];
}

export interface WorkflowUpdate extends Omit<Workflow, 'adminKey'>{
  
}

export interface WorkflowLogicResult {
  ok: boolean;
  error?: string;
  step?: string;
  customResponse?: unknown;
}
