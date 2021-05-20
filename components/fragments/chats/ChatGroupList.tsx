import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { AccessToken, StoreState, ConversationType } from "../../../types";
import * as actions from "../../../actions";
import { ChatGroup, Unread } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import strings from "../../../localization/strings";
import { List, ListItem, Left, Thumbnail, Body, Text, View, Spinner, Fab, Icon, Badge } from "native-base";
import { AVATAR_PLACEHOLDER } from "../../../static/images";
import { ScrollView } from "react-native";
import * as _ from "lodash";


/**
 * Component properties
 */
interface Props {
  accessToken?: AccessToken;
  type: ConversationType;
  unreads?: Unread[];
  onGroupSelected: (group: ChatGroup) => void;
  onBackClick?: () => void;
  onError?: (errorMsg: string) => void;
};

/**
 * Component state
 */
interface State {
  chatGroups: ChatGroup[];
  loading: boolean;
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
    const { accessToken, type, onError } = this.props;

    if (!accessToken) {
      return;
    }

    this.setState({ loading: true });
    try {
      const chatGroups = await new PakkasmarjaApi()
        .getChatGroupsService(accessToken.access_token)
        .listChatGroups(type);

      const sortedGroups = _.orderBy(
        chatGroups,
        [ group => this.hasUnreadThreads(group.id!), group => group.title ],
        [ "desc", "asc" ]
      );

      this.setState({
        chatGroups: sortedGroups,
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
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
            onPress={ onBackClick }
          >
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
    const { accessToken, onError } = this.props;

    if (!accessToken) {
      onError && onError(strings.accessTokenExpired);
      return [];
    }

    return this.state.chatGroups.map(chatGroup => {
      const unreadCount = this.countUnreadsByGroup(chatGroup.id!);
      const imageUrl = chatGroup.imageUrl ?
        {
          uri: chatGroup.imageUrl,
          headers: { "Authorization": `Bearer ${accessToken.access_token}` }
        } :
        AVATAR_PLACEHOLDER;

      return (
        <ListItem
          avatar
          key={ chatGroup.id }
          onPress={ () => onGroupSelected(chatGroup) }
        >
          <Left>
            <Thumbnail source={ imageUrl }/>
          </Left>
          <Body style={{ flex: 1, flexDirection:"row" }}>
            <Text style={{ flex: 1 }}>
              { chatGroup.title }
            </Text>
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
   * Counts unreads by group
   * 
   * @param groupId group ID
   * @return unread messages count
   */
  private countUnreadsByGroup = (groupId: number) => {
    return (this.props.unreads || []).filter(unread =>
      !!unread.path?.startsWith(`chat-${groupId}-`)
    ).length;
  }

  /**
   * Check if group has unread messages
   * 
   * @param groupId group ID
   * @returns true if group has unread messages, otherwise false
   */
  private hasUnreadThreads = (groupId: number) => {
    return !!this.props.unreads?.some(unread =>
      !!unread.path?.startsWith(`chat-${groupId}-`)
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

export default connect(mapStateToProps, mapDispatchToProps)(ChatGroupList);
