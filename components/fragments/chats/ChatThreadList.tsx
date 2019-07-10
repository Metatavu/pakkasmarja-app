import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import { ChatThread, Unread } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import strings from "../../../localization/strings";
import { List, ListItem, Left, Thumbnail, Body, Text, Container, View, Spinner, Fab, Icon, Right, Badge } from "native-base";
import { AVATAR_PLACEHOLDER } from "../../../static/images";
import { ScrollView } from "react-native";
import * as _ from "lodash";
import moment from "moment";


/**
 * Component properties
 */
interface Props {
  accessToken?: AccessToken
  groupId?: number,
  type: "CHAT" | "QUESTION",
  unreads?: Unread[],
  onThreadSelected: (thread: ChatThread) => void
  onBackClick?: () => void
  onError?: (errorMsg: string) => void
};

/**
 * Component state
 */
interface State {
  chatThreads: ChatThread[],
  loading: boolean
};

/**
 * Component for displaying list of available chat groups
 */
class ChatThreadList extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props component properties 
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      chatThreads: []
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
      const chatThreads = await new PakkasmarjaApi().getChatThreadsService(this.props.accessToken.access_token).listChatThreads(this.props.groupId, this.props.type);
      const validChatThreads = chatThreads.filter( (thread) => {
        if ( thread.expiresAt ){
         return moment(moment().format("YYYY-MM-DDTHH:mm:ss.SSSSZ")).isBefore( moment(thread.expiresAt) );
        }
        return true;
      });
      const sortChatThreadsByUnreads = _.sortBy( validChatThreads, (thread) => this.hasUnreadMessages( thread.groupId , thread.id! )).reverse();
      this.setState({
        chatThreads: sortChatThreadsByUnreads,
        loading: false
      });
    } catch (e) {
      this.props.onError && this.props.onError(strings.errorCommunicatingWithServer);
      this.setState({
        loading: false,
      });
    }
  }

  /**
   * Render
   */
  public render() {

    if (this.state.loading) {
      return (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
          <Spinner color="red" />
        </View>
      );
    }

    return (
      <View>
        <ScrollView>
          <List>
            {this.renderListItems()}
          </List>
        </ScrollView>
        {this.props.onBackClick && (
          <Fab
            containerStyle={{ }}
            style={{ backgroundColor: '#E51D2A' }}
            position="bottomRight"
            onPress={() => this.props.onBackClick && this.props.onBackClick()}>
            <Icon name="arrow-back" />
          </Fab>
        )}
      </View>
    );
  }

  /**
   * Renders list items
   */
  private renderListItems = (): JSX.Element[] => {
    const { accessToken } = this.props;
    if (!accessToken) {
      this.props.onError && this.props.onError(strings.accessTokenExpired);
      return [];
    }

    return this.state.chatThreads.map((chatThread: ChatThread) => {
      const unreadCount = this.countUnreads(chatThread.groupId, chatThread.id!);
      return (
        <ListItem onPress={() => this.selectThread(chatThread)} key={chatThread.id} avatar>
          <Left>
            <Thumbnail source={ chatThread.imageUrl ? { uri: chatThread.imageUrl, headers: {"Authorization": `Bearer ${accessToken.access_token}`} }: AVATAR_PLACEHOLDER } />
          </Left>
          <Body style={{ flex:1, flexDirection:"row" }}>
            <Text style={{ flex:1 }}>{chatThread.title ? chatThread.title : strings.noTitleAvailable}</Text>
            {unreadCount > 0 && <View style={{ flex:0.2, justifyContent:"center", alignItems:"center" }}><Badge><Text>{ unreadCount }</Text></Badge></View>}
          </Body>
        </ListItem>
      );
    })
  }

  /**
   * Counts unreads by group
   * 
   * @param group id
   * @return unreads
   */
  private countUnreads = (groupId: number, threadId: number) => {
    return (this.props.unreads || []).filter((unread: Unread) => {
      return (unread.path || "").startsWith(`chat-${groupId}-${threadId}-`);
    }).length;
  }

  /**
   * Check if unread
   * 
   * @param groupId groupId
   * @param threadId threadId
   */
  private hasUnreadMessages = (groupId: number, threadId: number) => {
    if(!this.props.unreads){
      return false;
    }
    return !!this.props.unreads.find((unread: Unread) => {
      return (unread.path || "").startsWith(`chat-${groupId}-${threadId}-`);
    });
  }

  /**
   * Opens chat
   */
  private selectThread = async (chatThread: ChatThread) => {
    this.props.onThreadSelected(chatThread);
  }
}

/**
 * Redux mapper for mapping store state to component props
 * 
 * @param state store state
 */
function mapStateToProps(state: StoreState) {
  return {
    accessToken: state.accessToken,
    unreads: state.unreads
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

export default connect(mapStateToProps, mapDispatchToProps)(ChatThreadList);
