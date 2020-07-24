const { html, render } = lighterhtml;
import { createCircle } from '../template.js';

export const createStatusComponent = (node, filterGrid, { total, green, red, gray }) => {
        const config = [
            { value: 1, svg: createCircle('red'), color: red, status: 'Failed' },
            { value: 2, svg: createCircle('green'), color: green, status: 'Active' },
            { value: 3, svg: createCircle('gray'), color: gray, status: 'Suspened' }
        ]
        render(node, html `
        <div style="display:flex;">
            <div style="padding: 0 .2em; display:flex; border-right:1px solid #babfc7;">
                <div style="display:flex; align-items:center;">
                    <div>
                        <span style="vertical-align: middle;">Count: <b>${total}</b></span>
                    </div>
                </div>
            </div>
            ${ config.map(x => 
                html`
                    <div style="padding: 0 .4em; display: flex; border-right:1px solid #babfc7;">
                        <div style="display:flex; align-items:center;">
                            <div>
                                <input type="checkbox" style="vertical-align: middle;" onchange=${filterGrid} value=${x.value} /> 
                            </div>
                            <div style="display: flex;">
                                ${x.svg}
                            </div>
                            <div>
                                ${x.status}: <b>${x.color}</b>
                            </div>
                        </div>
                    </div>
                `)
            }
        <div>
    `);
}