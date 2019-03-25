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
  onDeliveryNoteChange: (note: DeliveryNote) => void;
  onCreateNoteClick: () => void;
  deliveryNoteData: DeliveryNote;
  modalClose: () => void;
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
   * On delivery note data change
   */
  private onDeliveryDataChange = (key: string, value: string) => {
    let deliveryData: any = this.props.deliveryNoteData;
    deliveryData[key] = value;

    this.props.onDeliveryNoteChange(deliveryData);
  }

  /**
   * Discard delivery message
   */
  private discardDeliveryMessage = () => {
    this.props.onDeliveryNoteChange({
      id: undefined,
      image: undefined,
      text: undefined
    });
  }

  /**
   * Create delivery message
   */
  private createDeliveryMessage = () => {
    this.props.onCreateNoteClick();
    this.props.modalClose();
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
                  value={this.props.deliveryNoteData.image}
                  onChangeText={(text: string) => this.onDeliveryDataChange("image", text)}
                />
              </View>
              <View>
                <Text style={styles.text}>Kommentti</Text>
                <TextInput
                  multiline={true}
                  numberOfLines={4}
                  style={styles.textInput}
                  value={this.props.deliveryNoteData.text}
                  onChangeText={(text: string) => this.onDeliveryDataChange("text", text)}
                />
              </View>

              <View style={[styles.flexView, { marginTop: 20 }]}>
                <TouchableOpacity style={[styles.smallWhiteButton]} onPress={this.discardDeliveryMessage}>
                  <Text style={styles.smallWhiteButtonText}>Peruuta</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallRedButton} onPress={this.createDeliveryMessage}>
                  <Text style={styles.buttonText}>Tallenna</Text>
                </TouchableOpacity>
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

export default connect(mapStateToProps, mapDispatchToProps)(DeliveryNoteModal);