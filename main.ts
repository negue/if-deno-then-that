import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import {
  createNewWorkflowObject,
  createWorkflow,
  getFlowRequest,
  getWorkflowByAdminKey,
  getWorkflowByPublicId,
  listFlowRequests,
  listFlowRuns,
  updateWorkflow,
} from "./database.ts";
import { Workflow, WorkflowUpdate } from "./workflow_types.ts";
import { createFlowRequest, tryFlowRequest } from "./flowrequest_handler.ts";



const router = new Router();
router
  .post("/workflows/create", async (context) => {
    const createdWorkflow = createNewWorkflowObject();

    await createWorkflow(createdWorkflow)

    context.response.body = createdWorkflow;
  })
  .post("/workflows/:id/:adminKey", async (context) => {
    const { adminKey, id } = context.params;

      const workflowInDb = await getWorkflowByPublicId(id);

      if (workflowInDb?.adminKey !== adminKey) {
        throw Error("Nope");
      }

      context.response.body = workflowInDb;
  })
  .put("/workflows/:id/update/:adminKey", async (context) => {
    const body = context.request.body();
    const { adminKey, id } = context.params;

    if (body.type === "json") {
      const updatePayload = await body.value as WorkflowUpdate;

      // security... xD
      if (id !== updatePayload.id) {
        throw Error("Nope: Wrong ID");
      }

      const workflowInDb = await getWorkflowByPublicId(id);

      if (workflowInDb?.adminKey !== adminKey) {
        throw Error("Nope");
      }

      const fullWorkflowObject: Workflow = {
        ...updatePayload,
        adminKey: workflowInDb.adminKey,
      };

      await updateWorkflow(fullWorkflowObject);
    }

    context.response.body = "Updated";
  })
  // two types of trigger possible, simple get call from the browser
  .get("/workflows/:id/trigger", async (context) => {
    const { id } = context.params;
    const workflowInDb = await getWorkflowByPublicId(id);

    if (!workflowInDb) {
      throw Error("Unknown Workflow ID");
    }

    const requestedFlow = await createFlowRequest(
      workflowInDb,
      context.request,
    );

    context.response.body = requestedFlow.flowRun.result.customResponse ?? {
      ok: requestedFlow.flowRequest.executedSuccessful,
    };
  })
  // or a post with more payload
  .post("/workflows/:id/trigger", async (context) => {
    const { id } = context.params;
    const workflowInDb = await getWorkflowByPublicId(id);

    if (!workflowInDb) {
      throw Error("Unknown Workflow ID");
    }

    const requestedFlow = await createFlowRequest(
      workflowInDb,
      context.request,
    );

    context.response.body = requestedFlow.flowRun.result.customResponse ?? {
      ok: requestedFlow.flowRequest.executedSuccessful,
    };
  })
  .get("/workflows/:adminKey/history", async (context) => {
    const { adminKey } = context.params;
    const workflowId = await getWorkflowByAdminKey(adminKey);

    if (!workflowId) {
      throw Error("Unknown Workflow ID");
    }
    const flowRequests = await listFlowRequests(workflowId);


    const target = context.sendEvents();
    target.dispatchMessage(flowRequests);

    const broadcastChannel = new BroadcastChannel('requests/'+workflowId);

    broadcastChannel.addEventListener('message', me => {
      target.dispatchMessage([me.data]);
    })
  })
  .get("/workflows/:adminKey/history/:flowRequestId", async (context) => {
    const { adminKey, flowRequestId } = context.params;
    const workflowId = await getWorkflowByAdminKey(adminKey);

    if (!workflowId) {
      throw Error("Unknown Workflow ID");
    }

    const flowRuns = await listFlowRuns(workflowId, flowRequestId);

    context.response.body = flowRuns;
  })
  .post("/workflows/:adminKey/retrigger/:flowRequestId", async (context) => {
    const { adminKey, flowRequestId } = context.params;
    const workflowId = await getWorkflowByAdminKey(adminKey);

    if (!workflowId) {
      throw Error("Unknown Workflow ID");
    }

    const workflow = (await getWorkflowByPublicId(workflowId))!;

    const flowRequest = await getFlowRequest(workflowId, flowRequestId);

    if (!flowRequest?.value) {
      throw Error("Unknown Flow Request");
    }

    const result = await tryFlowRequest(workflow, flowRequest.value);

    context.response.body = result;
  })
  .post("/workflows/:adminKey/try/:flowRequestId", async (context) => {
    const { adminKey, flowRequestId } = context.params;
    const workflowId = await getWorkflowByAdminKey(adminKey);

    if (!workflowId) {
      throw Error("Unknown Workflow ID");
    }

    const body = context.request.body();
    
    if (body.type === 'json') {
      const workflowToTest: WorkflowUpdate = await body.value;

      const flowRequest = await getFlowRequest(workflowId, flowRequestId);

      if (!flowRequest?.value) {
        throw Error("Unknown Flow Request");
      }
  
      const result = await tryFlowRequest({
        ...workflowToTest,
        adminKey,
        isActive: true // while testing it its true
      }, flowRequest.value);
  
      context.response.body = result;
    }
  });

const app = new Application({});

// of-CORS, the usual annoyances 
app.use((ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "POST, PUT, GET, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return next();
});

app.use(router.routes());
app.use(router.allowedMethods());

// static content
app.use(async (context, next) => {
  try {
    await context.send({
      root: `${Deno.cwd()}/frontend/dist`,
      index: "index.html",
    });
  } catch {
    next();
  }
});

await app.listen({ port: 8000 });
