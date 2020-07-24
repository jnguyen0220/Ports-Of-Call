const { html, render } = lighterhtml;

const defaultState = () => ({
    isDeleteDisabled: true,
    isToggleDisabled: true
});

export const createToolBtnGroupComponent = (node, handler, state = defaultState()) => {
    const { add, remove, upload, download, toggle } = handler;
    const { isDeleteDisabled, isToggleDisabled } = state;
    render(node, html `
        <div class="btn-group" style="display: flex; border: 1px solid #babfc7;">
            <button onclick=${add}>&#65291; Add</button>
            <button onclick=${remove} disabled=${isDeleteDisabled} style="background-color: red;">&#9888; Delete</button>
            <button onclick=${toggle} disabled=${isToggleDisabled} >&#x21C5; Toggle</button>
            <button onclick=${upload}>&#x21D1; Import</button>
            <button onclick=${download}>&#x21D3; Export</button>
        </div>
    `);
}