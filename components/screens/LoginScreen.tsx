import React, { Dispatch } from "react";
import { connect } from "react-redux";
import Auth from "../../utils/Auth";
import { Text, Form, Item, Input, Label, Button } from 'native-base';
import { REACT_APP_AUTH_SERVER_URL, REACT_APP_AUTH_RESOURCE, REACT_APP_AUTH_REALM, REACT_APP_DEFAULT_USER, REACT_APP_DEFAULT_PASSWORD } from 'react-native-dotenv';
import { AccessToken, StoreState } from "../../types";
import * as actions from "../../actions";
import strings from "../../localization/strings";
import { StyleSheet } from "react-native";
import BasicScrollLayout from "../layout/BasicScrollLayout";

/**
 * Login details
 */
interface LoginDetails {
  username?: string,
  password?: string,
  realm?: string 
}

/**
 * Component props
 */
interface Props {
  navigation: any,
  accessToken?: AccessToken,
  onAccessTokenUpdate: (accessToken: AccessToken) => void
};

/**
 * Component state
 */
interface State {
  loginDetails: LoginDetails
};

/**
 * Login screen component
 */
class LoginScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loginDetails: {},
    };
  }

  /**
   * Navigation options
   */
  static navigationOptions = {
    header: null,
  };

  /**
   * Component did mount life-cycle event
   */
  async componentDidMount() {
    const accessToken = this.props.accessToken;
    if (accessToken) {
      this.props.navigation.navigate("News");
    }
  }

  /**
   * Updates login details when values change
   */
  updateData = (key: "username" | "password" | "realm", value: string) => {
    const loginDetails: LoginDetails = this.state.loginDetails;
    loginDetails[key] = value;
    this.setState({
      loginDetails: loginDetails
    });
  }

  /**
   * Tries to login
   */
  sendLogin = (event: any) => {
    const loginData = this.state.loginDetails;

    Auth.login({
      clientId: REACT_APP_AUTH_RESOURCE,
      url: `${REACT_APP_AUTH_SERVER_URL}/realms/${REACT_APP_AUTH_REALM}/protocol/openid-connect/token`,
      username: loginData.username || REACT_APP_DEFAULT_USER,
      password: loginData.password || REACT_APP_DEFAULT_PASSWORD,
      realmId: REACT_APP_AUTH_REALM
    }).then(async (accessToken) => {
      if (accessToken) {
        this.props.onAccessTokenUpdate(accessToken);
        this.props.navigation.replace("News");
      } else {
        // TODO: Handle error
      }
    });
  }

  /**
   * Component render method
   */
  render() {

    const styles = StyleSheet.create({
      item: {
        margin: 25
      },
      button: {
        backgroundColor: "#E51D2A",
        width: "80%",
        marginLeft: "10%",
        marginTop: 30,
        fontSize: 18,
        padding: 20,
      },
      label: {
        color: "#000000",
        fontSize: 24
      },
      buttonText: {
        color: "#fff",
        fontSize: 24
      },
      inputStyle: {
        color: "#000000",
        fontSize: 20,
        height: 50,
        margin: 10
      }
    });
    return (
      <BasicScrollLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={false}>
        <Form>
          <Item>
            <Label style={styles.label} >{strings.loginScreenUsernameLabel}</Label>
            <Input style={styles.inputStyle} onChangeText={(text: string) => this.updateData("username", text)} />
          </Item>
          <Item>
            <Label style={styles.label} >{strings.loginScreenPasswordLabel}</Label>
            <Input style={styles.inputStyle} secureTextEntry onChangeText={(text: string) => this.updateData("password", text)} />
          </Item>
        </Form>
        <Button style={styles.button} onPress={this.sendLogin} block><Text style={styles.buttonText}>{strings.loginScreenLoginButton}</Text></Button>
      </BasicScrollLayout>
    );
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
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginScreen);
