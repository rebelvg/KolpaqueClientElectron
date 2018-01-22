import React from 'react'
import {FormSpy} from 'react-final-form'
import {debounce} from 'lodash'

class AutoSave extends React.Component {
    constructor(props) {
        super(props)
        this.state = {values: props.values, submitting: false}
        this.setFilter = debounce(this.save, props.debounce)
    }

    save = (values) => {
        this.props.save(values);
    }

    componentWillReceiveProps(nextProps) {
        this.setFilter(nextProps.values)
    }


    render() {
        // This component doesn't have to render anything, but it can render
        // submitting state.
        return null
    }
}

// Make a HOC
// This is not the only way to accomplish auto-save, but it does let us:
// - Use built-in React lifecycle methods to listen for changes
// - Maintain state of when we are submitting
// - Render a message when submitting
// - Pass in debounce and save props nicely
export default props => (
    <FormSpy {...props} subscription={{values: true}} component={AutoSave}/>
)
