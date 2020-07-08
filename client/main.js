const socket = io();

const availableIndicator = (params) => {
    return `<span>${params.value ? "&#128994;" : "&#128308;"}</span>`;
}

const removeJob = (data) => {
    socket.emit('remove', data.id);
}

const btnRemoveRenderer = (value) => {
    const { url, port } = value.data;
    const button = document.createElement('button');
    button.innerHTML = '🗑️';
    button.title = `Remove ${url}:${port}`;
    button.style = "padding: .3em .5em";
    button.onclick = () => {
        if (confirm(`Are you sure you want to remove ${url}:${port}`)) {
            removeJob(value.data);
        }
    }
    return button;
}

const columnDefs = [{
        headerName: "Action",
        cellRenderer: btnRemoveRenderer,
    },
    { headerName: "Last Ping Time", field: "lastPingDate", cellRenderer: 'agAnimateShowChangeCellRenderer' },
    { headerName: "Available", field: "status", cellRenderer: availableIndicator, sortable: true, suppressMenu: true },
    {
        headerName: "Url",
        field: "url",
        filter: 'agTextColumnFilter',
        filterParams: {
            buttons: ['reset', 'apply'],
        },
    },
    { headerName: "Port", field: "port" },
    { headerName: "Schedule_Interval", field: "schedule_interval" }
];

const gridOptions = {
    columnDefs: columnDefs,
    getRowNodeId: (data) => {
        return data.id;
    },
    suppressCellSelection: true
};

const domElement = new Map();

const domControlInit = () => {
    domElement.set('ADD', document.getElementById('btnAdd'));
    domElement.set('MODAL', document.getElementById('mdlAdd'));
    domElement.set('CLOSE', document.getElementById("btnClose"));
    domElement.set('SAVE', document.getElementById('btnSave'));
    domElement.set('SELECT', document.getElementById('sltInterval'));
    domElement.set('CUSTOM', document.getElementById('chkCustom'));
    domElement.set('FORM_ITEMS', document.getElementById('frmAdd').querySelectorAll('[name]'));
    domElement.set('GRID', document.getElementById('myGrid'));
    domElement.set('CURRENT_YEAR', document.getElementById('currentYear'));
};

const getFormItem = (name) => {
    return Array.from(domElement.get('FORM_ITEMS')).find(x => x.name === name);
}

const domControlEventInit = () => {
    const select = domElement.get('SELECT'),
        custom = domElement.get('CUSTOM'),
        modal = domElement.get('MODAL'),
        add = domElement.get('ADD'),
        close = domElement.get('CLOSE'),
        save = domElement.get('SAVE'),
        year = domElement.get('CURRENT_YEAR'),
        formItems = domElement.get('FORM_ITEMS');

    const now = new Date();
    year.innerHTML = now.getFullYear();

    select.onchange = () => {
        const value = select.options[select.selectedIndex].value,
            element = getFormItem('schedule_interval');
        element.value = value;
    }

    custom.onchange = () => {
        const checked = custom.checked,
            element = getFormItem('schedule_interval');
        element.disabled = !checked;
    }

    save.onclick = () => {
        const result = getFormData(formItems);
        socket.emit('new', result);
        close.click();
    }

    add.onclick = () => {
        formReset(save, formItems);
        formDefault();
        custom.checked = false;
        const element = getFormItem('schedule_interval');
        element.disabled = true;
        select.selectedIndex = 0;
        modal.style.display = 'flex';
    }

    close.onclick = () => modal.style.display = "none";
    formOnChange(save, formItems);
}

document.addEventListener('DOMContentLoaded', () => {
    domControlInit();
    domControlEventInit();
    new agGrid.Grid(domElement.get('GRID'), gridOptions);
});

const formDefault = () => {
    [
        { field: 'port', value: 80 },
        { field: 'schedule_interval', value: '*/5 * * * * *' }
    ].forEach(x => {
        const element = getFormItem(x.field);
        element.value = x.value
    });
}

const enableSaveButton = (save, status) => {
    save.className = `save-button ${status ? 'save-button-enabled' : 'save-button-disabled'}`;
}

const formOnChange = (save, formItems) => {
    formItems.forEach(x => x.oninput = () => {
        const valid = formValid(formItems);
        enableSaveButton(save, valid);
    })
}

const formValid = (formItems) => {
    let result = true;
    formItems.forEach(x => {
        result = x.required && !!x.value && result;
    })
    return result;
}

const formReset = (save, formItems) => {
    formItems.forEach(x => x.value = "");
    enableSaveButton(save, false);
}

const getFormData = (items) => {
    let result = {};
    items.forEach(x => {
        result[x.name] = x.value
    });
    return result;
}

const topicUpdate = (msg) => {
    const { id, lastPingDate, status } = msg;
    const rowNode = gridOptions.api.getRowNode(id);
    if (rowNode) {
        updateItem = {...rowNode.data, lastPingDate, status };
        gridOptions.api.applyTransactionAsync({ update: [updateItem] });
        const sort = [
            { colId: 'status', sort: 'asc' },
        ]
        gridOptions.api.setSortModel(sort);
    }
}

const topicNew = (msg) => {
    gridOptions.api.applyTransaction({ add: [msg] });
}

const topicRemove = (msg) => {
    const rowNode = gridOptions.api.getRowNode(msg);
    gridOptions.api.applyTransaction({ remove: [rowNode.data] });
}

const topicInit = (msg) => {
    gridOptions.api.setRowData(msg);
    gridOptions.api.sizeColumnsToFit();
}

[
    { topic: 'new', func: topicNew },
    { topic: 'remove', func: topicRemove },
    { topic: 'init', func: topicInit },
    { topic: 'update', func: topicUpdate },

].forEach(x => socket.on(x.topic, x.func));