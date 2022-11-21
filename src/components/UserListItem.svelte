<script>
    import { link } from "svelte-routing"
    export let user;


    let imageUrl = "/assets/profile.png"

    if (user.image) {
        imageUrl = "/assets/"+user.image;
    }
</script>

<a 
    href={`/user/${user.id}`}
    use:link
    class="list-group-item list-group-item-action">
    <img src={imageUrl} alt="profile" width="30" class="rounded-circle shadow-sm"/>
    {user.username}
</a>