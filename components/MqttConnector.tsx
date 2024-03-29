import * as React from "react";
import { MqttConfig, MqttConnection, mqttConnection } from "../mqtt";
import { StoreState, AccessToken } from "../types";
import { connect } from "react-redux";
import { REACT_APP_API_URL } from 'react-native-dotenv';

/**
 * Component props
 */
interface Props {
  accessToken?: AccessToken;
  children?: React.ReactNode;
}

/**
 * Component state
 */
interface State {
  options?: MqttConfig;
}

/**
 * MQTT connector component
 */
class MqttConnector extends React.Component<Props, State> {

  private connection: MqttConnection;

  /**
   * Constructor
   *
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.connection = mqttConnection;
    this.state = { };
  }

  /**
   * Component did update life-cycle event
   *
   * @param prevProps previous props
   * @param prevState previous state
   */
  public async componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.props.accessToken !== prevProps.accessToken) {
      const options = await this.getConnectionOptions();
      this.setState({ options: options });
    }

    if (this.state.options !== prevState.options) {
      this.connection.disconnect();

      if (this.state.options) {
        this.connection.connect(this.state.options);
      }
    }
  }

  /**
   * Component will unmount life-cycle event
   */
  public componentWillUnmount() {
    this.connection.disconnect();
  }

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    this.setState({
      options: await this.getConnectionOptions()
    });
  }

  /**
   * Component render method
   *
   * @return returns child components
   */
  public render() {
    return this.props.children;
  }

  /**
   * Loads MQTT connection options from the server
   */
  private async getConnectionOptions(): Promise<MqttConfig | undefined> {
    if (!this.props.accessToken) {
      return undefined;
    }

    const response = await fetch(`${REACT_APP_API_URL}/mqtt/connection`, {
      headers: { "Authorization": `Bearer ${this.props.accessToken.access_token}` }
    });

    return await response.json();
  }
}

/**
 * Redux mapper for mapping store state to component props
 *
 * @param state store state
 */
function mapStateToProps(state: StoreState) {
  return {
    accessToken: state.accessToken
  }
}

export default connect(mapStateToProps)(MqttConnector);