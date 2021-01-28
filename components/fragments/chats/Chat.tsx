import React, { Dispatch } from "react";
import { GiftedChat, IChatMessage, IMessage, Actions, MessageImageProps, LoadEarlierProps, LoadEarlier, User } from 'react-native-gifted-chat';
import { connect } from "react-redux";
import { AccessToken, StoreState, ConversationType } from "../../../types";
import * as actions from "../../../actions";
import { ChatMessage, Contact, ChatThread, Unread } from "pakkasmarja-client";
import strings from "../../../localization/strings";
import PakkasmarjaApi from "../../../api";
import { View, Spinner, Fab, Icon, Container, ListItem, Left, Text, Right, Radio, List, Item, Input, Button, Badge } from "native-base";
import { mqttConnection } from "../../../mqtt";
import ImagePicker from 'react-native-image-picker';
import { StyleSheet, Image, Platform, ScrollView } from "react-native";
import Lightbox from 'react-native-lightbox';
import moment from "moment";
import { ChatMessagesService } from "pakkasmarja-client/dist/api/api";

const FAILSAFE_POLL_RATE = 5000;

/**
 * Component properties
 */
interface Props {
  accessToken?: AccessToken;
  threadId: number;
  conversationType: ConversationType;
  unreads?: Unread[],
  unreadRemoved?: (unread: Unread) => void;
  unreadsUpdate?: (unreads: Unread[]) => void;
  onError?: (errorMsg: string) => void
  onBackClick?: () => void
};

/**
 * Component state
 */
interface State {
  messages: IChatMessage[];
  read: boolean;
  readAmount: number;
  user?: Contact;
  thread?: ChatThread;
  threadPermission?: ChatThread.PermissionTypeEnum;
  loading: boolean;
  loadingEarlier: boolean;
  pollAnswer?: string;
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
  private messageReadPoller?: NodeJS.Timer;

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
      read: false,
      readAmount: 0,
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
      const threadPermission = thread.permissionType;
      await this.removeUnreads(thread);
      const chatMessages = await new PakkasmarjaApi().getChatMessagesService(accessToken.access_token).listChatMessages(threadId, undefined, undefined, undefined, undefined, 20); //TODO: limit
      if (thread.answerType !== "POLL") {
        mqttConnection.subscribe("chatmessages", this.onMqttMessage);
      }
      const messages = await this.translateMessages(chatMessages);
      const user = await new PakkasmarjaApi().getContactsService(accessToken.access_token).findContact(accessToken.userId);
      this.setState({
        messages: messages,
        user: user,
        thread: thread,
        threadPermission: threadPermission,
        pollAnswer: thread.answerType == "POLL" && messages[0] ? messages[0].text : undefined,
        loading: false
      });
    } catch(e) {
      this.props.onError && this.props.onError(strings.errorCommunicatingWithServer);
      this.setState({
        loading: false
      })
    }

    this.state.thread && this.state.thread.answerType === "TEXT" && this.startMessageReadPoller();
  }

  /**
   * Component will unmount life cycle method
   */
  public componentWillUnmount = () => {
    this.stopMessageReadPoller();
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

    const chatUser: User = {
      _id: this.props.accessToken.userId,
      name: user.displayName,
      avatar: user.avatarUrl
    }

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
            messages={ this.state.messages }
            onSend={ this.onSend }
            showUserAvatar={ true }
            loadEarlier={ true }
            isLoadingEarlier={ this.state.loadingEarlier }
            onLoadEarlier={ this.loadEarlierMessages }
            renderUsernameOnMessage={ true }
            onLongPress={ this.openMessageOptions }
            renderActions={ this.renderCustomActions }
            renderMessageImage={ this.renderMessageImage }
            renderLoadEarlier={ this.renderLoadEarlier }
            renderChatFooter={ this.renderMessagesReadSegment }
            placeholder="Kirjoita viesti..."
            locale="fi"
            user={ chatUser }
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
   * Render messages read segment to chat
   */
  private renderMessagesReadSegment = (): JSX.Element | null => {
    if (this.props.conversationType === "CHAT") {
      return this.state.threadPermission === "MANAGE" ? (
        <View style={{ flexDirection: "row", justifyContent: "flex-end", alignContent: "center", paddingHorizontal: 20, marginBottom: 5 }}>
          <Badge style={{ backgroundColor: '#0084ff' }}><Text style={{ marginTop: 1 }}>{ this.state.readAmount }</Text></Badge>
          <Text style={{ color: "grey", marginTop: 3 }}> henkilöä lukenut keskustelun</Text>
        </View>
      ) : null;
    }

    return this.state.read ? (
      <View style={{ flexDirection: "row", justifyContent: "flex-end", alignContent: "center", paddingHorizontal: 20, marginBottom: 2 }}>
          <Text style={{ color: "grey", marginRight: 10 }}>Vastaanottaja on lukenut keskustelun</Text>
          <Icon style={{ fontSize: 20, color:"#0084ff" }} type="FontAwesome5" name="check"/>
      </View>
    ) : null;
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
    const chatMessages = await new PakkasmarjaApi().getChatMessagesService(accessToken.access_token).listChatMessages(threadId, earliestMessage.toDate(), undefined, undefined, 0, 20);
    const messages = await this.translateMessages(chatMessages);
    this.setState((prevState: State) => {
      return {
        loadingEarlier: false,
        messages: GiftedChat.prepend(prevState.messages, messages)
      }
    });
  }

  /**
   * Method for opening message options
   *
   * @param context context
   * @param message message
   */
  private openMessageOptions = (context: any, message: IChatMessage) => {
    const options = [strings.deleteButton, strings.cancelButton];
    const cancelButtonIndex = options.length - 1;
    context.actionSheet().showActionSheetWithOptions(
      { options, cancelButtonIndex },
      (buttonIndex: number) => {
        switch (buttonIndex) {
          case 0:
            this.deleteMessage(message._id);
          break;
        }
      }
    );
  }

  /**
   * Method for deleting a message
   *
   * @param id message id
   */
  private deleteMessage = async (id: string | number) => {
    const { accessToken, threadId } = this.props;
    const { messages } = this.state;

    if (!accessToken) {
      return;
    }

    try {
      const Api = new PakkasmarjaApi();
      const messagesService = Api.getChatMessagesService(accessToken.access_token);
      await messagesService.deleteChatMessage(threadId, Number(id));

      const updatedMessages = messages.filter((message) => message._id !== id);

      this.setState({
        messages: updatedMessages
      });
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Callback for receiving message from mqtt
   */
  private onMqttMessage = async (mqttMessage: any) => {
    try {
      switch (mqttMessage.operation) {
        case "CREATED": {
          const { threadId, accessToken } = this.props;

          if (!(mqttMessage.threadId && mqttMessage.threadId == threadId)) {
            return;
          }
          
          const mqttMessageId = mqttMessage.messageId;
          if (!accessToken || !threadId || !mqttMessageId) {
            return;
          }

          const messagesService = new PakkasmarjaApi().getChatMessagesService(accessToken.access_token);
          const newMessage = await messagesService.findChatMessage(mqttMessage.threadId, mqttMessage.messageId);

          if (newMessage.userId === accessToken.userId) {
            return;
          }

          const latestMessage = this.getLatestMessage();
          const chatMessages = await messagesService.listChatMessages(threadId, undefined, latestMessage.toDate());
          const messages = await this.translateMessages(chatMessages);

          this.setState((prevState: State) => {
            return {
              loading: false,
              messages: GiftedChat.append(prevState.messages, messages)
            }
          });

          const unreadsService = new PakkasmarjaApi().getUnreadsService(accessToken.access_token);
          const updatedUnreads = await unreadsService.listUnreads();
          this.props.unreadsUpdate && this.props.unreadsUpdate(updatedUnreads);

          const { thread } = this.state;
          thread && this.removeUnreads(thread);

          break;
        }
        case "READ": {

          if (!(mqttMessage.threadId && mqttMessage.threadId == this.props.threadId) || !this.state.thread || this.state.thread.answerType !== "TEXT") {
            return;
          }

          if (this.props.conversationType === "QUESTION") {
            this.checkThreadRead();
          } else if (this.state.threadPermission === "MANAGE") {
            this.checkThreadReadAmount();
          }

          break;
        }
        case "DELETED": {
          const { id } = mqttMessage;
          const { messages } = this.state;

          const updatedMessages = messages.filter((message) => message._id !== id);

          this.setState({
            messages: updatedMessages
          });
          break;
        }
      }
    } catch(e) {
      console.error("error: ", e);
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
   * @param messageProps message props
   */
  private renderMessageImage = (messageProps: MessageImageProps<IMessage>) => {
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
      const newMessage = await this.translateMessage(await this.uploadMessage(message));
      this.setState((prevState: State) => {
        return {
          messages: GiftedChat.append(prevState.messages, [newMessage]),
          read: false
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
      _id: chatMessage.id || "",
      createdAt: new Date(chatMessage.createdAt || 0),
      text: chatMessage.contents || "",
      image: chatMessage.image,
      user: {
        _id: chatMessage.userId || "",
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
    
    if (unreads.length > 0) {
      mqttConnection.publish("chatmessages", {
        "operation": "READ",
        "threadId": thread.id,
        "groupId": thread.groupId
      });
    }

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

    contact = await new PakkasmarjaApi().getContactsService(accessToken.access_token).findBasicContact(chatMessage.userId!);
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
      userId: message.user._id.toString()
    }, threadId);
  }

  /**
   * Checks if thread has been read
   */
  private checkThreadRead = async () => {
    const { messages } = this.state;
    const { threadId, accessToken } = this.props;
    if (!accessToken || !accessToken.userId || !threadId) {
      return;
    }

    const lastOwnMessage = messages.find(message => message.user._id === accessToken.userId);
    if (!lastOwnMessage) {
      return;
    }

    const messagesService: ChatMessagesService = new PakkasmarjaApi().getChatMessagesService(accessToken.access_token);
    const threadRead: boolean = await messagesService.getMessageRead(threadId, lastOwnMessage._id as number);

    this.setState({
      read: threadRead
    });
  }

  /**
   * Checks how many have read this thread
   */
  private checkThreadReadAmount = async () => {
    const { messages } = this.state;
    const { threadId, accessToken } = this.props;
    if (!accessToken || !accessToken.userId || !threadId) {
      return;
    }

    const lastOwnMessage = messages.filter(message => message.user._id === accessToken.userId).pop();
    if (!lastOwnMessage) {
      return;
    }

    const messagesService = new PakkasmarjaApi().getChatMessagesService(accessToken.access_token);
    const threadReadAmount = await messagesService.getMessageReadAmount(threadId, lastOwnMessage._id as number);

    this.setState({
      readAmount: parseInt(threadReadAmount)
    });
  }

  /**
   * Starts message read failsafe poller
   */
  private startMessageReadPoller = () => {
    if (this.props.conversationType == "QUESTION") {
      this.checkThreadRead();
      this.messageReadPoller = setInterval(() => this.checkThreadRead(), FAILSAFE_POLL_RATE);
    } else if (this.state.threadPermission === "MANAGE") {
      this.checkThreadReadAmount();
      this.messageReadPoller = setInterval(() => this.checkThreadReadAmount(), FAILSAFE_POLL_RATE);
    }
  }

    /**
   * Stops message read failsafe poller
   */
  private stopMessageReadPoller = () => {
    if (this.messageReadPoller) {
      clearInterval(this.messageReadPoller);
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
    unreadRemoved: (unread: Unread) => dispatch(actions.unreadRemoved(unread)),
    unreadsUpdate: (unreads: Unread[]) => dispatch(actions.unreadsUpdate(unreads))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
