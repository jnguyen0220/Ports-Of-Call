const { html, render } = lighterhtml;

export const createStatusComponent = (node, filterGrid, { total, green, red, gray }) => {
    render(node, html `
        <label><span>Total:${total} |</<span></label>
        <label><input type="checkbox" value="1" onchange=${filterGrid} /><span>&#128308 ${red} |</span></label>
        <label><input type="checkbox" value="2" onchange=${filterGrid} /><span>&#128994 ${green} |</span></label>
        <label><input type="checkbox" value="3" onchange=${filterGrid} /><span>&#128280 ${gray}</span></label>
    `);
}