import React from 'react';
import { FormSpy } from 'react-final-form';
import { debounce, isEqual } from 'lodash';

class AutoSave extends React.Component<any, any> {
  private saveDebounce;

  constructor(props) {
    super(props);

    console.log('AutoSave', props);

    this.state = { values: props.values, submitting: false };

    this.saveDebounce = debounce(this.save, props.debounce);
  }

  save = () => {
    const { values, save } = this.props;

    console.log('save', values, this.state);

    if (!isEqual(this.state.values, values)) {
      this.setState(
        {
          values,
        },
        () => {
          save(values);
        },
      );
    }
  };

  componentWillReceiveProps() {
    this.saveDebounce();
  }

  render() {
    return null;
  }
}

export default (props) => (
  <FormSpy {...props} subscription={{ values: true }} component={AutoSave} />
);
