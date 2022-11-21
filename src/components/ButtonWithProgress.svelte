<script>
  import Spiner from "./Spiner.svelte";
  export let disabled, apiProgress, onClick


</script>

<button class="btn btn-primary" 
    disabled={disabled || apiProgress} 
    on:click|preventDefault={onClick}>
    {#if apiProgress}
        <Spiner />
    {/if}
    <slot></slot>
</button>