export const Account = () => {
    return (
        <div>
            <article>
                <form hx-post="/add-card">
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
                        <input type="checkbox" name="archive" />
                    </label>
                    <button type="submit">Submit</button>
                </form>
            </article>
        </div>
    );
};
