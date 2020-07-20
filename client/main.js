import { createFormComponent } from './component/form.js';
import { createToolBtnGroupComponent } from './component/toolBtnGroup.js';
import { createStatusComponent } from './component/status.js';
import { gridOptions } from './grid.js';
import { deleteFormComponent } from './component/confirm.js';
import { Message, Send } from './message.js';
const { html, render } = lighterhtml;
const socket = io();

let externalFilter = [];

const onRowSelected = (event) => {
    const selectedRows = grid.api.getSelectedRows();
    renderToolBtnGroupComponent({
        isDeleteDisabled: selectedRows.length === 0,
        isToggleDisabled: selectedRows.length === 0
    });
}

const onRowDataUpdated = () => {
    statusUpdate();
}

const onActionMenu = (mode, data) => {
    createFormComponent({ node: domElement.get('MODAL'), handlers: { save }, data, mode });
}

const doesExternalFilterPass = (node) => {
    return externalFilter.length ? externalFilter.some(x => x === node.data.status) : true;
}

const grid = gridOptions(onRowSelected, onRowDataUpdated, doesExternalFilterPass, onActionMenu);

const toggle = () => {
    const selectedRows = grid.api.getSelectedRows();
    Send('toggle', selectedRows.map(x => x.id));
    grid.api.deselectAll();
}

const save = (mode, data) => {
    Send(mode, data);
}

const add = () => {
    createFormComponent({ node: domElement.get('MODAL'), handlers: { save } });
}

const editJob = (item) => {
    const { data } = grid.api.getRowNode(item.id);
    loadFormData(data, 'Edit', 'Save');
}

const cloneJob = (item) => {
    const { data } = grid.api.getRowNode(item.id);
    loadFormData(data, "Clone", 'Clone');
}

const onFilterTextBoxChanged = (event) => {
    const { value } = event.target;
    grid.api.setQuickFilter(value);
}

const clientConnect = ({ serverStartDate, schedule }) => {
    const serverStart = new Date(serverStartDate),
        monitor_html = html `
                Monitor since: ${serverStart.toLocaleString()}
            `,
        copyright_html = html `
                <div class="text-right">Copyright © ${serverStart.getFullYear()} by <a href="mailto:jonny_nguyen@outlook.com">Jonny Nguyen</a></div>
            `;

    render(document.getElementById('copyright_node'), copyright_html);
    render(document.getElementById('monitor_node'), monitor_html)
    grid.api.setRowData(schedule);
    grid.api.sizeColumnsToFit();
}

const domElement = new Map();

const domControlInit = () => {
    domElement.set('MODAL', document.getElementById('mdlAdd'));
    domElement.set('SEARCH', document.getElementById('searchTxt'));
    domElement.set('IMPORT', document.getElementById('hiddenUpload'));
    domElement.set('TOOL', document.getElementById('toolBtnGroup'));
    domElement.set('STATUS', document.getElementById('status'));
};

const setupSearchText = (node) => {
    render(node, html `
        <input type="text" class="filter" placeholder="Filter..." oninput="${onFilterTextBoxChanged}" />
    `);
}

const setupUpload = (node) => {
    const onClick = (event) => event.target.value = null;
    render(node, html `
        <input type="file" onchange=${upload} onclick=${onClick} style="display:none" />
    `);
}

const config_count = {
    defaultValues: () => ({
        total: 0,
        green: 0,
        red: 0,
        gray: 0
    }),
    lookup: [
        { key: 1, value: 'red' },
        { key: 2, value: 'green' },
        { key: 3, value: 'gray' },
    ]
}

const filterGrid = (event) => {
    const { value, checked } = event.target;
    const _value = Number(value);
    externalFilter = checked ? externalFilter.concat(_value) : externalFilter.filter(x => x !== _value);
    grid.api.onFilterChanged();
}

const statusUpdate = () => {
    const result = getStatusCount(config_count);
    createStatusComponent(domElement.get('STATUS'), filterGrid, result);
}

const getStatusCount = (config_count) => {
    const status = config_count.defaultValues();

    grid.api.forEachNodeAfterFilter(x => {
        status.total += 1;
        const found = config_count.lookup.find(y => y.key === x.data.status);
        status[found ? found.value : 'gray'] += 1
    });
    return status;
}

document.addEventListener('DOMContentLoaded', () => {
    domControlInit();
    new agGrid.Grid(document.getElementById('mainGrid'), grid);

    const monitor = document.getElementById('monitor_node'),
        copyright = document.getElementById('copyright_node'),
        upload = document.getElementById('hiddenUpload'),
        search = domElement.get('SEARCH');

    setupSearchText(search);
    setupUpload(upload);

    Message(grid.api, clientConnect);
    renderToolBtnGroupComponent();
    domElement.get('IMPORT').querySelector('input').onClick = (event) => {
        console.log('test');
        event.target.value = null;
    }
});

const renderToolBtnGroupComponent = (state) => {
    createToolBtnGroupComponent(domElement.get('TOOL'), { add, remove, upload: preUpload, toggle, download }, state);
}

const preUpload = () => {
    const element = domElement.get('IMPORT').querySelector('input');
    element.click();
}

const upload = async(evt) => {
    const element = domElement.get('IMPORT').querySelector('input');
    try {
        const data = await readFileAsync(element.files[0]);
        socket.emit('import', data);
    } catch (e) {
        console.log(e);
    }
}

const readFileAsync = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(JSON.parse(reader.result));
        };
        reader.onerror = reject;
        reader.readAsText(file);
    })
}

const pickProperties = (props, data) => {
    return props.reduce((a, c) => ({
        ...a,
        [c]: data[c]
    }), {});
}

const download = () => {
    const data = getDownloadData(),
        dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data,null,2))}`,
        element = document.getElementById('hiddenDownload');

    element.setAttribute("href", dataStr);
    element.setAttribute("download", "export.json");
    element.click();
}

const getDownloadData = () => {
    const data = [],
        props = [
            "schedule_interval",
            "url",
            "port"
        ];

    grid.api.forEachNodeAfterFilterAndSort(x => data.push(x.data));
    return data.map(x => pickProperties(props, x));
}

const remove = async() => {
    const selectedRows = grid.api.getSelectedRows();
    const modal = domElement.get('MODAL');
    try {
        await deleteFormComponent(modal, selectedRows.length);
        Send('remove', selectedRows.map(x => x.id));
    } catch (e) {} finally {
        modal.style.display = 'none';
    }
}