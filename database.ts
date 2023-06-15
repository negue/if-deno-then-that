import { FlowRequest, FlowRun } from "./flowrun_types.ts";
import { Workflow } from "./workflow_types.ts";

const kv = await Deno.openKv();

export async function getWorkflowByAdminKey(adminKey: string) {
  const result = await kv.get<string>(["workflows", "byAdminKey", adminKey]);

  return result?.value;
}

export async function getWorkflowByPublicId(publicId: string) {
  const result = await kv.get<Workflow>(["workflows", publicId]);

  return result?.value;
}

export function createNewWorkflowObject(): Workflow {
  return {
    id: crypto.randomUUID(),
    adminKey: crypto.randomUUID(),
    isActive: true,
    name: "Get Chuck Norris Joke - Call with ?name=SomeName :)",
    steps: [
        {
          stepId: crypto.randomUUID(),
          stepVariable: "chuckNorris",
          stepType: "HTTP",
          url: "https://api.chucknorris.io/jokes/random",
          method: "GET",
        },
        {
          stepId: crypto.randomUUID(),
          stepType: "RESPOND",
          body: "IFDTT: Replace \"Chuck Norris\" Joke: ${{ $replace(ctx.steps.chuckNorris.body.value, \"Chuck Norris\", ctx.request.query.name ? ctx.request.query.name : \"Chuck Norris\") }}",
        },
    ],
  };
}

export async function createWorkflow(workflow: Workflow) {
  if (
    await getWorkflowByPublicId(workflow.id) ||
    await getWorkflowByAdminKey(workflow.adminKey)
  ) {
    throw Error("workflow already exists");
  }

  await kv.atomic()
    .set(["workflows", workflow.id], workflow)
    .set(["workflows", "byAdminKey", workflow.adminKey], workflow.id)
    .commit();
}

export function updateWorkflow(workflow: Workflow) {
  return kv.set(["workflows", workflow.id], workflow);
}

export async function listFlowRequests(
  workflowId: string,
): Promise<FlowRequest[]> {
  const iterationResult = await kv.list<FlowRequest>({
    prefix: ["workflows", workflowId, "requests"],
  });

  const allRequests: FlowRequest[] = [];

  for await (const res of iterationResult) {
    allRequests.push(res.value);
  }

  return allRequests;
}

export async function listFlowRuns(
  workflowId: string,
  flowRequestId: string,
): Promise<FlowRun[]> {
  const iterationResult = await kv.list<FlowRun>({
    prefix: [
      "workflows",
      workflowId,
      "requests",
      flowRequestId,
      "runs",
    ],
  });

  const allRuns: FlowRun[] = [];

  for await (const res of iterationResult) {
    allRuns.push(res.value);
  }

  return allRuns;
}

export  function getFlowRequest(
  workflowId: string,
  flowRequestId: string,
) {
  return kv.get<FlowRequest>(
    ["workflows", workflowId, "requests", flowRequestId],
  );
}

export function saveFlowRequest(workflowId: string, flowRequest: FlowRequest) {
  return kv.set(
    ["workflows", workflowId, "requests", flowRequest.id],
    flowRequest,
  );
}

export function saveFlowRun(
  workflowId: string,
  flowRequestId: string,
  flowRun: FlowRun,
) {
  return kv.set([
    "workflows",
    workflowId,
    "requests",
    flowRequestId,
    "runs",
    flowRun.id,
  ], flowRun);
}
