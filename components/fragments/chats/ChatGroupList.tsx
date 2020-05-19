import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { AccessToken, StoreState, ConversationType } from "../../../types";
import * as actions from "../../../actions";
import { ChatGroup, Unread } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import strings from "../../../localization/strings";
import { List, ListItem, Left, Thumbnail, Body, Text, Container, View, Spinner, Fab, Icon, Right, Badge } from "native-base";
import { AVATAR_PLACEHOLDER } from "../../../static/images";
import { ScrollView } from "react-native";
import * as _ from "lodash";


/**
 * Component properties
 */
interface Props {
  accessToken?: AccessToken
  type: ConversationType,
  unreads?: Unread[],
  onGroupSelected: (group: ChatGroup) => void
  onBackClick?: () => void
  onError?: (errorMsg: string) => void
};

/**
 * Component state
 */
interface State {
  chatGroups: ChatGroup[],
  loading: boolean
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
      const chatGroups = await new PakkasmarjaApi().getChatGroupsService(this.props.accessToken.access_token).listChatGroups(this.props.type);
      const sortChatGroupsByUnreads = _.sortBy( chatGroups, (group) => this.hasUnreadThreads(group.id!)).reverse(); 
      this.setState({
        chatGroups: sortChatGroupsByUnreads,
        loading: false
      });
    } catch (e) {
      this.props.onError && this.props.onError(strings.errorCommunicatingWithServer);
      this.setState({
        loading: false
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

    return this.state.chatGroups.map((chatGroup: ChatGroup) => {
      const unreadCount = this.countUnreadsByGroup(chatGroup.id!);
      return (
        <ListItem onPress={() => this.selectGroup(chatGroup)} key={chatGroup.id} avatar>
          <Left>
            <Thumbnail source={ chatGroup.imageUrl ? { uri: chatGroup.imageUrl, headers: {"Authorization": `Bearer ${accessToken.access_token}`} }: AVATAR_PLACEHOLDER } />
          </Left>
          <Body style={{ flex:1, flexDirection:"row" }}>
            <Text style={{ flex:1 }}>{chatGroup.title}</Text>
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
  private countUnreadsByGroup = (groupId: number) => {
    return (this.props.unreads || []).filter((unread: Unread) => {
      return (unread.path || "").startsWith(`chat-${groupId}-`);
    }).length;
  }

  /**
   * Check if unread
   * 
   * @param groupId groupId
   * @returns returns true if group has unreads
   */
  private hasUnreadThreads = (groupId: number) => {
    if(!this.props.unreads){
      return false;
    }
    return !!this.props.unreads.find((unread: Unread) => {
      return (unread.path || "").startsWith(`chat-${groupId}-`);
    });
  }

  /**
   * selects group
   */
  private selectGroup = async (chatGroup: ChatGroup) => {
    this.props.onGroupSelected(chatGroup);
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
