import React from "react";

import { Button, NativeBase } from "native-base";
import { ActivityIndicator } from "react-native";

interface Props extends Omit<NativeBase.Button, "onPress"> {
  onPress?: () => void | Promise<void>;
}

/**
 * Component state
 */
interface State {
  loading: boolean;
}

/**
 * Class for button component that performs asynchronous function calls
 */
class AsyncButton extends React.Component<Props, State> {

  /**
   * Component constructor
   *
   * @param props props
   */
  constructor(props: NativeBase.Button) {
    super(props);
    this.state = {
      loading: false
    }
  }

  /**
   * Component render
   */
  public render = () => {
    const { children, disabled } = this.props;
    const { loading } = this.state;

    return (
      <Button {...this.props} disabled={ loading ?? disabled } onPress={ this.handlePress }>
        { loading ? <ActivityIndicator /> : children }
      </Button>
    );
  }

  /**
   * Method for handling button press
   */
  private handlePress = async () => {
    const { onPress } = this.props;

    if (!onPress) {
      return;
    }

    this.setState({ loading: true });

    try {
      await onPress();
    } catch (error) {
      console.warn(error);
    }

    this.setState({ loading: false });
  }

}

export default AsyncButton;