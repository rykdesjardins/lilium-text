import { Component, h } from 'preact';
import { LiliumTextToolBar } from './toolbar';
import { LiliumTextEditor } from './editor';
import { LiliumTextStatusBar } from './statusbar';

export class LiliumText extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dev : props.dev
        };
    }

    componentWillReceiveProps(props) {

    }

    render() {
        return (
            <div class="lilium-text">
                <LiliumTextToolBar />
                <LiliumTextEditor />
                <LiliumTextStatusBar />
            </div>
        );
    }
};

