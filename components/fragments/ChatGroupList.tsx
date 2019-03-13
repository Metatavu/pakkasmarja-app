import React, { Dispatch } from "react";
import BasicLayout from "../layout/BasicLayout";
import { connect } from "react-redux";
import { AccessToken, StoreState } from "../../types";
import * as actions from "../../actions";
import Api, { ChatGroup, ChatThread } from "pakkasmarja-client";
import strings from "../../localization/strings";
import { List, ListItem, Left, Thumbnail, Body, Text } from "native-base";


/**
 * Component properties
 */
interface Props {
  navigation: any,
  accessToken?: AccessToken
  type: "CHAT" | "QUESTION",
};

/**
 * Component state
 */
interface State {
  chatGroups: ChatGroup[],
  loading: boolean,
  errorMsg?: string
};

/**
 * Component for displaying list of available chat groups
 */
class ChatGroupList extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props component properties 
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      chatGroups: []
    };
  }

  /**
   * Component did mount life cycle method
   */
  public componentDidMount = async() => {
    if (!this.props.accessToken) {
      return;
    }

    this.setState({loading: true});
    try {
      const chatGroups = await Api.getChatGroupsService(this.props.accessToken.access_token).listChatGroups(this.props.type);
      this.setState({
        chatGroups: chatGroups,
        loading: false
      });
    } catch (e) {
      this.setState({
        loading: false,
        errorMsg: strings.errorCommunicatingWithServer
      })
    }
  }

  /**
   * Render
   */
  public render() {
    return (
      <BasicLayout navigation={this.props.navigation} loading={this.state.loading} errorMsg={this.state.errorMsg} backgroundColor="#fff" displayFooter={true}>
        <List>
          {this.renderListItems()}
        </List>
      </BasicLayout>
    );
  }

  /**
   * Renders list items
   */
  private renderListItems = (): JSX.Element[] => {
    return this.state.chatGroups.map((chatGroup: ChatGroup) => {
      return (
        <ListItem onPress={() => this.openChat(chatGroup)} key={chatGroup.id} avatar>
          <Left>
            <Thumbnail source={{uri: chatGroup.imageUrl}} />
          </Left>
          <Body>
            <Text>{chatGroup.title}</Text>
          </Body>
        </ListItem>
      );
    })
  }

  /**
   * Opens chat
   */
  private openChat = async (chatGroup: ChatGroup) => {
    if (!this.props.accessToken) {
      return;
    }

    this.setState({ loading: true });
    const groupChatThreads = await Api.getChatThreadsService(this.props.accessToken.access_token).listChatThreads(chatGroup.id, this.props.type);
    if (groupChatThreads.length > 1) {
      this.props.navigation.navigate("ChatThreadList", { threads: groupChatThreads });
    } else {
      const thread : ChatThread = groupChatThreads[0];
      if (!thread) {
        this.setState({
          errorMsg: strings.errorFindingChatThread,
          loading: false
        })
      }

      this.props.navigation.navigate("Chat", { threadId: thread.id });
    }
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

export default connect(mapStateToProps, mapDispatchToProps)(ChatGroupList);
