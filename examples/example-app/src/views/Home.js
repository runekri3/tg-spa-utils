import React from 'react';

import './Home.css';
import { withView } from '../withView';


class Home extends React.Component {
    render() {
        return (
            <div className="Home">
                <p className="Home-intro">
                    Hello I'm home. Meow.
                </p>
            </div>
        );
    }
}

export default withView(Home);
