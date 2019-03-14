import React, { Dispatch } from "react";
import TopBar from "../../layout/TopBar";
import { connect } from "react-redux";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import strings from "../../../localization/strings";
import ChatGroupList from "../../fragments/chats/ChatGroupList";
import ChatThreadList from "../../fragments/chats/ChatThreadList";
import { HeaderProps } from "react-navigation";
import BasicLayout from "../../layout/BasicLayout";
import { Tabs, Tab } from "native-base";
import { ChatThread, ChatGroup } from "pakkasmarja-client";
import Chat from "../../fragments/chats/Chat";
import { StyleSheet } from "react-native";


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
interface State {
  selectedChatThreadId?: number,
  selectedQuestionThreadId?: number,
  selectedQuestionGroupId?: number
  errorMsg?: string
};

const styles = StyleSheet.create({
  tab: {
    backgroundColor: "#E51D2A"
  },
  activeTab: {
    color: "#000000",
    fontWeight: "bold"
  }
});

/**
 * Component for displaying chat screen
 */
class ChatsListScreen extends React.Component<Props, State> {

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
  static navigationOptions = (props: HeaderProps) => {
    return( {
      headerTitle: <TopBar 
        showMenu={true} 
        showHeader={false} 
        showUser={true}
      />
    });
  };

  /**
   * Render
   */
  public render() {
    return (
      <BasicLayout navigation={this.props.navigation}>
        <Tabs>
          <Tab activeTabStyle={{...styles.activeTab, ...styles.tab}} tabStyle={styles.tab} heading={strings.chatsNavHeader}>
            { this.renderChatTab() }
          </Tab>
          <Tab activeTabStyle={{...styles.activeTab, ...styles.tab}} tabStyle={styles.tab} heading={strings.questionsNavHeader}>
            { this.renderQuestionTab() }
          </Tab>
        </Tabs>
      </BasicLayout>
    );
  }

  /**
   * Renders chat tab
   */
  private renderChatTab = (): JSX.Element => {
    if (this.state.selectedChatThreadId) {
      return (<Chat onBackClick={this.handleChatChatBackClick} threadId={this.state.selectedChatThreadId} onError={this.handleError} />);
    }

    return (<ChatThreadList onThreadSelected={this.handleChatThreadSelected} type="CHAT" onError={this.handleError} />);
  }

  /**
   * Renders question tab
   */
  private renderQuestionTab = (): JSX.Element => {
    if (this.state.selectedQuestionThreadId) {
      return (<Chat onBackClick={this.handleQuestionChatBackClick} threadId={this.state.selectedQuestionThreadId} onError={this.handleError} />);
    } else if (this.state.selectedQuestionGroupId) {
      return (<ChatThreadList
                onBackClick={this.handleQuestionThreadBackClick}
                onThreadSelected={this.handleQuestionThreadSelected}
                groupId={this.state.selectedQuestionGroupId}
                type="QUESTION"
                onError={this.handleError} />);
    }
    
    return (<ChatGroupList onGroupSelected={this.handleQuestionGroupSelected} type="QUESTION" onError={this.handleError} />);
  }

  /**
   * Handles error from components
   * 
   * @param msg error message
   */
  private handleError = (msg: string) => {
    this.setState({
      errorMsg: msg
    });
  }

  /**
   * Handles back button click from chat chat view
   */
  private handleChatChatBackClick = () => {
    this.setState({
      selectedChatThreadId: undefined
    });
  }

  /**
   * Handles back button click from question chat view
   */
  private handleQuestionChatBackClick = () => {
    this.setState({
      selectedQuestionThreadId: undefined
    });
  }

  /**
   * Handles back button click from question thread list
   */
  private handleQuestionThreadBackClick = () => {
    this.setState({
      selectedQuestionGroupId: undefined
    });
  }

  /**
   * Handles chat thread selection
   */
  private handleChatThreadSelected = (chatThread: ChatThread) => {
    this.setState({selectedChatThreadId: chatThread.id});
  }

  /**
   * Handles question thread selection
   */
  private handleQuestionThreadSelected = (chatThread: ChatThread) => {
    this.setState({selectedQuestionThreadId: chatThread.id});
  }

  /**
   * Handles question group selection
   */
  private handleQuestionGroupSelected = (chatGroup: ChatGroup) => {
    this.setState({selectedQuestionGroupId: chatGroup.id});
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

export default connect(mapStateToProps, mapDispatchToProps)(ChatsListScreen);
