import { Component, render, h } from 'preact';
import { LiliumText } from './liliumtext';
import testmarkup from './testmarkup';

class DevEnv extends Component {
    render() {
        return (
            <div>
                <h1>Lilium Text dev environment</h1>
                <LiliumText markup={testmarkup} dev />
            </div>
        );
    }
};

render(<DevEnv />, document.getElementById('devapp'));
