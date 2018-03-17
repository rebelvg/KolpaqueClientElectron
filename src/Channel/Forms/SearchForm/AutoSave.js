import React from 'react';
import {FormSpy} from 'react-final-form';
import {debounce, isEqual} from 'lodash';

class AutoSave extends React.Component {
    constructor(props) {
        super(props);
        this.state = {values: props.values, submitting: false};
        this.setFilter = debounce(this.save, props.debounce);
    }

    save = () => {
        const {values, save} = this.props;
        if (!isEqual(this.state.values, values)) {
            save(values);
        }
    };

    componentWillReceiveProps() {
        this.setFilter();
    }

    render() {
        return null;
    }
}

export default props => (
    <FormSpy {...props} subscription={{values: true}} component={AutoSave}/>
)
