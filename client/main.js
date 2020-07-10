const socket = io();

const availableIndicator = (params) => {
    const config = {
        1: 'red',
        2: 'green',
        3: 'grey'
    };
    return `
        <svg class="center" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
            <circle cx="50%" cy="50%" r="8" fill="${config[params.value] || 'grey'}" />
        </svg>
    `;
}

const toggleJob = (data) => {
    socket.emit('toggle', data.id);
}

const loadFormData = (data, title, saveButtonTitle) => {
    const isRemove = title === 'Remove',
        modal = domElement.get('MODAL'),
        save = domElement.get('SAVE'),
        select = domElement.get('SELECT'),
        custom = domElement.get('CUSTOM'),
        modalTitle = domElement.get('MODAL_TITLE'),
        formItem = domElement.get('FORM_ITEMS'),
        formData = Object.keys(data).map(x => ({
            field: x,
            value: data[x]
        })),
        element = getFormItem('schedule_interval');

    element.disabled = true;
    custom.disabled = isRemove;
    save.innerHTML = saveButtonTitle;
    save.style = `background: ${ isRemove ? 'rgb(223, 117, 20)' : 'rgb(66, 184, 221)'};`;
    modalTitle.innerHTML = title;
    select.value = data.schedule_interval;
    select.disabled = isRemove;
    Array.from(formItem).forEach(x => {
        x.disabled = isRemove
    });
    element.disabled = true;
    setFormData(formData);
    enableSaveButton(save, true);
    modal.style.display = 'flex';
}

const editJob = (item) => {
    const { data } = gridOptions.api.getRowNode(item.id);
    loadFormData(data, 'Edit', 'Save');
}

const removeJob = (item) => {
    const { data } = gridOptions.api.getRowNode(item.id);
    loadFormData(data, "Remove", 'Remove');
}

const cloneJob = (item) => {
    const { data } = gridOptions.api.getRowNode(item.id);
    loadFormData(data, "Clone", 'Clone');
}

const btnRemoveRenderer = (value) => {
    const { data } = value,
    config = new Map([
            ['Edit', editJob],
            ['Clone', cloneJob],
            ['Remove', removeJob],
            ['Toggle', toggleJob]
        ]),
        select = document.createElement('select'),
        empty = document.createElement("option");

    empty.value = "";
    select.appendChild(empty);

    Array.from(config.keys()).forEach(x => {
        const option = document.createElement("option");
        option.value = x;
        option.innerHTML = x;
        select.appendChild(option);
    });

    select.onchange = () => {
        config.get(select.value)(data);
        select.value = "";
        select.blur();
    };
    return select;
}

const convertToLocalDates = (params) => {
    return new Date(params.value).toLocaleTimeString();
}

const columnDefs = [{
        headerName: "Action",
        cellRenderer: btnRemoveRenderer
    },
    { headerName: "Available", field: "status", cellRenderer: availableIndicator, sortable: true, suppressMenu: true, cellClass: ['center'] },
    { headerName: "Last Ping Time", field: "lastPingDate", cellRenderer: 'agAnimateShowChangeCellRenderer', valueFormatter: convertToLocalDates },
    { headerName: "Last Status Change", field: "lastStatusChange", cellRenderer: 'agAnimateShowChangeCellRenderer', valueFormatter: convertToLocalDates },
    {
        headerName: "Url",
        field: "url",
        filter: 'agTextColumnFilter',
        filterParams: {
            buttons: ['reset', 'apply'],
        },
    },
    { headerName: "Port", field: "port" },
    { headerName: "Schedule_Interval", field: "schedule_interval", cellRenderer: 'agAnimateShowChangeCellRenderer' }
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
    domElement.set('MONITOR', document.getElementById('monitorDate'));
    domElement.set('CUSTOM', document.getElementById('chkCustom'));
    domElement.set('FORM_ITEMS', document.getElementById('frmAdd').querySelectorAll('[name]'));
    domElement.set('GRID', document.getElementById('myGrid'));
    domElement.set('MODAL_TITLE', document.getElementById('mdlTitle'));
    domElement.set('CURRENT_YEAR', document.getElementById('currentYear'));
};

const getFormItem = (name) => {
    return Array.from(domElement.get('FORM_ITEMS')).find(x => x.name === name);
}

const setClientDates = (serverStartDate) => {
    const monitor = domElement.get('MONITOR'),
        year = domElement.get('CURRENT_YEAR');

    year.innerHTML = serverStartDate.getFullYear();
    monitor.innerHTML = serverStartDate.toLocaleString();
}

const domControlEventInit = () => {
    const select = domElement.get('SELECT'),
        custom = domElement.get('CUSTOM'),
        modal = domElement.get('MODAL'),
        add = domElement.get('ADD'),
        close = domElement.get('CLOSE'),
        save = domElement.get('SAVE'),
        formItems = domElement.get('FORM_ITEMS');

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
        const data = getFormData(formItems);
        switch (save.innerHTML) {
            case "Remove":
                socket.emit('remove', Number(data.id));
                break;
            case "Clone":
                const { id, ...rest } = data;
                socket.emit('new', rest);
                break;
            default:
                socket.emit('new', data);
                break;

        }
        close.click();
    }

    add.onclick = () => {
        formReset(save, formItems);
        loadFormData({
            port: 80,
            schedule_interval: '*/5 * * * * *'
        }, 'New', 'Save');
        select.selectedIndex = 0;
        enableSaveButton(save, false);
    }

    close.onclick = () => modal.style.display = "none";
    formOnChange(save, formItems);
}

document.addEventListener('DOMContentLoaded', () => {
    domControlInit();
    domControlEventInit();
    new agGrid.Grid(domElement.get('GRID'), gridOptions);
});

const setFormData = (data) => {
    data.forEach(x => {
        const element = getFormItem(x.field);
        element && (element.value = x.value);
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
    return Array.from(formItems).filter(x => x.required).every(x => x.value)
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
    const rowNode = gridOptions.api.getRowNode(msg.id);
    if (rowNode) {
        const sort = [
            { colId: 'status', sort: 'desc' },
        ]
        updateItem = {...rowNode.data, ...msg };
        gridOptions.api.applyTransactionAsync({ update: [updateItem] });
        msg.status === 1 && gridOptions.api.setSortModel(sort);
    }
}

const topicNew = (msg) => {
    gridOptions.api.applyTransaction({ add: [msg] });
}

const topicRemove = (msg) => {
    const rowNode = gridOptions.api.getRowNode(msg);
    gridOptions.api.applyTransaction({ remove: [rowNode.data] });
}

const topicInit = ({ serverStartDate, schedule }) => {
    setClientDates(new Date(serverStartDate));
    gridOptions.api.setRowData(schedule);
    gridOptions.api.sizeColumnsToFit();
}

[
    { topic: 'new', func: topicNew },
    { topic: 'remove', func: topicRemove },
    { topic: 'init', func: topicInit },
    { topic: 'update', func: topicUpdate },

].forEach(x => socket.on(x.topic, x.func));