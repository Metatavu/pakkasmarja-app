import React, { Dispatch } from "react";
import TopBar from "../layout/TopBar";
import { connect } from "react-redux";
import { AccessToken, StoreState } from "../../types";
import * as actions from "../../actions";
import strings from "../../localization/strings";
import ChatGroupList from "../fragments/ChatGroupList";


/**
 * Component properties
 */
interface Props {
  navigation: any,
  accessToken?: AccessToken
};

/**
 * Component state
 */
interface State {};

/**
 * Component for displaying chat screen
 */
class ChatGroupListScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props component properties 
   */
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  /**
   * Navigation options property
   */
  static navigationOptions = {
    headerTitle: <TopBar 
      showMenu={true} 
      showHeader={false} 
      showUser={true} 
      secondaryNavItems={[{
        "text": strings.chatsNavHeader, 
        "link": "ChatList"
      },{
        "text": strings.questionsNavHeader,
        "active": true,
        "link": "QuestionList"
      }]}
    />
  };

  /**
   * Render
   */
  public render() {
    return (
      <ChatGroupList type="QUESTION" navigation={this.props.navigation} />
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

export default connect(mapStateToProps, mapDispatchToProps)(ChatGroupListScreen);
