<script>
    import { activate } from "../api/apiCalls"
      import Spiner from "../components/Spiner.svelte";

    export let token;

    let apiCall = activate(token);
</script>

<div data-testid="activation-page">
    {#await apiCall}
        <Spiner size="normal"/>
    {:then}
        <div class="alert alert-success mt-3">Account is activated</div>
    {:catch}
        <div class="alert alert-danger mt-3">Activation failure</div>
    {/await}
</div>