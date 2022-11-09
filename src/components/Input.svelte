<script>
    export let label = "", id = "", help = "", type="text";
</script>

<div class="form-group">
    <label for={id}>{label}</label>
    <input type={type} id={id} class="form-control" class:is-invalid={help} on:input/>
    {#if help}
        <span class="invalid-feedback" role="alert">{help}</span>
    {/if}
</div>