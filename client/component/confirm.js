const { html, render } = lighterhtml;

export const deleteFormComponent = (node, count) => {
    return new Promise((resolve, reject) => {
        render(node, html `
            <div class="modal-content">
                <div class="modal-header" style="background: red;">
                    <div class="center">
                        <div>
                            Confirm Deletion
                        </div>
                    </div>
                    <div class="close center">
                        <span id="btnClose" onclick=${reject}>&times;</span>
                    </div>
                </div>
                <div class="modal-body delete">
                    <div>
                        <span>Are you sure you want to delete ${count} records ?</span>
                    </div>
                    <div style="display: flex; justify-content: center;">
                        <div class="btn-group">
                            <button onclick=${reject} style="font-size: 16px;">&#10005; Cancel</button>
                            <button onclick=${resolve} style="font-size: 16px; background-color: red;">&#9888; Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
        node.style.display = 'flex';
    });
}