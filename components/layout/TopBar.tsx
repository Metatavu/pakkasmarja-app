import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { View, TouchableHighlight, Dimensions, Platform } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import { StoreState, AccessToken } from "../../types";
import * as actions from "../../actions";
import { Thumbnail } from "native-base";
import { TOP_LOGO } from "../../static/images";
import { styles } from "../screens/deliveries/styles.tsx";

/**
 * Component props
 */
interface Props {
  header?: string,
  showMenu?: boolean,
  showUser?: boolean,
  showHeader?: boolean,
  showCancel?: boolean
  textColor?: string
  frontPage?: boolean;
  accessToken?: AccessToken
  secondaryNavItems?: any
  navigation?: any
}

/**
 * Component state
 */
interface State {
}

/**
 * Top bar component
 */
class TopBar extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private renderFrontPageTopBar = () => {
    return (
      <React.Fragment>
        <View style={styles.center}>
        </View>
        <View style={styles.center}>
          <Thumbnail style={{ width:80, height:80 }} source={TOP_LOGO} />
        </View>
        <View style={styles.center}>
          <TouchableHighlight onPress={() => this.navigateTo("ManageContact")}>
            <Icon
              name='user'
              color='#fff'
              size={30}
            />
          </TouchableHighlight>
        </View>
      </React.Fragment>
    );
  }

  /**
   * Component render method
   */
  public render() {
    if (this.props.frontPage) {
      return this.renderFrontPageTopBar()
    }

    const width = Dimensions.get("screen").width;
    const align = Platform.OS === "ios" ? "flex-end" : "center";

    return (
      <View style={{ width: (width / 3) * 2, marginLeft: width / 3, flex: 0, flexDirection: "row", alignContent: "space-around" }}>
        <View style={{ ...styles.center, alignContent: align, justifyContent: align, alignItems: align }}>
          <Thumbnail style={{ width:80, height:80 }} source={TOP_LOGO} />
        </View>
        <View style={{ ...styles.center, alignContent: align, alignItems: align }}>
          <TouchableHighlight onPress={() => this.navigateTo("ManageContact")}>
            <Icon
              name='user'
              color='#fff'
              size={30}
            />
          </TouchableHighlight>
        </View>
      </View >
    );
  }

  private navigateTo(screen: string) {
    this.props.navigation && this.props.navigation.navigate(screen);
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
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(TopBar);
