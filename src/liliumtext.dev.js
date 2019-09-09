import { Component, render, h } from 'preact';
import { LiliumText } from './liliumtext';

class DevEnv extends Component {
    render() {
        return (
            <div>
                <h1>Lilium Text dev environment</h1>
                <LiliumText dev />
            </div>
        );
    }
};

render(<DevEnv />, document.getElementById('devapp'));
