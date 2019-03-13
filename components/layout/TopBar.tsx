import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { Text, View, TouchableHighlight } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import { StoreState, AccessToken } from "../../types";
import * as actions from "../../actions";

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
  accessToken?: AccessToken
  secondaryNavItems?: any
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

  /**
   * Component render method
   */
  render() {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ height: 100 }}>
          <View style={{ flex: 1, flexDirection: "row", paddingLeft: 10, paddingTop: 5, paddingRight: 10, alignItems: "center", justifyContent: "space-between" }}>
            <TouchableHighlight style={{ paddingLeft: 10 }}>
              <Icon
                name='cog'
                color='#fff'
                size={30}
              />
            </TouchableHighlight>

            <TouchableHighlight style={{ paddingRight: 10 }}>
              <Icon
                name='user'
                color='#fff'
                size={30}
              />
            </TouchableHighlight>

          </View>
          {
            this.props.secondaryNavItems ?
              <View style={{ flex: 1, flexDirection: "row", paddingLeft: 10, paddingRight: 10, alignItems: "center", justifyContent: "space-between" }}>
                {this.props.secondaryNavItems.map((navItem: any) => {
                  return (
                    <Text key={navItem.text} style={{ color: "#fff", fontWeight: "bold" }}>{navItem.text}</Text>
                  );
                })}
              </View>
              :
              null
          }
        </View>
      </View>
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
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(TopBar);
