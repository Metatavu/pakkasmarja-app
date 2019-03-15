import React, { Dispatch } from "react";
import { GiftedChat, IChatMessage, IMessage } from 'react-native-gifted-chat'
import { connect } from "react-redux";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import { ChatMessage } from "pakkasmarja-client";
import strings from "../../../localization/strings";
import PakkasmarjaApi from "../../../api";
import { View, Spinner, Fab, Icon, Container } from "native-base";

/**
 * Component properties
 */
interface Props {
  accessToken?: AccessToken
  threadId: number
  onError?: (errorMsg: string) => void
  onBackClick?: () => void
};

/**
 * Component state
 */
interface State {
  messages: IChatMessage[],
  loading: boolean
};

/**
 * Component for displaying chat
 */
class Chat extends React.Component<Props, State> {

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
   * Component did mount life cycle method
   */
  public componentDidMount = async () => {
    const { threadId, accessToken } = this.props;
    if (!accessToken || !threadId) {
      return;
    }

    this.setState({loading: true});
    try {
      const chatMessages = await new PakkasmarjaApi().getChatMessagesService(accessToken.access_token).listChatMessages(threadId); //TODO: limit
      //TODO: create mqtt listener and update messages as they arrive.
      this.setState({
        messages: this.translateMessages(chatMessages),
        loading: false
      });
    } catch(e) {
      this.props.onError && this.props.onError(strings.errorCommunicatingWithServer);
      this.setState({
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

    if (this.state.loading) {
      return (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
          <Spinner color="red" />
        </View>
      );
    }

    return (
      <Container>
        <GiftedChat
          messages={this.state.messages}
          onSend={this.onSend}
          user={{
            _id: this.props.accessToken.userId,
            name: `${this.props.accessToken.firstName} ${this.props.accessToken.lastName}` //TODO: display name?
          }}
        />
        {this.props.onBackClick && (
          <Fab
            containerStyle={{ }}
            style={{ backgroundColor: '#E51D2A' }}
            position="topRight"
            onPress={() => this.props.onBackClick && this.props.onBackClick()}>
            <Icon name="arrow-back" />
          </Fab>
        )}
      </Container>
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
      this.props.onError && this.props.onError(strings.errorCommunicatingWithServer);
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
    const { threadId, accessToken } = this.props;
    if (!accessToken || !threadId) {
      return Promise.reject();
    }

    return new PakkasmarjaApi().getChatMessagesService(accessToken.access_token).createChatMessage({
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

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
