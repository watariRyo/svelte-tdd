<script>
    import { _ } from "svelte-i18n"
    import { Link } from "svelte-routing"
    import { auth } from "../store/stores"

</script>

<div class="bg-light shadow-sm mb-3">
    <nav class="navbar navbar-expand container navbar-light">
        <Link class="navbar-brand" to="/" title="Home">
            <img src="/assets/hoaxify.png" width=60 alt="Hoaxify" data-testid="Hoaxify"/>
            Hoaxify
        </Link>
        <ul class="navbar-nav ml-auto">
            {#if $auth.isLoggedIn}
                <Link class="nav-link" to={`/user/${$auth.id}`}>My Profile</Link>
            {:else}
                <Link class="nav-link" to="/signup">{$_("signUp")}</Link>
                <Link class="nav-link" to="/login">{$_("login")}</Link>
            {/if}
        </ul>
    </nav>
</div>