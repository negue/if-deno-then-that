import { writable, derived } from "svelte/store";
import { Workflow } from "../../workflow_types.ts";
import { FlowRequest } from "../../flowrun_types.ts";

export type VIEW_TYPES = "WELCOME" | "WORKFLOW_EDIT";

export const currentView = writable<VIEW_TYPES>("WELCOME");
let savedStateOfWorkflow: Workflow|undefined = undefined;
export const currentlyEditing = writable<Workflow | undefined>(undefined);

export const currentlyEditingUnsaved = derived(currentlyEditing, ce => {
  return savedStateOfWorkflow?.isActive !== ce.isActive || savedStateOfWorkflow?.name !== ce.name;
})

export const ORIGIN = location.origin.includes('localhost') ? 'http://localhost:8000' : location.origin;

export async function createNewWorkflow() {
  try {
    const result = await fetch(`${ORIGIN}/workflows/create`, {
      method: 'POST'
    });

    const workflow: Workflow = await result.json();

    currentlyEditing.set(workflow);
    savedStateOfWorkflow = structuredClone(workflow);
    currentView.set("WORKFLOW_EDIT");
  } catch (e) {
    alert('Could not create a new workflow, reason: '+ e);
  }
}


export async function openToEditWorkflow(workflowId: string, adminKey: string) {
  try {
    const result = await fetch(`${ORIGIN}/workflows/${workflowId}/${adminKey}`, {
      method: 'POST',
      body: '',
      headers: {
        'Content-Type': 'text'
      }
    });

    const workflow: Workflow = await result.json();

    currentlyEditing.set(workflow);
    savedStateOfWorkflow = structuredClone(workflow);
    currentView.set("WORKFLOW_EDIT");
  } catch (e) {
    alert('Could not get workflow, reason: '+ e);
  }
}

export async function getFlowRequests(adminKey: string) {
  try {
    const result = await fetch(`${ORIGIN}/workflows/${adminKey}/history`, {
      method: 'GET',
    });

    const flowRequests: FlowRequest[] = await result.json();

    return flowRequests;
  } catch (e) {
    alert('Could not get flow requests, reason: '+ e);
  }
}

export async function saveWorkflow(workflow: Workflow) {
  try {
    const result = await fetch(`${ORIGIN}/workflows/${workflow.id}/update/${workflow.adminKey}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    
    savedStateOfWorkflow = structuredClone(workflow);
    currentlyEditing.set(workflow);

  } catch (e) {
    alert('Could not get flow requests, reason: '+ e);
  }
}

