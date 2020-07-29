const pickProperties = (props, data) => {
    return props.reduce((a, c) => ({
        ...a,
        [c]: data[c]
    }), {});
}

const fields = [
    "protocol",
    "scheduleInterval",
    "timeout",
    "url",
    "port",
    "requestMethod",
    "headers",
    "successWhen",
    "successStatus",
    "body"
];

export const cleanObject = (data) => pickProperties(fields, data)