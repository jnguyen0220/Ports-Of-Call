const { html } = lighterhtml;

export const createCircleString = (color) => {
    return `
        <svg class="center" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
            <circle cx="50%" cy="50%" r="8" fill="${ color || 'grey' }" />
        </svg>
    `
}

export const createCircle = (color) => {
    return html `
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
            <circle cx="50%" cy="50%" r="8" fill="${ color || 'grey' }" />
        </svg>
    `;
}