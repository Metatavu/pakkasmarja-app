import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import { ChatGroup } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import strings from "../../../localization/strings";
import { List, ListItem, Left, Thumbnail, Body, Text, Container, View, Spinner, Fab, Icon } from "native-base";
import { AVATAR_PLACEHOLDER } from "../../../static/images";
import { ScrollView } from "react-native";


/**
 * Component properties
 */
interface Props {
  accessToken?: AccessToken
  type: "CHAT" | "QUESTION",
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
      this.setState({
        chatGroups: chatGroups,
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
    return this.state.chatGroups.map((chatGroup: ChatGroup) => {
      return (
        <ListItem onPress={() => this.selectGroup(chatGroup)} key={chatGroup.id} avatar>
          <Left>
            <Thumbnail source={ chatGroup.imageUrl ? { uri: chatGroup.imageUrl }: AVATAR_PLACEHOLDER } />
          </Left>
          <Body>
            <Text>{chatGroup.title}</Text>
          </Body>
        </ListItem>
      );
    })
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