export const Account = () => {
    return (
        <div>
            <article>
                <form hx-post="/add-card" hx-swap="none" id="add-form">
                    <label for="title">
                        Title
                        <input type="text" name="title" />
                    </label>

                    <label for="description">
                        Description
                        <input type="textfield" name="description" />
                    </label>
                    <label for="archive">
                        Archive?  
                        <input type="checkbox" name="archived" />
                    </label>
                    <button id="new-submit" type="submit">Submit</button>
                </form>
            </article>
            <article>
                <h1>Cards</h1>
                <div hx-get="/cards" hx-target="#cards" hx-trigger="load, cardEdit from:body">
                    <div id="cards">
                        <p>Loading...</p>
                    </div>
                </div>
            </article>
            <article>
                <h1>Archived Cards</h1>
                <div hx-get="/archived-cards" hx-target="#archived-cards" hx-trigger="load, cardEdit from:body">
                    <div id="archived-cards">
                        <p>Loading...</p>
                    </div>
                </div>
            </article>
        </div>
    );
};
