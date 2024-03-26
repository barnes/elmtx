export const Card = (card) => {
    return (
        <article style="width: 45%">
            <header>
                <h2>{card.title}</h2>
            </header>
            <body>
                <p>{card.content}</p>
                <label for="archived">
                    Archived?:
                <input name="archived" type="checkbox" checked={card.archived} hx-patch={`/toggle-archived/${card.id}`} />
                </label>
                <button id="delete" hx-delete={`/delete-card/${card.id}`}>Delete</button>
            </body>
        </article>
    );
};
