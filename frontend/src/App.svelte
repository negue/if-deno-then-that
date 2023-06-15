<script lang="ts">
  import svelteLogo from "./assets/svelte.svg";
  import viteLogo from "/vite.svg";
  import Counter from "./lib/Counter.svelte";
  import WelcomeScreen from "./components/WelcomeScreen.svelte";
  import { currentView } from "./state";
  import WorkflowEditView from "./components/WorkflowEditView.svelte";
</script>

<br />
<br />
<br />

<div class="nes-container with-title is-centered">
  <p class="title">
    <span class="nes-badge" style="width: 15rem">
      <span class="is-primary" style="left: 0; top: -0.5rem"
        >IF-DENO-Then-That</span
      >
    </span>
    <span class="nes-badge is-icon" style="width: 0; margin: 0">
      <span class="is-error" style="width: 12rem">v0.0.1-alpha</span>
    </span>
  </p>
  {#if $currentView === "WELCOME"}
    <WelcomeScreen />
  {:else}
    <WorkflowEditView />
  {/if}
</div>

<style scoped>
  .nes-container {
    width: 90%;
    margin: 0 auto;
  }
</style>
