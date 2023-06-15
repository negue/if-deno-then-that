import { getResultJsonOrText } from "./utils.ts";
import { Workflow, WorkflowLogicResult } from "./workflow_types.ts";
import JSONata from "https://esm.sh/jsonata";

const JSONATA_REGEX = /\${{\s*(.*)\s*}}/gm;

function getQueryParams(url: string) {
  const parsedUrl = new URL(url);

  const queryParams: Record<string, string> = {};

  for (const p of parsedUrl.searchParams) {
    queryParams[p[0]] = p[1];
  }

  return queryParams;
}

export async function handleWorkflowLogic(
  workflow: Workflow,
  queryUrl: string,
  body: Record<string, unknown> | string | undefined = undefined,
): Promise<WorkflowLogicResult> {
  if (!workflow.isActive) {
    return {
      ok: false,
      error: "Workflow is not active",
    };
  }

  const variableContext: {
    request: {
      query: Record<string, unknown>;
      body: unknown;
    };
    steps: Record<string, unknown>;
  } = {
    request: {
      query: getQueryParams(queryUrl),
      body: body,
    },
    steps: {},
  };

  async function evaluateVariables(jsonataString: string) {
    for (const matchAllElement of jsonataString.matchAll(JSONATA_REGEX)) {
      // todo cache jsonataQuery
      const jsonataQuery = matchAllElement[1].trim();
      const jsonataExpression = JSONata(jsonataQuery);

      const jsonataResult = await jsonataExpression.evaluate({
        ctx: variableContext,
      });

      jsonataString = jsonataString.replaceAll(
        matchAllElement[0],
        typeof jsonataResult === "object"
          ? JSON.stringify(jsonataResult)
          : jsonataResult,
      );
    }

    return jsonataString;
  }

  for (const step of workflow.steps) {
    switch (step.stepType) {
      case "HTTP": {
        const body = step.method !== "GET" && step.body
          ? await evaluateVariables(step.body)
          : undefined;

        const fetchResult = await fetch(await evaluateVariables(step.url), {
          method: step.method,
          body,
        });

        if (fetchResult.ok) {
          variableContext.steps[step.stepVariable] = {
            status: fetchResult.status,
            statusText: fetchResult.statusText,
            body: await getResultJsonOrText(fetchResult),
          };
          console.info(fetchResult);
        } else {
          return {
            ok: false,
            step: step.stepId,
            error:
              `HTTP Step failed - Status: ${fetchResult.statusText} Response: ${fetchResult.text}`,
          };
        }

        break;
      }
      case "CHECK": {
        const conditionResult = await evaluateVariables(step.conditionFormula);

        if (conditionResult != step.conditionExpectedResult) {
          return {
            ok: false,
            step: step.stepId,
            error:
              `CHECK Step Condition failed - Expected: ${step.conditionExpectedResult} - Received: ${conditionResult}`,
          };
        }
        break;
      }
      case "RESPOND": {
        return {
          ok: true,
          customResponse: await evaluateVariables(step.body),
        };
      }
    }
  }

  return {
    ok: true,
  };
}
