<script lang="ts">
  import type { ALL_STEPS } from "../../../workflow_types";

  export let step: ALL_STEPS;
</script>

{#if step.stepType === "HTTP"}
  <div>
    <div class="nes-field">
      <label for="url">URL</label>
      <input type="text" id="url" class="nes-input" bind:value={step.url} />
    </div>

    <br />

    <label for="method">Method</label>
    <div class="nes-select">
      <select id="method" bind:value={step.method}>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
      </select>
    </div>

    <br />

    {#if step.method === "POST"}
      <label for="body">Body</label>
      <textarea id="body" class="nes-textarea" bind:value={step.body} />
    {/if}
  </div>
{:else if step.stepType === 'RESPOND'}
  <label for="respond">Respond with</label>
  <textarea id="respond" class="nes-textarea" bind:value={step.body} />
{/if}
