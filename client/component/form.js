const { html, render } = lighterhtml,
config = {
    selectOptions: [
        { value: '*/5 * * * * *', display: '5 Seconds' },
        { value: '*/10 * * * * *', display: '10 Seconds' },
        { value: '*/20 * * * * *', display: '20 Seconds' },
        { value: '*/40 * * * * *', display: '40 Seconds' },
        { value: '* * * * *', display: '60 Seconds' },
    ],
    protocolOptions: [
        { value: 'TCP', display: 'TCP', port: "", isTCPDisabled: false },
        { value: 'HTTP', display: 'HTTP', port: "80", isTCPDisabled: true },
        { value: 'HTTPS', display: 'HTTPS', port: "443", isTCPDisabled: true },
    ],
    requestMethodOptions: [
        { value: 'GET', display: 'GET' },
        { value: 'POST', display: 'POST' }
    ],
    successWhenOptions: [
        { value: '1', display: 'Include' },
        { value: '2', display: 'Exclude' }
    ],
    required: ['protocol', 'scheduleInterval', 'timeout', 'url', 'port']
}

let state = {};

const defaultValues = () => ({
    id: null,
    protocol: 'TCP',
    timeout: 2500,
    url: '',
    port: '',
    scheduleInterval: '*/5 * * * * *',
    requestMethod: '',
    successWhen: '',
    successStatus: '',
    headers: '',
    body: ''
});

const onIntervalChange = (event) => {
    const value = getSelectedValue(event);

    state.data.scheduleInterval = value;
    _render(state);
}

const toggleCustom = (event) => {
    const { checked } = event.target;
    state.appState.isCustomEnable = checked;
    _render(state);
}

const onProtocolChange = (event) => {
    const value = getSelectedValue(event);

    const found = config.protocolOptions.find(x => x.value === value);
    state.data = {
        ...state.data,
        protocol: value,
        port: found.port,
        timeout: 2500,
        headers: '',
        body: '',
        successWhen: value === 'TCP' ? '' : '1',
        successStatus: value === 'TCP' ? '' : '200',
        requestMethod: value === 'TCP' ? '' : 'GET',
    };
    state.appState = {
        ...state.appState,
        isBodyDisabled: true
    };
    state.appState.isTCPDisabled = found.isTCPDisabled;
    _render(state);
}

const onValueChange = (event) => {
    const { value, name } = event.target;
    const { data, appState } = state;
    data[name] = value;
    appState.isSaveDisabled = isFormValid(config.required, data);
    _render(state);
}

const isFormValid = (column, data) => {
    return !column.every(x => data[x]);
}

const getSelectedValue = (event) => {
    const { options, selectedIndex } = event.target;
    return options[selectedIndex].value;
}

const onRequestMethodChange = (event) => {
    const value = getSelectedValue(event);

    state.data = {
        ...state.data,
        requestMethod: value
    }
    state.appState = {
        ...state.appState,
        isBodyDisabled: value !== 'POST'
    }
    _render(state);
}

const close = () => {
    state.node.style.display = 'none';
}

const save = () => {
    const { mode, data, handlers } = state;
    handlers.save(mode, data);
    close();
}

const onSuccessWhenChange = (event) => {
    const value = getSelectedValue(event);

    state.data = {
        ...state.data,
        successWhen: value,
        successStatus: ''
    }
    _render(state);
}

const appStateDefault = (data) => {
    const { protocol, requestMethod } = data;
    return {
        isCustomEnable: false,
        isTCPDisabled: protocol !== 'TCP',
        isSaveDisabled: isFormValid(config.required, data),
        isBodyDisabled: requestMethod === 'GET'
    }
}

export const createFormComponent = ({ node, handlers, data, mode = 'add' }) => {
    const defaultValue = defaultValues()
    state = {
        node,
        handlers,
        mode,
        data: Object.assign(defaultValue, data || {}),
        appState: appStateDefault(data || defaultValue)
    };
    _render(state);
    node.style.display = 'flex';
}

const _render = ({ node, mode, data, appState }) => {
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
                            <input type="hidden" name="id" />
                            <label>Request <span class="requied">*</span></label>
                        </div>
                        <div>
                            <select style="padding: 5px 0;" onchange=${onProtocolChange}>
                                ${ config.protocolOptions.map(x => html`<option value=${x.value} selected=${x.value === data.protocol} >${x.display}</option>`)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <div>
                            <label>Schedule Interval <span class="requied">*</span></label>
                        </div>
                        <div>
                            <select style="padding: 5px 0;" onchange=${onIntervalChange} value=${data.scheduleInterval}>
                                ${ config.selectOptions.map(x => html`<option value=${x.value} selected=${x.value === data.scheduleInterval}>${x.display}</option>`)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <div>
                            <input type="checkbox" onchange=${toggleCustom} /> Custom
                        </div>
                        <div>
                            <input type="text" required name="schedule_interval" disabled=${!appState.isCustomEnable} value=${data.scheduleInterval} oninput=${onValueChange} autocomplete="off">
                        </div>
                    </div>
                    <div>
                        <div>
                            <label>Timeout <span class="requied">*</span></label>
                        </div>
                        <div>
                            <input type="text" required name="timeout" value=${data.timeout} oninput=${onValueChange} autocomplete="off">
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
                            <input type="number" required name="port" disabled=${appState.isTCPDisabled} value=${data.port} oninput=${onValueChange} autocomplete="off">
                        </div>
                    </div>
                    <div style="display: ${ appState.isTCPDisabled ? 'block': 'none'}">
                        <div>
                            <label>Request Method <span class="requied">*</span></label>
                        </div>
                        <div style="padding: .2em 0;">
                            <select style="padding: 5px 0;" onchange=${onRequestMethodChange}>
                                ${ config.requestMethodOptions.map(x => html`<option value=${x.value} selected=${x.value === data.requestMethod}>${x.display}</option>`)}
                            </select>
                        </div>
                        <div>
                            <label>Success when status code <span class="requied">*</span></label>
                        </div>
                        <div style="padding: .2em 0;">
                            <div style="display:grid; grid-template-columns: auto 1fr;">
                                <div>
                                    <select style="padding: 5px 0;" onchange=${onSuccessWhenChange}>
                                        ${ config.successWhenOptions.map(x => html`<option value=${x.value} selected=${x.value === data.successWhen}>${x.display}</option>`)}
                                    </select>
                                </div>
                                <div style="display:flex;">
                                    <input type="text" name="successStatus" value=${data.successStatus} oninput=${onValueChange} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label>Headers (json syntax)</label>
                        </div>
                        <div>
                            <textarea rows="3" name="headers" oninput=${onValueChange} value=${data.headers}></textarea>
                        </div>
                        <div style="display: ${appState.isBodyDisabled ? 'none' : 'block'}">
                            <div>
                                <label>Body (json syntax)</label>
                            </div>
                            <div>
                                <textarea rows="3" name="body" oninput=${onValueChange} value=${data.body}></textarea>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: flex-end;">
                        <div class="btn-group">
                            <button onclick=${close} style="font-size: 16px;">&#10005; Cancel</button>
                            <button onclick=${save} disabled=${appState.isSaveDisabled} style="font-size: 16px;">&#10003; ${mode === 'clone' ? 'Clone': 'Save'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`);
}