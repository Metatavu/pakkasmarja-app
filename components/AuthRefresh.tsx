import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { StoreState, AccessToken } from "../types";
import * as actions from "../actions";
import Auth from "../utils/Auth";
import { Unread } from "pakkasmarja-client";
import PakkasmarjaApi from "../api";

/**
 * Component props
 */
interface Props {
  accessToken?: AccessToken;
  unreadsUpdate: (unreads: Unread[]) => void;
  onAccessTokenUpdate: (accessToken: AccessToken) => void;
};

/**
 * Component state
 */
interface State {

}

/**
 * Component for keeping authentication token fresh
 */
class AuthRefresh extends React.Component<Props, State> {

  private timer?: any;
  private unreadTimer: any;

  /**
   * Constructor
   *
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      eventData: { }
    };
  }

  /**
   * Component did mount life-cycle event
   */
  componentDidMount() {
    this.timer = setInterval(async () => {
      if (!this.props.accessToken) {
        return;
      }
      if (!Auth.isTokenValid(this.props.accessToken)) {
        const accessToken = await Auth.refreshToken(this.props.accessToken);
        if (accessToken) {
          this.props.onAccessTokenUpdate(accessToken);
        }
      }
    }, 30000);

    this.unreadTimer = setInterval(this.checkUnreads, 1000 * 30);
  }

  /**
   * Component did update lifecycle event
   */
  componentDidUpdate = (prevProps: Props) => {
    if (!prevProps.accessToken && this.props.accessToken) {
      this.checkUnreads();
    }
  }

  /**
   * Component will unmount life-cycle event
   */
  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    if (this.unreadTimer) {
      clearInterval(this.unreadTimer);
    }
  }

  /**
   * Component render method
   */
  render() {
    return null;
  }

  private checkUnreads = async () => {
    if (!this.props.accessToken) {
      return;
    }

    const unreadsService = await new PakkasmarjaApi().getUnreadsService(this.props.accessToken.access_token);
    this.props.unreadsUpdate(await unreadsService.listUnreads());
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
  };
}

/**
 * Redux mapper for mapping component dispatches
 *
 * @param dispatch dispatch method
 */
function mapDispatchToProps(dispatch: Dispatch<actions.AppAction>) {
  return {
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken)),
    unreadsUpdate: (unreads: Unread[]) => dispatch(actions.unreadsUpdate(unreads))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthRefresh);