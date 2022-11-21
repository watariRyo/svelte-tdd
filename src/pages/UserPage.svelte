<script>
    import { getUserById } from "../api/apiCalls"
    import ProfileCard from "../components/ProfileCard.svelte";
    import Spiner from "../components/Spiner.svelte";
    export let id;

    let user = {};

    let apiCall = getUserById(id)
</script>

<div data-testid="user-page">
    {#await apiCall}
    <div class="alert alert-secondary text-center">
        <Spiner size="normal"/>
    </div>
    {:then response}
        <ProfileCard user={response.data} />
    {:catch error}
        <div class="alert alert-danger text-center">
            {error.response.data.message}
        </div>
    {/await}
</div>