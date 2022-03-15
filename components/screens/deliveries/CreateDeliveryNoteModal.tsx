import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { Text } from "native-base";
import * as actions from "../../../actions";
import { AccessToken, StoreState, DeliveryNoteData, DeliveryNoteDataKeys } from "../../../types";
import { View, TouchableOpacity, TextInput, Modal, Image, Platform } from "react-native";
import { styles } from "./styles.tsx";
import ImagePicker from 'react-native-image-picker';
import { FileService, FileResponse } from "../../../api/file.service";
import { DeliveryNote } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import AsyncButton from "../../generic/async-button";

/**
 * Interface for component props
 */
interface Props {
  accessToken?: AccessToken;
  modalOpen: boolean;
  deliveryId: string;
  modalClose: () => void;
  loadDeliveryNotes: () => void;
};

/**
 * Interface for component state
 */
interface State {
  modalOpen: boolean,
  deliveryNoteData: DeliveryNoteData;
  deliveryNoteFile?: {
    fileUri: string,
    fileType: string
  };
  deliveryId: string;
};

/**
 * Create delivery note modal component class
 */
class CreateDeliveryNoteModal extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      modalOpen: false,
      deliveryNoteData: {
        imageUri: "",
        imageType: "",
        text: ""
      },
      deliveryId: ""
    };
  }

  /**
   * Component did update life-cycle event
   *
   * @param prevProps previous props
   */
  public async componentDidUpdate(prevProps: Props) {
    if (!this.props.accessToken) {
      return;
    }
    if (this.props.modalOpen !== prevProps.modalOpen && this.props.modalOpen) {
      this.setState({
        deliveryNoteData: {
          imageUri: "",
          imageType: "",
          text: ""
        }
      });
    }
  }

  /**
   * On delivery note data change
   *
   * @param key key
   * @param value value
   */
  private onDeliveryDataChange = (key: DeliveryNoteDataKeys, value: string) => {
    const deliveryNoteData: DeliveryNoteData = this.state.deliveryNoteData;

    switch (key) {
      case "imageType":
        deliveryNoteData.imageType = value;
        break;
      case "imageUri":
        deliveryNoteData.imageUri = value;
        break;
      case "text":
        deliveryNoteData.text = value;
    }

    this.setState({ deliveryNoteData });
  }

  /**
   * Discard delivery message
   */
  private discardDeliveryMessage = () => {
    const deliveryNoteData: DeliveryNoteData = {
      imageUri: "",
      imageType: "",
      text: ""
    }
    this.setState({ deliveryNoteData });
    this.props.modalClose();
  }

  /**
   * Create delivery note
   */
  private createDeliveryNote = async () => {
    if (!this.props.accessToken || !this.props.accessToken.access_token) {
      return;
    }
    const fileService = new FileService(REACT_APP_API_URL, this.props.accessToken.access_token);
    let image: FileResponse | undefined = undefined;

    if (this.state.deliveryNoteData.imageUri && this.state.deliveryNoteData.imageType) {
      image = await fileService.uploadFile(this.state.deliveryNoteData.imageUri, this.state.deliveryNoteData.imageType);
    }

    const deliveryNote: DeliveryNote = {
      text: this.state.deliveryNoteData.text,
      image: image ? image.url : undefined
    };
    const Api = new PakkasmarjaApi();
    const deliveryService = await Api.getDeliveriesService(this.props.accessToken.access_token);
    await deliveryService.createDeliveryNote(deliveryNote, this.props.deliveryId || "");
    this.props.loadDeliveryNotes();
    this.props.modalClose();
  }

  /**
   * Get image picker options
   *
   * @return Options object
   */
  private getImagePickerOptions = () => {
    return {
      title: "Valitse kuva",
      takePhotoButtonTitle: "Ota uusi kuva",
      chooseFromLibraryButtonTitle: "Valitse kuva kirjastosta",
      storageOptions: {
        skipBackup: true,
        path: "images",
      }
    }
  }

  /**
   * Open image picker
   */
  private openImagePicker = async () => {
    ImagePicker.showImagePicker(this.getImagePickerOptions(), async (response) => {
      if (response.didCancel) {
        console.warn('User cancelled image picker');
      } else if (response.error) {
        console.warn('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.warn('User tapped custom button: ', response.customButton);
      } else {
        if (!this.props.accessToken) {
          return;
        }
        this.onDeliveryDataChange("imageUri", response.uri);
        this.onDeliveryDataChange("imageType", response.type || "image/jpeg");
      }
    });
  }

  /**
   * Remove image
   */
  private removeImage = () => {
    const deliveryNoteData: DeliveryNoteData = this.state.deliveryNoteData;
    deliveryNoteData.imageUri = "";
    deliveryNoteData.imageType = "";
    this.setState({ deliveryNoteData });
  }

  /**
   * Render method for contract modal component
   */
  public render() {
    return (
      <View style={{ marginTop: 22 }}>
        <Modal
          transparent={true}
          visible={this.props.modalOpen}
          animationType="slide"
          onRequestClose={() => this.props.modalClose}
        >
          <View style={[{
            flex: 1,
            flexDirection: 'column',
            backgroundColor: 'rgba(80,80,80,0.2)'
          }, styles.center]} >
            <View style={styles.noteModal}>
              <View>
                <Text style={styles.contentHeader}>
                  Lisää huomio
                </Text>
              </View>
              {
                !this.state.deliveryNoteData.imageUri &&
                <View>
                  <Text style={styles.text}>Lisää kuva</Text>
                  <AsyncButton style={styles.whiteButton} onPress={this.openImagePicker}>
                    <Text style={styles.smallWhiteButtonText}>Lisää kuva</Text>
                  </AsyncButton>
                </View>
              }
              {
                this.state.deliveryNoteData.imageUri ?
                  <View style={{ width: "100%", height: 200, justifyContent: "center", alignItems: "center" }}>
                    <Image
                      source={{ uri: this.state.deliveryNoteData.imageUri }}
                      style={{ flex: 1, width: 200, height: 200, resizeMode: 'contain', marginBottom: 10 }}
                    />
                    <TouchableOpacity style={styles.whiteButton} onPress={this.removeImage}>
                      <Text style={styles.smallWhiteButtonText}>Poista kuva</Text>
                    </TouchableOpacity>
                  </View>
                  : null
              }
              <View>
                <Text style={styles.text}>Kommentti</Text>
                <TextInput
                  multiline={true}
                  numberOfLines={Platform.OS === 'ios' ? undefined : 4}
                  style={{ ...styles.textInput, height: Platform.OS === "ios" ? 80 : undefined }}
                  value={this.state.deliveryNoteData.text}
                  onChangeText={(text: string) => this.onDeliveryDataChange("text", text)}
                />
              </View>
              <View style={[styles.flexView, { marginTop: 20 }]}>
                <TouchableOpacity style={[styles.smallWhiteButton]} onPress={this.discardDeliveryMessage}>
                  <Text style={styles.smallWhiteButtonText}>Peruuta</Text>
                </TouchableOpacity>
                <AsyncButton style={styles.smallRedButton} onPress={this.createDeliveryNote}>
                  <Text style={styles.buttonText}>Tallenna</Text>
                </AsyncButton>
              </View>
            </View>
          </View>
        </Modal>
      </View>
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
    accessToken: state.accessToken
  };
}

/**
 * Redux mapper for mapping component dispatches
 *
 * @param dispatch dispatch method
 */
function mapDispatchToProps(dispatch: Dispatch<actions.AppAction>) {
  return {
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateDeliveryNoteModal);
