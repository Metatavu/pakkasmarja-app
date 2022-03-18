import React, { Dispatch } from "react";
import { AccessToken, StoreState } from "../../../types";
import { Text } from "native-base";
import { View, TouchableOpacity } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import Modal from "react-native-modal";
import { Contract } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import * as actions from "../../../actions";
import { connect } from "react-redux";
import { styles } from "./styles";
import _ from "lodash";

/**
 * Interface for component props
 */
interface Props {
  modalOpen: boolean,
  itemGroupId?: string,
  accessToken?: AccessToken,
  closeModal: () => void
};

/**
 * Interface for component state
 */
interface State {
  modalOpen: boolean,
  pastContracts: Contract[]
};

/**
 * Contract modal component class
 */
class ContractModal extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      modalOpen: false,
      pastContracts: []
    };
  }

  /**
   * Component did mount
   */
  public componentDidMount = async () => {
    if (!this.props.accessToken) {
      return;
    }

    const api = new PakkasmarjaApi();
    const contractsService = api.getContractsService(this.props.accessToken.access_token);
    const contracts = await contractsService.listContracts("application/json", true, undefined, this.props.itemGroupId, undefined, "TERMINATED", undefined, 8);
    const contractsSorted = _.sortBy(contracts, (contract) => contract.year).reverse();
    const thisYear = new Date().getFullYear();
    const pastContracts = contractsSorted.filter(contract => contract.year < thisYear);
    this.setState({ pastContracts });

  }

  /**
   * Close modal
   */
  private closeModal = () => {
    this.props.closeModal();
  }

  /**
   * Render method for contract modal component
   */
  public render() {
    return (
      <View style={{ marginTop: 22 }}>
        <Modal isVisible={this.props.modalOpen}>
          <View style={styles.modalView}>
            <Grid>
              <Row style={styles.headerRow}>
                <Col><Text>Vuosi</Text></Col>
                <Col><Text>Sovittu määrä (kg)</Text></Col>
                <Col><Text>Toteutunut määrä (kg)</Text></Col>
              </Row>
              {
                this.state.pastContracts.map((contract) => {
                  return (
                    <Row key={contract.itemGroupId}>
                      <Col><Text>{contract.year}</Text></Col>
                      <Col><Text>{contract.contractQuantity}</Text></Col>
                      <Col><Text>{contract.deliveredQuantity}</Text></Col>
                    </Row>
                  );
                })
              }
            </Grid>
            <TouchableOpacity style={styles.bigRedButton} onPress={this.closeModal}>
              <Text style={styles.buttonText}>Sulje</Text>
            </TouchableOpacity>
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

export default connect(mapStateToProps, mapDispatchToProps)(ContractModal);