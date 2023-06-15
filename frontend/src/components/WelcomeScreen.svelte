<script lang="ts">
  import { createNewWorkflow, openToEditWorkflow } from "../state";

  let workflowId = "";
  let workflowAdminKey = "";

  const queryProps = {};
  location.search?.replace('?','').split('&').forEach(search => {
    const [key, value] = search.split('=');

    queryProps[key] = value;
  });

  console.info(queryProps, location.search);

  if (queryProps['id'] && queryProps['adminKey']) {
    openToEditWorkflow(queryProps['id'], queryProps['adminKey'])
  }
</script>

<button type="button" class="nes-btn is-success" on:click={createNewWorkflow}
  >Create new Workflow</button
>
<br />
<br />

<div class="nes-container with-title is-centered">
  <p class="title">or open an existing one using the Admin-Key</p>

  <div class="nes-field">
    <label for="id">ID</label>
    <input type="text" id="id" class="nes-input" bind:value={workflowId} />
  </div>

  <br />

  <div class="nes-field">
    <label for="admin_key">Admin Key</label>
    <input
      type="password"
      id="admin_key"
      class="nes-input"
      bind:value={workflowAdminKey}
    />
  </div>

  <br />
  <button
    type="button"
    class="nes-btn is-primary"
    on:click={() => openToEditWorkflow(workflowId, workflowAdminKey)}
    >Edit Workflow</button
  >
</div>
