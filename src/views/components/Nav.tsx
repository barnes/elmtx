export const Nav = (user) => {
    const menuItems = [
        { name: "Home", link: "/home", hx: true },
        { name: "Account", link: "/account", hx: true},
        { name: "Google", link: "/auth/google", hx: false},
    ];
    return (
        <nav>
            <ul>
                <h1>Elmtx</h1>
            </ul>
            <ul>
                {user ? <li><a href="/auth/logout">Logout</a></li> : <li><a href="/about">About</a></li>}
            </ul>
        </nav>
    )
}