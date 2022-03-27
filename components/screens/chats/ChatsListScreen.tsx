import React, { Dispatch } from "react";
import TopBar from "../../layout/TopBar";
import { connect } from "react-redux";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import strings from "../../../localization/strings";
import ChatGroupList from "../../fragments/chats/ChatGroupList";
import ChatThreadList from "../../fragments/chats/ChatThreadList";
import BasicLayout from "../../layout/BasicLayout";
import { Tabs, Tab, DefaultTabBar } from "native-base";
import { ChatThread, ChatGroup } from "pakkasmarja-client";
import Chat from "../../fragments/chats/Chat";
import { StyleSheet, TouchableHighlight } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { StackNavigationOptions } from '@react-navigation/stack';


/**
 * Component properties
 */
interface Props {
  navigation: any;
  route: any;
  accessToken?: AccessToken;
};

/**
 * Component state
 */
interface State {
  selectedChatThreadId?: number;
  selectedQuestionThreadId?: number;
  selectedQuestionGroupId?: number;
  errorMsg?: string;
};

const styles = StyleSheet.create({
  tab: {
    backgroundColor: "#fff"
  },
  activeTab: {
    color: "#E51D2A",
    fontWeight: "bold"
  },
  activeText: {
    color: "#E51D2A"
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
   * Component did mount lifecycle method
   */
  componentDidMount() {
    const { navigation, route } = this.props;
    const { selectedQuestionThreadId } = route.params || {};

    navigation.setOptions(this.navigationOptions(navigation));
    selectedQuestionThreadId && this.setState({ selectedQuestionThreadId });
  }


  /**
   * Returns navigation options
   *
   * @param navigation navigation object
   */
  private navigationOptions = (navigation: any): StackNavigationOptions => {
    return {
      headerStyle: {
        height: 100,
        backgroundColor: "#E51D2A"
      },
      headerTitle: () => (
        <TopBar
          navigation={ navigation }
          showMenu
          showHeader={ false }
          showUser
        />
      ),
      headerTitleContainerStyle: {
        left: 0
      },
      headerLeft: () => (
        <TouchableHighlight onPress={ navigation.goBack }>
          <Icon
            name='chevron-left'
            color='#fff'
            size={40}
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
      )
    }
  };

  /**
   * Render
   */
  public render() {
    const { navigation, route } = this.props;
    const { selectedQuestionThreadId } = route.params || {};
    const initialTab = selectedQuestionThreadId ? 1 : 0;

    return (
      <BasicLayout displayFooter navigation={ navigation }>
        <Tabs
          initialPage={ initialTab }
          tabBarUnderlineStyle={{ backgroundColor: "#E51D2A" }}
          renderTabBar={ (props: any) => {
            props.tabStyle = Object.create(props.tabStyle);
            return <DefaultTabBar { ...props }/>;
          }}
        >
          <Tab
            activeTabStyle={{ ...styles.activeTab, ...styles.tab }}
            textStyle={{ color:"#E51D2A" }}
            activeTextStyle={ styles.activeText }
            tabStyle={ styles.tab }
            heading={ strings.chatsNavHeader }
          >
            { this.renderChatTab() }
          </Tab>
          <Tab
            activeTabStyle={{ ...styles.activeTab, ...styles.tab }}
            textStyle={{ color:"#E51D2A" }}
            activeTextStyle={ styles.activeText }
            tabStyle={ styles.tab }
            heading={ strings.questionsNavHeader }
          >
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
    const { selectedChatThreadId } = this.state;

    if (selectedChatThreadId) {
      return (
        <Chat
          onBackClick={ this.handleChatChatBackClick }
          threadId={ selectedChatThreadId }
          conversationType="CHAT"
          onError={ this.handleError }
        />
      );
    }

    return (
      <ChatThreadList
        onThreadSelected={ this.handleChatThreadSelected }
        type="CHAT"
        onError={ this.handleError }
      />
    );
  }

  /**
   * Renders question tab
   */
  private renderQuestionTab = (): JSX.Element => {
    const { selectedQuestionThreadId, selectedQuestionGroupId } = this.state;

    if (selectedQuestionThreadId) {
      return (
        <Chat
          onBackClick={ this.handleQuestionChatBackClick }
          threadId={ selectedQuestionThreadId }
          conversationType="QUESTION"
          onError={ this.handleError }
        />
      );
    } else if (selectedQuestionGroupId) {
      return (
        <ChatThreadList
          onBackClick={ this.handleQuestionThreadBackClick }
          onThreadSelected={ this.handleQuestionThreadSelected }
          groupId={ selectedQuestionGroupId }
          type="QUESTION"
          onError={ this.handleError }
        />
      );
    }

    return (
      <ChatGroupList
        onGroupSelected={ this.handleQuestionGroupSelected }
        type="QUESTION"
        onError={ this.handleError }
      />
    );
  }

  /**
   * Handles error from components
   *
   * @param msg error message
   */
  private handleError = (msg: string) => {
    this.setState({ errorMsg: msg });
  }

  /**
   * Handles back button click from chat chat view
   */
  private handleChatChatBackClick = () => {
    this.setState({ selectedChatThreadId: undefined });
  }

  /**
   * Handles back button click from question chat view
   */
  private handleQuestionChatBackClick = () => {
    this.setState({ selectedQuestionThreadId: undefined });
  }

  /**
   * Handles back button click from question thread list
   */
  private handleQuestionThreadBackClick = () => {
    this.setState({ selectedQuestionGroupId: undefined });
  }

  /**
   * Handles chat thread selection
   */
  private handleChatThreadSelected = (chatThread: ChatThread) => {
    this.setState({ selectedChatThreadId: chatThread.id });
  }

  /**
   * Handles question thread selection
   */
  private handleQuestionThreadSelected = (chatThread: ChatThread) => {
    this.setState({ selectedQuestionThreadId: chatThread.id });
  }

  /**
   * Handles question group selection
   */
  private handleQuestionGroupSelected = (chatGroup: ChatGroup) => {
    this.setState({ selectedQuestionGroupId: chatGroup.id });
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
