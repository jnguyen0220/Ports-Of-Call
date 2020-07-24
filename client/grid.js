import { createCircleString } from './template.js'
const { html } = lighterhtml;

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
            <button title="edit" onclick=${onClick('edit')}>Edit</button>
            <button title="clone" onclick=${onClick('clone')}>Clone</button>
        </div>
    `;
}

const config_color = new Map([
    [1, { svg: createCircleString('red'), display: 'Failed' }],
    [2, { svg: createCircleString('green'), display: 'Active' }],
    [3, { svg: createCircleString('gray'), display: 'Suspended' }]
]);

const availableIndicator = (params) => {
    const found = params.value ? config_color.get(params.value) : config_color.get(3);
    return `
        <div class="flex-center">
            <div class="flex-center">${found.svg}</div>
            ${found.display}
        </div> 
    `;
}

const columnDefs = (onActionMenu) => ([{
                headerName: "Action",
                cellRenderer: btnRemoveRenderer(onActionMenu)
            },
            { headerName: "Available", field: "status", cellRenderer: availableIndicator, sortable: true, suppressMenu: true },
            { headerName: "Uptime", field: "uptime", suppressMenu: true, valueFormatter: (params) => params.value ? `${params.value} %` : '', cellRenderer: 'agAnimateShowChangeCellRenderer' },
            { headerName: "Last Ping Time", field: "lastPingDate", cellRenderer: 'agAnimateShowChangeCellRenderer', valueFormatter: convertToLocalTimeString },
            { headerName: "Last Status Change", field: "timeAgo" },
            { headerName: "Protocol", field: "protocol", valueFormatter: (params) => `${params.value} ` + `${ params.value !== 'TCP' ? `(${params.data.requestMethod})` : ''}` }, 
    {
        headerName: "Url",
        field: "url",
        filter: 'agTextColumnFilter',
        cellRenderer: 'agAnimateShowChangeCellRenderer',
        valueFormatter: (params) => params.data.protocol !== 'TCP' ? `${params.data.protocol.toLowerCase()}://${params.value}` : params.value,
        filterParams: {
            buttons: ['reset', 'apply'],
        },
    },
    { headerName: "Port", field: "port", cellRenderer: 'agAnimateShowChangeCellRenderer' },
    { headerName: "Schedule_Interval", field: "scheduleInterval", cellRenderer: 'agAnimateShowChangeCellRenderer' }
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
        headerCheckboxSelectionFilteredOnly: true,
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