import React, { Dispatch } from "react";
import BasicLayout from "../layout/BasicLayout";
import TopBar from "../layout/TopBar";
import { connect } from "react-redux";
import { AccessToken, StoreState } from "../../types";
import * as actions from "../../actions";
import { ChatThread } from "pakkasmarja-client";
import strings from "../../localization/strings";
import { List, ListItem, Left, Thumbnail, Body, Text } from "native-base";


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
  chatThreads: ChatThread[],
  loading: boolean,
  errorMsg?: string
};

/**
 * Component for displaying chat screen
 */
class ChatThreadListScreen extends React.Component<Props, State> {

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
   * Navigation options property
   */
  static navigationOptions = {
    headerTitle: <TopBar 
      showMenu={true} 
      showHeader={false} 
      showUser={true} 
      secondaryNavItems={[{
        "text": strings.chatsNavHeader, 
        "link": "/secondary"
      },{
        "text": strings.questionsNavHeader, 
        "link": "/secondary"
      }]}
    />
  };

  /**
   * Component did mount life cycle method
   */
  public componentDidMount = async() => {
    if (!this.props.accessToken) {
      return;
    }

    const { navigation } = this.props;
    const threads = navigation.getParam("threads", []);
    this.setState({chatThreads: threads});
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
    return this.state.chatThreads.map((chatThread: ChatThread) => {
      return (
        <ListItem onPress={() => this.openChat(chatThread)} key={chatThread.id} avatar>
          <Left>
            <Thumbnail source={{uri: chatThread.imageUrl}} />
          </Left>
          <Body>
            <Text>{chatThread.title}</Text>
          </Body>
        </ListItem>
      );
    })
  }

  /**
   * Opens chat
   */
  private openChat = async (chatThread: ChatThread) => {
    this.props.navigation.navigate("Chat", { threadId: chatThread.id });
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

export default connect(mapStateToProps, mapDispatchToProps)(ChatThreadListScreen);
