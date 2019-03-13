import React, { Dispatch } from "react";
import BasicLayout from "../layout/BasicLayout";
import TopBar from "../layout/TopBar";
import { GiftedChat, IChatMessage, IMessage } from 'react-native-gifted-chat'
import { connect } from "react-redux";
import { AccessToken, StoreState } from "../../types";
import * as actions from "../../actions";
import Api, { ChatMessage } from "pakkasmarja-client";
import strings from "../../localization/strings";


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
  messages: IChatMessage[],
  loading: boolean,
  errorMsg?: string
};

/**
 * Component for displaying chat screen
 */
class ChatScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props component properties 
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      messages: [],
      loading: false
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
        "link": "ChatList"
      },{
        "text": strings.questionsNavHeader, 
        "link": "QuestionList"
      }]}
    />
  };

  /**
   * Component did mount life cycle method
   */
  public componentDidMount = async () => {
    const { navigation, accessToken } = this.props;
    const threadId = navigation.getParam("threadId");
    if (!accessToken || !threadId) {
      return;
    }

    this.setState({loading: true});
    try {
      const chatMessages = await Api.getChatMessagesService(accessToken.access_token).listChatMessages(threadId); //TODO: limit
      //TODO: create mqtt listener and update messages as they arrive.
      this.setState({
        messages: this.translateMessages(chatMessages),
        loading: false
      });
    } catch(e) {
      this.setState({
        errorMsg: strings.errorCommunicatingWithServer,
        loading: false
      })
    }
  }

  /**
   * Render
   */
  public render() {
    if (!this.props.accessToken) {
      return null; //TODO: handle
    }

    return (
      <BasicLayout errorMsg={this.state.errorMsg} navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <GiftedChat
          messages={this.state.messages}
          onSend={this.onSend}
          user={{
            _id: this.props.accessToken.userId,
            name: `${this.props.accessToken.firstName} ${this.props.accessToken.lastName}` //TODO: display name?
          }}
        />
      </BasicLayout>
    );
  }

  /**
   * Handles sending message
   */
  private onSend = async (messages: IMessage[]) => {
    const message = messages[0];
    if (!message) {
      return;
    }

    try {
      await this.uploadMessage(message);
      this.setState((prevState: State) => {
        return {
          messages: GiftedChat.append(prevState.messages, messages)
        }
      });
    } catch(e) {
      this.setState({
        errorMsg: strings.errorCommunicatingWithServer
      });
    }
  }

  /**
   * Translates list of api messages to list of gifted chat messages
   * 
   * @param chatMessages messages to translate
   */
  private translateMessages(chatMessages: ChatMessage[]): IMessage[] {
    return chatMessages.map(chatMessage => this.translateMessage(chatMessage));
  }

  /**
   * Translates api message to gifted chat message
   * 
   * @param chatMessage message to translate
   */
  private translateMessage(chatMessage: ChatMessage): IMessage {
    return {
      _id: chatMessage.id,
      createdAt: new Date(chatMessage.createdAt || 0),
      text: chatMessage.contents,
      user: {
        _id: chatMessage.userId
        //TODO: name? avatar?
      }
    }
  }

  /**
   * Uploads message to the server
   * 
   * @param message message to upload
   */
  private uploadMessage = (message: IMessage) : Promise<ChatMessage> => {
    const { navigation, accessToken } = this.props;
    const threadId = navigation.getParam("threadId");
    if (!accessToken || !threadId) {
      return Promise.reject();
    }

    return Api.getChatMessagesService(accessToken.access_token).createChatMessage({
      contents: message.text,
      threadId: threadId,
      userId: message.user._id
    }, threadId);
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

export default connect(mapStateToProps, mapDispatchToProps)(ChatScreen);
