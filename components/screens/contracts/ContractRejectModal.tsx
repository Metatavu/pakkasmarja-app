import React, { Dispatch } from "react";
import { AccessToken, StoreState } from "../../../types";
import { Text } from "native-base";
import { View, TouchableOpacity, TextInput, Platform } from "react-native";
import Modal from "react-native-modal";
import { Contract } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import * as actions from "../../../actions";
import { connect } from "react-redux";
import { styles } from "./styles";
import AsyncButton from "../../generic/async-button";

/**
 * Interface for component props
 */
interface Props {
  modalOpen: boolean,
  accessToken?: AccessToken,
  closeModal: () => void,
  rejectComment: string,
  onUserInputChange: (key:any, value:any) => void,
  contractRejected: () => void
  contract: Contract
  styles?: any
  navigation?: any
};

/**
 * Interface for component state
 */
interface State {
  modalOpen: boolean,
};

/**
 * Contract reject modal component class
 */
class ContractRejectModal extends React.Component<Props, State> {
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
   * Close modal
   */
  private closeModal = () => {
    this.props.closeModal();
  }

  /**
   * Reject contract
   */
  private rejectContract = async () => {
    if (!this.props.accessToken || !this.props.contract) {
      return;
    }

    const contract = this.props.contract;
    const api = new PakkasmarjaApi();
    const contractsService = api.getContractsService(this.props.accessToken.access_token);

    contract.status = "REJECTED";
    contract.rejectComment = this.props.rejectComment;
    await contractsService.updateContract(contract, contract.id || "");
    this.props.contractRejected();
  }

  /**
   * Render method for contract modal component
   */
  public render() {
    return (
      <View style={{ marginTop: 22 }}>
        <Modal isVisible={this.props.modalOpen}>
          <View style={styles.modalView}>
            <View style={styles.headerContainer}>
              <Text style={styles.text}>Haluatko varmasti hylätä sopimuksen? Kirjoita perustelut alle.</Text>
            </View>

            <View>
              <TextInput
                multiline = {true}
                numberOfLines={Platform.OS === 'ios' ? undefined : 4}
                style={{... styles.textInput, height: Platform.OS === "ios" ? 80 : undefined}}
                value={this.props.rejectComment}
                onChangeText={(text:string) => this.props.onUserInputChange("rejectComment", text)}
              />
            </View>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.whiteButton} onPress={this.closeModal}>
                <Text style={styles.whiteButtonText}>Peruuta</Text>
              </TouchableOpacity>
              <AsyncButton style={styles.redButton} onPress={this.rejectContract}>
                <Text style={styles.redButtonText}>Hylkää sopimus</Text>
              </AsyncButton>
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

export default connect(mapStateToProps, mapDispatchToProps)(ContractRejectModal);