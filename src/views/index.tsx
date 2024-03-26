import { Nav } from "./components/Nav";

export const index = (user) => {
    return (
        <html lang="en">
            <head>
                <title>Elmtx</title>
                <meta charset="UTF-8" />

                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
                />

                <script src="https://unpkg.com/htmx.org/dist/htmx.js" />
                <script src="https://unpkg.com/alpinejs" defer />
            </head>
            <body class="container">
                {user ? <Nav user={user} /> : <Nav />}
                {user ? (
                    <main id="content" hx-get="/account" hx-trigger="load" />
                ) : (
                    <main id="content" hx-get="/login" hx-trigger="load" />
                )}
            </body>
        </html>
    );
};
