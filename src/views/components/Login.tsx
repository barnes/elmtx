export const Login = () => {
    return (
        <article>
            <h1>Login</h1>
            <div style="display:flex;flex-direction:column;gap:2rem;">
            <a role="button" href="/auth/google">Login with Google</a>
            <a role="button" href="/auth/github">Login with Github</a>
            </div>
        </article>
    );
};
