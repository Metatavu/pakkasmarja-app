import React, { Dispatch } from "react";
import { GiftedChat, IChatMessage, IMessage, Actions, MessageImageProps, LoadEarlierProps, LoadEarlier } from 'react-native-gifted-chat'
import { connect } from "react-redux";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import { ChatMessage, Contact, ChatThread, Unread } from "pakkasmarja-client";
import strings from "../../../localization/strings";
import PakkasmarjaApi from "../../../api";
import { View, Spinner, Fab, Icon, Container, ListItem, Left, Text, Right, Radio, List, Item, Input, Button } from "native-base";
import { mqttConnection } from "../../../mqtt";
import ImagePicker from 'react-native-image-picker';
import { StyleSheet, Image, Platform, ScrollView } from "react-native";
import Lightbox from 'react-native-lightbox';
import moment from "moment";

/**
 * Component properties
 */
interface Props {
  accessToken?: AccessToken
  threadId: number
  unreads?: Unread[],
  unreadRemoved?: (unread: Unread) => void;
  onError?: (errorMsg: string) => void
  onBackClick?: () => void
};

/**
 * Component state
 */
interface State {
  messages: IChatMessage[],
  user?: Contact,
  thread?: ChatThread,
  loading: boolean,
  loadingEarlier: boolean
  pollAnswer?: string
  savingPollAnswer: boolean
};

const styles = StyleSheet.create({
  container: {},
  image: {
    width: 150,
    height: 100,
    borderRadius: 13,
    margin: 3,
    resizeMode: 'cover',
  },
  imageActive: {
    flex: 1,
    resizeMode: 'contain',
  },
});

/**
 * Component for displaying chat
 */
class Chat extends React.Component<Props, State> {

  private userLookup: Map<string, Contact>;

  /**
   * Constructor
   * 
   * @param props component properties 
   */
  constructor(props: Props) {
    super(props);

    this.userLookup = new Map();
    this.state = {
      messages: [],
      loading: false,
      loadingEarlier: false,
      savingPollAnswer: false
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
      const thread = await new PakkasmarjaApi().getChatThreadsService(accessToken.access_token).findChatThread(threadId);
      await this.removeUnreads(thread);
      const chatMessages = await new PakkasmarjaApi().getChatMessagesService(accessToken.access_token).listChatMessages(threadId); //TODO: limit
      if (thread.answerType !== "POLL") {
        mqttConnection.subscribe("chatmessages", this.onMessage);
      }
      const messages = await this.translateMessages(chatMessages);
      const user = await new PakkasmarjaApi().getContactsService(accessToken.access_token).findContact(accessToken.userId);
      this.setState({
        messages: messages,
        user: user,
        thread: thread,
        pollAnswer: thread.answerType == "POLL" && messages[0] ? messages[0].text : undefined,
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
      this.props.onError && this.props.onError(strings.accessTokenExpired)
      return null;
    }

    const { user, thread } = this.state;

    if (this.state.loading || !user || !thread) {
      return (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
          <Spinner color="red" />
        </View>
      );
    }

    

    //TODO: remove this when gifted chat type definitions are up to date.
    const giftedChatProps = {
      messages: this.state.messages,
      onSend: this.onSend,
      showUserAvatar: true,
      loadEarlier: true,
      isLoadingEarlier: this.state.loadingEarlier,
      onLoadEarlier: this.loadEarlierMessages,
      renderUsernameOnMessage: true,
      renderActions: this.renderCustomActions,
      renderMessageImage: this.renderMessageImage,
      renderLoadEarlier: this.renderLoadEarlier,
      placeholder: "Kirjoita viesti...",
      locale: "fi",
      user: {
        _id: this.props.accessToken.userId,
        name: user.displayName,
        avatar: user.avatarUrl
      }
    } as any;

    let isPredefinedOptionSelected = false;
    const pollReplyItems = (thread.pollPredefinedTexts || []).map((predefinedText) => {
      if (predefinedText === this.state.pollAnswer) {
        isPredefinedOptionSelected = true;
      }

      return (<ListItem key={predefinedText} onPress={() => this.setState({ pollAnswer: predefinedText })}>
        <Left>
          <Text>{predefinedText}</Text>
        </Left>
        <Right>
          <Radio onPress={() => this.setState({ pollAnswer: predefinedText })} selected={predefinedText === this.state.pollAnswer} />
        </Right>
      </ListItem>);
    });

    pollReplyItems.unshift(<ListItem key="poll-title"><Left><Text>{thread.title}</Text></Left></ListItem>);
    
    if (thread.pollAllowOther) {
      pollReplyItems.push(
        <ListItem key="other-answer-input">
          <Left>
            <Item bordered={false} regular>
              <Input onChangeText={(text) => this.setState({pollAnswer: text})} value={ isPredefinedOptionSelected ? undefined : this.state.pollAnswer } placeholder='Muu, mikä?' />
            </Item>
          </Left>
        </ListItem>
      );
    }

    return (
      <Container>
        {thread.answerType == "TEXT" ? (
          <GiftedChat
            {...giftedChatProps}
          />
        ) : (
          <ScrollView>
            <List>
              {pollReplyItems}
            </List>
            <Button disabled={this.state.savingPollAnswer} onPress={() => this.savePollAnswer()} style={{ backgroundColor: '#E51D2A' }} block>
              { this.state.savingPollAnswer ? <Spinner size="small" color="white" /> : <Text>Tallenna</Text> }
            </Button>
          </ScrollView>
        )}

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
   * Saves poll answer
   */
  private savePollAnswer = async () => {
    const { pollAnswer, user } = this.state;
    const { threadId, accessToken } = this.props;
    if (!accessToken || !threadId || !pollAnswer || !user) {
      return;
    }

    this.setState({ savingPollAnswer: true });
    await new PakkasmarjaApi().getChatMessagesService(accessToken.access_token).createChatMessage({
      contents: pollAnswer,
      threadId: threadId,
      userId: user.id
    }, threadId);
    this.setState({ savingPollAnswer: false });
  }

  /**
   * Callback for loading earlier messages from server
   */
  private loadEarlierMessages = async () => {
    const earliestMessage = this.getEarliestMessage();
    const { threadId, accessToken } = this.props;
    if (!accessToken || !threadId) {
      return;
    }
    this.setState({
      loadingEarlier: true
    })
    const chatMessages = await new PakkasmarjaApi().getChatMessagesService(accessToken.access_token).listChatMessages(threadId, earliestMessage.toDate(), undefined, 0, 20);
    const messages = await this.translateMessages(chatMessages);
    this.setState((prevState: State) => {
      return {
        loadingEarlier: false,
        messages: GiftedChat.prepend(prevState.messages, messages)
      }
    });
  }

  /**
   * Callback for receiving message from mqtt
   */
  private onMessage = async (mqttMessage: any) => {
    try {
      const data = JSON.parse(mqttMessage);
      if (data.threadId && data.threadId == this.props.threadId) {
        const latestMessage = this.getLatestMessage();
        const { threadId, accessToken } = this.props;
        if (!accessToken || !threadId) {
          return;
        }
        const chatMessages = await new PakkasmarjaApi().getChatMessagesService(accessToken.access_token).listChatMessages(threadId, undefined, latestMessage.toDate());
        const messages = await this.translateMessages(chatMessages);
        this.setState((prevState: State) => {
          return {
            loading: false,
            messages: GiftedChat.append(prevState.messages, messages)
          }
        });
      }
    } catch(e) {
      console.warn(e);
    }
  }

  /**
   * Return moment representing latest time message has arrived
   */
  private getLatestMessage = () => {
    let latestMessage = moment(0);
    this.state.messages.forEach((message) => {
      const messageMoment = moment(message.createdAt);
      if (messageMoment.isAfter(latestMessage)) {
        latestMessage = messageMoment;
      }
    });

    return latestMessage;
  }

  /**
   * Return moment representing latest time message has arrived
   */
  private getEarliestMessage = () => {
    let earliestMessage = moment();
    this.state.messages.forEach((message) => {
      const messageMoment = moment(message.createdAt);
      if (messageMoment.isBefore(earliestMessage)) {
        earliestMessage = messageMoment;
      }
    });

    return earliestMessage;
  }


  /**
   * Custom rendering method for load earlier button
   */
  private renderLoadEarlier = (loadEarlierProps: LoadEarlierProps) => {
    loadEarlierProps.label = "Näytä vanhemmat viestit"
    return <LoadEarlier {...loadEarlierProps} />
  }

  /**
   * Custom rendering method for images with message
   */
  private renderMessageImage = (messageProps: MessageImageProps) => {
    const { accessToken } = this.props;
    const { 
      containerStyle,
      lightboxProps,
      imageProps,
      imageStyle,
      currentMessage
    } = messageProps;

    if(!currentMessage || !accessToken) {
      return; //Nothing to render
    }

    return (
      <View style={[styles.container, containerStyle]}>
        <Lightbox
          activeProps={{
            style: styles.imageActive,
          }}
          {...lightboxProps}
        >
          <Image
            {...imageProps}
            style={[styles.image, imageStyle]}
            source={{ uri: currentMessage.image, headers: {"Authorization": `Bearer ${accessToken.access_token}`} }}
          />
        </Lightbox>
      </View>
    );
  }

  /**
   * Renders custom actions button
   */
  private renderCustomActions = (props: any) => {
    const options = {
      [strings.addImage]: (props: any) => {
        this.selectImage();
      },
      [strings.cancelButton]: () => {},
    };

    return (
      <Actions
        {...props}
        options={options}
      />
    );
  }

  /**
   * Handles selecting image for uploading
   */
  private selectImage = () => {
    ImagePicker.showImagePicker({title: strings.addImage, storageOptions: {skipBackup: true, path: 'images' }}, async (response) => {
      if (response.didCancel || response.error) {
        return;
      }

      const { accessToken, threadId } = this.props;
      if (!accessToken || !threadId) {
        return;
      }
      this.setState({
        loading: true
      });

      const contentType = response.type || "image/jpeg";
      const uri = (Platform.OS==='android') ? response.uri : response.uri.replace('file://', '');
      const fileUploadResponse = await new PakkasmarjaApi().getFileService(accessToken.access_token).uploadFile(uri, contentType);
      
      const fileMessage = await new PakkasmarjaApi().getChatMessagesService(accessToken.access_token).createChatMessage({
        image: fileUploadResponse.url,
        threadId: threadId,
        userId: accessToken.userId
      }, threadId);
      const chatMessage = await this.translateMessage(fileMessage);
      this.setState((prevState: State) => {
        return {
          loading: false,
          messages: GiftedChat.append(prevState.messages, [chatMessage])
        }
      });
    });
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
  private translateMessages = async(chatMessages: ChatMessage[]): Promise<IMessage[]> => {
    const messagePromises = chatMessages.map(chatMessage => this.translateMessage(chatMessage));
    return await Promise.all(messagePromises);
  }

  /**
   * Translates api message to gifted chat message
   * 
   * @param chatMessage message to translate
   */
  private translateMessage = async (chatMessage: ChatMessage): Promise<IMessage> => {
    const contact = await this.getMessageContact(chatMessage);
    return {
      _id: chatMessage.id,
      createdAt: new Date(chatMessage.createdAt || 0),
      text: chatMessage.contents || "",
      image: chatMessage.image,
      user: {
        _id: chatMessage.userId,
        name: contact.displayName,
        avatar: contact.avatarUrl
      }
    }
  }

    /**
   * Counts unreads by group
   * 
   * @param group id
   * @return unreads
   */
  private removeUnreads = async (thread: ChatThread) => {
    const { accessToken } = this.props;
    
    if (!accessToken || !thread || !thread.id || !thread.groupId) {
      return;
    }

    const unreadsService = new PakkasmarjaApi().getUnreadsService(accessToken.access_token);

    const unreads = (this.props.unreads || [])
      .filter((unread: Unread) => {
        const path = (unread.path || "");
        return path.startsWith(`chat-${thread.groupId}-${thread.id}-`);
      });

    await Promise.all(unreads.map(async (unread) => {
      this.props.unreadRemoved && this.props.unreadRemoved(unread);
      await unreadsService.deleteUnread(unread.id!)
    }));

  }

  /**
   * Resolves contact for chat message
   */
  private getMessageContact = async (chatMessage: ChatMessage): Promise<Contact> => {
    let contact = this.userLookup.get(chatMessage.userId!);
    if (contact) {
      return contact;
    }

    const { accessToken } = this.props;
    if (!accessToken) {
      return Promise.reject();
    }

    contact = await new PakkasmarjaApi().getContactsService(accessToken.access_token).findContact(chatMessage.userId!);
    this.userLookup.set(chatMessage.userId!, contact);
    return contact;
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
  return {
    unreadRemoved: (unread: Unread) => dispatch(actions.unreadRemoved(unread))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
