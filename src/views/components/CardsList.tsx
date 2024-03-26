import { Card } from "./Card";

export const CardsList = (cards) => {
    return (
        <div style="display:flex;flex-wrap:wrap;flex-direction:row;gap:1rem;">
            {cards.map((card) => {
                return Card(card);
            })}
        </div>
    );
};
