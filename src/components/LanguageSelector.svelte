<script>
    import { locale } from "svelte-i18n"
</script>

<button title="Japanese" class="fi fi-jp country-button" alt="Japanese Flaf" on:click|preventDefault={() => locale.set("ja")} />
<button title="English" class="fi fi-us country-button" alt="English Flag" on:click|preventDefault={() => locale.set("en")} />

<style>
    .country-button {
        border: none;
        cursor: pointer;
    }
</style>