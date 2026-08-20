document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    impostaPulsanteNotifiche(_supabase, user.id);
});