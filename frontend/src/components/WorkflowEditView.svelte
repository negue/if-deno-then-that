<script lang="ts">
  import { writable } from "svelte/store";
  import {
    ORIGIN,
    currentlyEditing,
    currentlyEditingUnsaved,
    getFlowRequests,
    saveWorkflow,
  } from "../state";
  import type { FlowRequest } from "../../../flowrun_types";
  import StepEditView from "./StepEditView.svelte";
  import type { ALL_STEPS, HttpStep, Step } from "../../../workflow_types";

  // skipped feature due to time... :(
  const flowRequests = writable<FlowRequest[]>([]);

  const events = new EventSource(
    `${ORIGIN}/workflows/${$currentlyEditing.adminKey}/history`
  );
  events.addEventListener("open", () => {});
  events.addEventListener("error", (e) => {
    // alert(e);
  });
  events.addEventListener("message", (e) => {
    const items = JSON.parse(e.data);
    flowRequests.update((prev) => {
      return [...prev, ...items];
    });
  });

  const triggerURL = `${ORIGIN}/workflows/${$currentlyEditing.id}/trigger`;

  function triggerExample() {
    fetch(triggerURL, {
      method: "GET",
    });
  }

  function addStep(after: ALL_STEPS) {
    const indexOf = $currentlyEditing.steps.indexOf(after);

    const newStep: HttpStep = {
      method: "GET",
      stepType: "HTTP",
      stepId: crypto.randomUUID(),
      stepVariable: "myVar",
      url: "",
    };

    $currentlyEditing.steps.splice(indexOf+1, 0, newStep);

    $currentlyEditing.steps = $currentlyEditing.steps; // one of the svelte quirks sadly
  }

  function deleteStep(step: ALL_STEPS) {
    const indexOf = $currentlyEditing.steps.indexOf(step);

    $currentlyEditing.steps.splice(indexOf, 1);

    $currentlyEditing.steps = $currentlyEditing.steps; // one of the svelte quirks sadly
  }
</script>

<h3>{$currentlyEditing.name}</h3>

<div class="nes-table-responsive">
  <table class="nes-table is-bordered is-centered">
    <tbody>
      <tr>
        <td>Trigger by <br />GET or POST</td>
        <td><code>{triggerURL}</code></td>
      </tr>
      <tr>
        <td>Edit/Information Page</td>
        <td>
          <span class="nes-text is-error">SAVE THAT URL!!!</span>
          <br />

          <code
            >{ORIGIN}?id={$currentlyEditing.id}&adminKey={$currentlyEditing.adminKey}</code
          >
        </td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Cut because of time...
<div class="nes-container with-title is-centered">
  <p class="title">Flow Requests</p>

  This Panel will show each request that hit any of the Trigger URLs:

  <br />

  {JSON.stringify($flowRequests.length)}

  {#if $flowRequests.length === 0}
    <button type="button" class="nes-btn is-success" on:click={triggerExample}
      >Trigger example request</button
    >
  {/if}
</div>
-->
<br />

<div class="nes-container with-title is-centered">
  <p class="title">Edit Workflow {$currentlyEditingUnsaved ? "UNSAVED" : ""}</p>

  <button
    type="button"
    class="nes-btn is-primary"
    on:click={() => saveWorkflow($currentlyEditing)}>Save</button
  >

  <div class="nes-field">
    <label for="name">Name</label>
    <input
      type="text"
      id="name"
      class="nes-input"
      bind:value={$currentlyEditing.name}
    />
  </div>

  <br />

  <label>
    <input
      type="checkbox"
      class="nes-checkbox"
      bind:checked={$currentlyEditing.isActive}
    />
    <span>Is Active</span>
  </label>

  <br />

  <h4>Workflow Steps</h4>

  <span class="nes-text is-primary">Hint:</span> you can use Variables inside
  Textfields. <br />
  Syntax: <code>{"${{"} ctx.steps.variableName.body.value {"}}"}</code> Using <a href="http://docs.jsonata.org/overview" target="_blank">JSONata</a> between the curly brackets <br /><br/>
  Available Variables:

  <pre>
    ctx.request: {"{"}
      query: Object;
      body: unknown;
    {"}"};
    ctx.steps
             .status
             .statusText
             .body
  </pre>

  <div class="nes-table-responsive">
    <table class="nes-table is-bordered is-centered">
      <tbody>
        {#each $currentlyEditing.steps as step}
          <tr>
            <td valign="top" style="min-width: 15rem">
              <label for="type">Type</label>
              <div class="nes-select">
                <select id="type" bind:value={step.stepType}>
                  <option value="HTTP">HTTP</option>
                  <option value="RESPOND">RESPOND</option>
                </select>
              </div>

              <br />

              <a on:click={() => deleteStep(step)} class="nes-text is-error">
                Delete
              </a>
            </td>
            <td style="width: 100%">
              {#if typeof step["stepVariable"] !== "undefined"}
                <div class="nes-field">
                  <label for="variable">Variable</label>
                  <input
                    type="text"
                    id="variable"
                    class="nes-input"
                    bind:value={step["stepVariable"]}
                  />
                </div>

                <br />
              {/if}

              <StepEditView bind:step />
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <button
                type="button"
                class="nes-btn is-primary"
                on:click={() => addStep(step)}
              >
                Add Step after
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
