import React, { Dispatch } from "react";
import { GiftedChat, IChatMessage, IMessage, Actions, MessageImageProps } from 'react-native-gifted-chat'
import { connect } from "react-redux";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import { ChatMessage, Contact } from "pakkasmarja-client";
import strings from "../../../localization/strings";
import PakkasmarjaApi from "../../../api";
import { View, Spinner, Fab, Icon, Container } from "native-base";
import { mqttConnection } from "../../../mqtt";
import ImagePicker from 'react-native-image-picker';
import { StyleSheet, Image } from "react-native";
import Lightbox from 'react-native-lightbox';
import moment from "moment";

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
  user?: Contact,
  loading: boolean
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
      mqttConnection.subscribe("chatmessages", this.onMessage);
      const messages = await this.translateMessages(chatMessages);
      const user = await new PakkasmarjaApi().getContactsService(accessToken.access_token).findContact(accessToken.userId);
      this.setState({
        messages: messages,
        user: user,
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

    if (this.state.loading) {
      return (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
          <Spinner color="red" />
        </View>
      );
    }

    const user = this.state.user || {};

    //TODO: remove this when gifted chat type definitions are up to date.
    const giftedChatProps = {
      messages: this.state.messages,
      onSend: this.onSend,
      showUserAvatar: true,
      renderUsernameOnMessage: true,
      renderActions: this.renderCustomActions,
      renderMessageImage: this.renderMessageImage,
      user: {
        _id: this.props.accessToken.userId,
        name: user.displayName,
        avatar: user.avatarUrl
      }
    } as any;

    return (
      <Container>
        <GiftedChat
          {...giftedChatProps}
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
    ImagePicker.showImagePicker({title: strings.addImage, storageOptions: {skipBackup: true, path: 'images'}}, async (response) => {
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
      const fileUploadResponse = await new PakkasmarjaApi().getFileService(accessToken.access_token).uploadFile(response.uri, contentType);
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
