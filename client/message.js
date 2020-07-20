const socket = io();

const update = (gridApi) => (msg) => {
    const rowNode = gridApi.getRowNode(msg.id);
    if (rowNode) {
        const sort = [
                { colId: 'status', sort: 'asc' },
            ],
            updateItem = {...rowNode.data, ...msg };
        gridApi.applyTransactionAsync({ update: [updateItem] });
        msg.status === 1 && gridApi.setSortModel(sort);
    }
}

const add = (gridApi) => (msg) => {
    gridApi.applyTransaction({ add: msg });
}

const remove = (gridApi) => (msg) => {
    const rowNode = gridApi.getRowNode(msg);
    gridApi.applyTransaction({ remove: [rowNode.data] });
}

export const Message = (gridApi, clientConnect) => {
    [
        { topic: 'add', func: add(gridApi) },
        { topic: 'remove', func: remove(gridApi) },
        { topic: 'init', func: clientConnect },
        { topic: 'update', func: update(gridApi) },
    ].forEach(x => socket.on(x.topic, x.func));
}

export const Send = (topic, message) => {
    socket.emit(topic, message);
}