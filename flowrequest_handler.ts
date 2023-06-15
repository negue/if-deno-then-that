import { saveFlowRequest, saveFlowRun } from "./database.ts";
import { FlowRequest, FlowRun } from "./flowrun_types.ts";
import { getOakRequestJsonOrText } from "./utils.ts";
import { handleWorkflowLogic } from "./workflow_handler.ts";
import { Workflow } from "./workflow_types.ts";
import { Request } from "https://deno.land/x/oak/mod.ts";

export async function createFlowRequest(
  workflow: Workflow,
  request: Request,
) {
  const flowRequest: FlowRequest = {
    id: crypto.randomUUID(),
    date: new Date(),
    executedSuccessful: false,
    request: {
      url: request.url.href,
      body: await getOakRequestJsonOrText(request),
    },
  };

  await saveFlowRequest(workflow.id, flowRequest);

  const broadcastChannel = new BroadcastChannel('requests/'+workflow.id);
  broadcastChannel.postMessage(flowRequest);


  const flowRun = await tryFlowRequest(workflow, flowRequest);

  return {
    flowRequest,
    flowRun,
  };
}

export async function tryFlowRequest(
  workflow: Workflow,
  flowRequest: FlowRequest,
) {
  const logicResult = await handleWorkflowLogic(
    workflow,
    flowRequest.request.url,
    flowRequest.request.body,
  );

  const flowRun: FlowRun = {
    flowRequestRef: flowRequest.id,
    id: crypto.randomUUID(),
    date: new Date(),
    result: logicResult,
  };

  await saveFlowRun(workflow.id, flowRequest.id, flowRun);

  if (flowRun.result.ok) {
    flowRequest.executedSuccessful = true;

    saveFlowRequest(workflow.id, flowRequest);
  }

  return flowRun;
}
