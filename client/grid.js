import { createCircleString } from './template.js'
const { html, render } = lighterhtml;

const convertToLocalTimeString = (params) => {
    return new Date(params.value).toLocaleTimeString();
}

const convertToLocaleString = (params) => {
    return new Date(params.value).toLocaleString();
}

const isFirstColumn = (params) => {
    const displayedColumns = params.columnApi.getAllDisplayedColumns();
    const thisIsFirstColumn = displayedColumns[0] === params.column;
    return thisIsFirstColumn;
}

const btnRemoveRenderer = (onActionMenu) => (value) => {
    const onClick = (mode) => () => {
        onActionMenu(mode, value.data)
    }

    return html.node `
        <div class="btn-group">
            <button title="edit" onclick=${onClick('edit')}>&#9998</button>
            <button title="clone" onclick=${onClick('clone')}>&#x21CA</button>
        </div>
    `;
}

const config_color = new Map([
    [1, '&#128308'],
    [2, '&#128994'],
    [3, '&#128280']
]);

const availableIndicator = (params) => {
    return config_color.get(params.value) || '&#128280';
}

const columnDefs = (onActionMenu) => ([{
        headerName: "Action",
        cellClass: ['center'],
        cellRenderer: btnRemoveRenderer(onActionMenu)
    },
    { headerName: "Available", field: "status", cellRenderer: availableIndicator, sortable: true, suppressMenu: true },
    { headerName: "Uptime", field: "uptime", suppressMenu: true, valueFormatter: (params) => params.value ? `${params.value} %` : '' },
    { headerName: "Last Ping Time", field: "lastPingDate", cellRenderer: 'agAnimateShowChangeCellRenderer', valueFormatter: convertToLocalTimeString },
    { headerName: "Last Status Change", field: "lastStatusChange", cellRenderer: 'agAnimateShowChangeCellRenderer', valueFormatter: convertToLocaleString },
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
]);

export const gridOptions = (onRowSelected, onRowDataUpdated, doesExternalFilterPass, onActionMenu) => ({
    columnDefs: columnDefs(onActionMenu),
    getRowNodeId: (data) => {
        return data.id;
    },
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        resizable: true,
        headerCheckboxSelection: isFirstColumn,
        checkboxSelection: isFirstColumn,
    },
    isExternalFilterPresent: () => true,
    doesExternalFilterPass: doesExternalFilterPass,
    suppressCellSelection: true,
    suppressRowClickSelection: true,
    rowSelection: 'multiple',
    onRowSelected,
    animateRows: true,
    onRowDataUpdated,
    onRowDataChanged: onRowDataUpdated,
    onFilterChanged: onRowDataUpdated
});