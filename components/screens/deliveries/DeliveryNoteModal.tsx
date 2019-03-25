import React, { Dispatch } from "react";
import { connect } from "react-redux";
import { Text } from "native-base";
import * as actions from "../../../actions";
import { AccessToken, StoreState } from "../../../types";
import { View, TouchableOpacity, TextInput, Modal } from "react-native";
import { styles } from "./styles.tsx";
import { DeliveryNote } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";

/**
 * Interface for component props
 */
interface Props {
  accessToken?: AccessToken;
  modalOpen: boolean;
  addDeliveryNote: (deliveryNote: DeliveryNote) => void;
  modalClose: () => void;
  deliverNoteText?: string;
  deliveryId: string;
};

/**
 * Interface for component state
 */
interface State {
  modalOpen: boolean,
  id?: string;
  text?: string;
  image?: string;
};

/**
 * Contract proposal modal component class
 */
class DeliveryNoteModal extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      modalOpen: false
    };
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
            <View style={{
              width: "95%",
              height: 425,
              backgroundColor: "white",
              borderColor: "#e01e36",
              borderWidth: 1.25,
              padding: 20,
              borderRadius: 7
            }}>
              <View>
                <Text style={styles.contentHeader}>
                  Lisää huomio
              </Text>
              </View>
              <View>
                <Text style={styles.text}>Image URL</Text>
                <TextInput
                  style={styles.textInput}
                  value={this.state.image}
                  onChangeText={(text: string) => this.setState({ image: text })}
                />
              </View>
              <View>
                <Text style={styles.text}>Kommentti</Text>
                <TextInput
                  multiline={true}
                  numberOfLines={4}
                  style={styles.textInput}
                  value={this.state.text}
                  onChangeText={(text: string) => this.setState({ text: text })}
                />
              </View>

              <View style={[styles.flexView, { marginTop: 20 }]}>
                <TouchableOpacity style={[styles.smallWhiteButton]} onPress={this.props.modalClose}>
                  <Text style={styles.smallWhiteButtonText}>Sulje</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallRedButton} onPress={this.sendDeliveryNote}>
                  <Text style={styles.buttonText}>Lähetä</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
  
  /**
   * Sends delivery note
   */
  private sendDeliveryNote = async () => {
    if (!this.props.accessToken) {
      return;
    }

    const deliveryNote: DeliveryNote = {
      text: this.state.text,
      image: this.state.image
    }

    const Api = new PakkasmarjaApi();
    const deliveriesService = await Api.getDeliveriesService(this.props.accessToken.access_token);
    await deliveriesService.createDeliveryNote(deliveryNote, this.props.deliveryId);

    this.props.addDeliveryNote(deliveryNote);
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

export default connect(mapStateToProps, mapDispatchToProps)(DeliveryNoteModal);