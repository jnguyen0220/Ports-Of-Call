const { html, render } = lighterhtml;

export const createStatusComponent = (node, filterGrid, { total, green, red, gray }) => {
    render(node, html `
        <div class="pill">
            <label style="background: rgb(18, 159, 234);">Total: ${total}</label>
            <label style="background: red;"><input type="checkbox" onchange=${filterGrid} value="1" /> ${red}</label>
            <label style="background: green;"><input type="checkbox" onchange=${filterGrid} value="2" /> ${green}</label>
            <label style="background: gray;"><input type="checkbox" onchange=${filterGrid} value="3" /> ${gray}</label>
        <div>
    `);
}