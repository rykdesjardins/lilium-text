import { Component, h } from 'preact';
import { LiliumTextToolBar } from './toolbar';
import { LiliumTextEditor } from './editor';
import { LiliumTextStatusBar } from './statusbar';

export class LiliumText extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dev : props.dev,
            markup : props.markup || ""
        };
    }

    componentWillReceiveProps(props) {

    }

    render() {
        return (
            <div class="lilium-text">
                <LiliumTextToolBar />
                <LiliumTextEditor markup={this.state.markup} />
                <LiliumTextStatusBar />
            </div>
        );
    }
};

