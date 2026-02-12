import React from 'react';
import { FormSpy } from 'react-final-form';
import { debounce, isEqual, DebouncedFunc } from 'lodash';

type AutoSaveValues = Record<string, unknown>;

interface AutoSaveProps {
  values: AutoSaveValues;
  save: (values: AutoSaveValues) => void;
  debounce: number;
}

interface AutoSaveState {
  values: AutoSaveValues;
  submitting: boolean;
}

class AutoSave extends React.Component<AutoSaveProps, AutoSaveState> {
  private saveDebounce: DebouncedFunc<() => void>;

  constructor(props: AutoSaveProps) {
    super(props);

    this.state = { values: props.values, submitting: false };

    this.saveDebounce = debounce(this.save, props.debounce);
  }

  save = () => {
    const { values, save } = this.props;

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

  render(): null {
    return null;
  }
}

type AutoSaveWrapperProps = Omit<AutoSaveProps, 'values'>;

export default (props: AutoSaveWrapperProps) => (
  <FormSpy subscription={{ values: true }}>
    {({ values }) => (
      <AutoSave {...props} values={(values as AutoSaveValues) ?? {}} />
    )}
  </FormSpy>
);
