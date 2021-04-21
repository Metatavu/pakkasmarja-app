import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { Text } from "native-base";
import * as actions from "../../../actions";
import { AccessToken, StoreState, } from "../../../types";
import { View, TouchableOpacity, Modal, Image } from "react-native";
import { styles } from "./styles.tsx";
import { FileService } from "../../../api/file.service";
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
  deliveryNoteId: string;
  modalClose: () => void;
  loadDeliveryNotes: () => void;
};

/**
 * Interface for component state
 */
interface State {
  imageBase64?: string;
  modalOpen: boolean;
  noteText: string;
  deliveryId: string;
  hasImage?: boolean;
};

/**
 * View or delete delivery note modal component class
 */
class ViewOrDeleteNoteModal extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      modalOpen: false,
      noteText: "",
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
    if (this.props.deliveryNoteId !== prevProps.deliveryNoteId) {
      this.setState({ hasImage: false });
      const Api = new PakkasmarjaApi();
      const deliveriesService = Api.getDeliveriesService(this.props.accessToken.access_token);
      const deliveryNote: DeliveryNote = await deliveriesService.findDeliveryNote(this.props.deliveryId || "", this.props.deliveryNoteId);
      this.setState({
        noteText: deliveryNote.text || ""
      });

      if (deliveryNote.image) {
        this.setState({ hasImage: true });
        const fileService = new FileService(REACT_APP_API_URL, this.props.accessToken.access_token);
        const imageData = await fileService.getFile(deliveryNote.image);
        this.setState({
          imageBase64: `data:image/jpeg;base64,${imageData}`
        });
      } else {
        this.setState({ imageBase64: undefined });
      }
    }
  }

  /**
   * Delete delivery note 
   */
  private deleteDeliveryNote = async () => {
    if (!this.props.accessToken || !this.props.accessToken.access_token) {
      return;
    }
    const Api = new PakkasmarjaApi();
    const deliveryService = await Api.getDeliveriesService(this.props.accessToken.access_token);
    await deliveryService.deleteDeliveryNote(this.props.deliveryId || "", this.props.deliveryNoteId);
    this.props.loadDeliveryNotes();
    this.props.modalClose();
  }

  /**
   * Render method
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
              <View style={{ width: "100%", height: 200, justifyContent: "center", alignItems: "center" }}>
                {
                  this.state.hasImage ?
                    <Image
                      source={{ uri: this.state.imageBase64 }}
                      style={{ flex: 1, width: 200, height: 200, resizeMode: 'contain', marginBottom: 10 }}
                    />
                    :
                    <Text>Huomiolla ei ole kuvaa</Text>
                }
              </View>
              <View style={{ height: 200 }}>
                <Text style={styles.text}>Huomion kommentti</Text>
                <View>
                  <Text>{this.state.noteText}</Text>
                </View>
              </View>
              <View style={styles.flexView}>
                <TouchableOpacity style={[styles.smallWhiteButton]} onPress={this.props.modalClose}>
                  <Text style={styles.smallWhiteButtonText}>Takaisin</Text>
                </TouchableOpacity>
                <AsyncButton style={styles.smallRedButton} onPress={this.deleteDeliveryNote}>
                  <Text style={styles.buttonText}>Poista huomio</Text>
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

export default connect(mapStateToProps, mapDispatchToProps)(ViewOrDeleteNoteModal);
