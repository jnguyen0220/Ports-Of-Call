const { html, render } = lighterhtml,
selectOptions = [
    { value: '*/5 * * * * *', display: '5 Seconds' },
    { value: '*/10 * * * * *', display: '10 Seconds' },
    { value: '*/20 * * * * *', display: '20 Seconds' },
    { value: '*/40 * * * * *', display: '40 Seconds' },
    { value: '* * * * *', display: '60 Seconds' },
];

let state = {};

const defaultValues = () => ({
    id: null,
    url: '',
    port: 80,
    schedule_interval: '*/5 * * * * *',
    isCustomEnable: true,
    isSaveDisabled: true
});

const onIntervalChange = (event) => {
    const { options, selectedIndex } = event.target,
        value = options[selectedIndex].value;

    state.data.schedule_interval = value;
    createFormComponent({...state });
}

const toggleCustom = (event) => {
    const { checked } = event.target;
    state.data.isCustomEnable = !checked;
    createFormComponent({...state });
}

const onValueChange = (event) => {
    const { value, name } = event.target;
    const { data } = state;
    data[name] = value;
    data.isSaveDisabled = isFormValid(requiredColumn, data);
    createFormComponent({...state });
}

const requiredColumn = ['url', 'port', 'schedule_interval'];

const isFormValid = (column, data) => {
    return !column.every(x => data[x]);
}

const _save = () => {
    const { save } = state.handlers;
    save(state.mode, state.data);
    close();
}

const close = () => {
    state.node.style.display = 'none';
}

export const createFormComponent = ({ node, handlers, data = defaultValues(), mode = 'add' }) => {
        state = {
            node,
            handlers,
            data,
            mode
        };
        render(node, html `
        <div class="modal-content">
            <div class="modal-header">
                <div class="center">
                    <div>
                        ${mode.charAt(0).toUpperCase() + mode.slice(1)} Record
                    </div>
                </div>
                <div class="close center">
                    <span onclick=${close}>&times;</span>
                </div>
            </div>
            <div class="modal-body">
                <div class="data-form">
                    <div>
                        <div>
                            <label>Schedule Interval <span class="requied">*</span></label>
                        </div>
                        <div>
                            <input type="hidden" name="id" />
                            <select style="padding: 5px 0;" onchange=${onIntervalChange} value=${data.schedule_interval}>
                                ${ selectOptions.map(x => html`<option value=${x.value}>${x.display}</option>`)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <div>
                            <input type="checkbox" onchange=${toggleCustom} /> Custom
                        </div>
                        <div>
                            <input type="text" required name="schedule_interval" disabled=${data.isCustomEnable} value=${data.schedule_interval} oninput=${onValueChange} autocomplete="off">
                        </div>
                    </div>
                    <div>
                        <div>
                            <label>Url <span class="requied">*</span></label>
                        </div>
                        <div>
                            <input type="text" required name="url" value=${data.url} oninput=${onValueChange} autocomplete="off">
                        </div>
                    </div>
                    <div>
                        <div>
                            <label>Port <span class="requied">*</span></label>
                        </div>
                        <div>
                            <input type="number" required name="port" value=${data.port} oninput=${onValueChange} autocomplete="off">
                        </div>
                    </div>
                    <div>
                        <div class="btn-group right">
                            <button onclick=${close} style="font-size: 16px;">&#10005; Cancel</button>
                            <button onclick=${_save} disabled=${data.isSaveDisabled} style="font-size: 16px;">&#10003; ${mode === 'clone' ? 'Clone': 'Save'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`);
        node.style.display = 'flex';
}