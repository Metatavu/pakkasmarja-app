import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import { ChatThread, Unread } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import strings from "../../../localization/strings";
import { List, ListItem, Left, Thumbnail, Body, Text, View, Spinner, Fab, Icon, Badge } from "native-base";
import { AVATAR_PLACEHOLDER } from "../../../static/images";
import { ScrollView } from "react-native";
import * as _ from "lodash";
import moment from "moment";

/**
 * Component properties
 */
interface Props {
  accessToken?: AccessToken;
  groupId?: number;
  type: "CHAT" | "QUESTION";
  unreads?: Unread[];
  onThreadSelected: (thread: ChatThread) => void;
  onBackClick?: () => void;
  onError?: (errorMsg: string) => void;
};

/**
 * Component state
 */
interface State {
  conversationListItems: ConversationListItem[];
  loading: boolean;
};

/**
 * Conversation list item
 */
interface ConversationListItem extends ChatThread {
  latestMessageDate?: Date;
}

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
      conversationListItems: []
    };
  }

  /**
   * Component did mount life cycle method
   */
  public componentDidMount = async() => {
    const { accessToken, groupId, type, onError } = this.props;
    if (!accessToken) {
      return;
    }

    this.setState({ loading: true });
    try {
      const chatThreads = await new PakkasmarjaApi()
        .getChatThreadsService(accessToken.access_token)
        .listChatThreads(groupId, type);

      const validChatThreads = chatThreads.filter(thread =>
        thread.expiresAt ?
          moment(moment().format("YYYY-MM-DDTHH:mm:ss.SSSSZ")).isBefore(moment(thread.expiresAt)) :
          true
      );

      const conversationListItems = await Promise.all(
        validChatThreads.map(this.createConversationListItem)
      );

      const itemsWithUnreads = conversationListItems.filter(({ groupId, id }) => this.hasUnreadMessages(groupId, id!));
      const itemsWithoutUnreads = conversationListItems.filter(({ groupId, id }) => !this.hasUnreadMessages(groupId, id!));

      const sortedItems = [
        ...itemsWithUnreads.sort(this.sortItems),
        ...itemsWithoutUnreads.sort(this.sortItems)
      ];

      this.setState({
        conversationListItems: sortedItems,
        loading: false
      });
    } catch (e) {
      onError && onError(strings.errorCommunicatingWithServer);
      this.setState({ loading: false });
    }
  }

  /**
   * Render
   */
  public render() {
    const { onBackClick } = this.props;

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
            { this.renderListItems() }
          </List>
        </ScrollView>
        { onBackClick &&
          <Fab
            style={{ backgroundColor: '#E51D2A' }}
            position="bottomRight"
            onPress={ onBackClick }>
            <Icon name="arrow-back" />
          </Fab>
        }
      </View>
    );
  }

  /**
   * Renders list items
   */
  private renderListItems = (): JSX.Element[] => {
    const { accessToken, onError, onThreadSelected } = this.props;
    if (!accessToken) {
      onError && onError(strings.accessTokenExpired);
      return [];
    }

    return this.state.conversationListItems.map(item => {
      const unreadCount = this.countUnreads(item.groupId, item.id!);
      const imageUrl = item.imageUrl ?
        {
          uri: item.imageUrl,
          headers: {"Authorization": `Bearer ${accessToken.access_token}`}
        } :
        AVATAR_PLACEHOLDER;

      return (
        <ListItem
          avatar
          key={ item.id }
          onPress={ () => this.props.onThreadSelected(item) }
        >
          <Left>
            <Thumbnail source={ imageUrl } />
          </Left>
          <Body style={{ flex: 1, flexDirection:"row" }}>
            <View style={{ flex: 1 }}>
              <Text>
                { item.title ?? strings.noTitleAvailable }
              </Text>
              <Text style={{ color: "#888", fontSize: 14 }}>
                { item.latestMessageDate ?
                  moment(item.latestMessageDate).fromNow() :
                  strings.noMessages
                }
              </Text>
            </View>
            { unreadCount > 0 &&
              <View style={{ flex: 0.2, justifyContent:"center", alignItems:"center" }}>
                <Badge>
                  <Text>
                    { unreadCount }
                  </Text>
                </Badge>
              </View>
            }
          </Body>
        </ListItem>
      );
    })
  }

  /**
   * Creates conversation list item
   *
   * @param chatThread chat thread
   * @returns 
   */
  private createConversationListItem = async (chatThread: ChatThread): Promise<ConversationListItem> => {
    const { accessToken } = this.props;
    if (!accessToken) {
      return { ...chatThread };
    }

    const [ latestMessage ] = await new PakkasmarjaApi()
      .getChatMessagesService(accessToken.access_token)
      .listChatMessages(chatThread.id!, undefined, undefined, undefined, 0, 1);

    return {
      ...chatThread,
      latestMessageDate: latestMessage?.updatedAt
    };
  }

  /**
   * Counts unreads by group
   * 
   * @param group group ID
   * @param threadId thread ID
   * @returns unread messages count
   */
  private countUnreads = (groupId: number, threadId: number) => {
    return (this.props.unreads || []).filter(unread =>
      !!unread.path?.startsWith(`chat-${groupId}-${threadId}-`)
    ).length;
  }

  /**
   * Check if thread has unread messages
   * 
   * @param groupId group ID
   * @param threadId thread ID
   * @returns true if thread has unread messages, otherwise false
   */
  private hasUnreadMessages = (groupId: number, threadId: number) => {
    return !!this.props.unreads?.some(unread =>
      !!unread.path?.startsWith(`chat-${groupId}-${threadId}-`)
    );
  }

  /**
   * Sorts conversation list items by date and time
   *
   * @param a item a
   * @param b item b
   */
  private sortItems = (a: ConversationListItem, b: ConversationListItem) => {
    return !a.latestMessageDate && !b.latestMessageDate ?
      this.sortTitlesAsc(a.title, b.title) :
      this.sortDatesDesc(a.latestMessageDate, b.latestMessageDate);
  }

  /**
   * Sorts titles ascending
   *
   * @param a title a
   * @param b title b
   */
  private sortTitlesAsc = (a: string, b: string) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b);
  }

  /**
   * Sorts dates descending
   *
   * @param a date a
   * @param b date b
   */
  private sortDatesDesc = (a?: Date, b?: Date) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return moment(b).diff(a);
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
