import React, { Dispatch } from "react";
import { AccessToken, StoreState } from "../../../types";
import { Text } from "native-base";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import Modal from "react-native-modal";
import { Contract } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import * as actions from "../../../actions";
import { connect } from "react-redux";

/**
 * Interface for component props
 */
interface Props {
  modalOpen: boolean,
  itemGroupId?: string,
  pastContracts: boolean
  accessToken?: AccessToken,
  closeModal: () => void,
  styles?: any
};

/**
 * Interface for component state
 */
interface State {
  modalOpen: boolean,
  contracts: Contract[]
};

class ContractModal extends React.Component<Props, State> {
  /**
   * Constructor
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      modalOpen: false,
      contracts: []
    };
  }

  /**
   * Component did mount
   */
  public componentDidMount = async () => {
    if (!this.props.accessToken) {
      return;
    }

    const api = new PakkasmarjaApi(`${REACT_APP_API_URL}/rest/v1`);
    const contractsService = api.getContractsService(this.props.accessToken.access_token);

    const contracts = await contractsService.listContracts("application/json", true, undefined, this.props.itemGroupId);

    if (this.props.pastContracts) {
      const thisYear = new Date().getFullYear();
      const pastContracts = contracts.filter(contract => contract.year < thisYear);
      this.setState({ contracts: pastContracts });
    } else {
      this.setState({ contracts: contracts });
    }
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
    const styles = StyleSheet.create({
      BlueContentView: {
        height: "50%",
        padding: 15,
        backgroundColor: "#dae7fa",
        paddingBottom: 20,
        marginBottom: 15
      },
      headerRow: {
        paddingBottom: 20,
        marginBottom: 10,
        borderBottomColor: "#000000",
        borderBottomWidth: 1
      },
      row: {
        paddingBottom: 5,
        paddingTop: 5,
      },
      modalButton: {
        width: "100%",
        height: 40,
        backgroundColor: "#e01e36",
        justifyContent: "center",
        alignItems: "center",
      },
      buttonText:{
        color:"white",
        fontWeight:"bold",
        fontSize:26
      }
    });
    return (
      <View style={{ marginTop: 22 }}>
        <Modal isVisible={this.props.modalOpen} style={{ height: "60%" }}>
          <View style={styles.BlueContentView}>
            <Grid>
              <Row style={styles.headerRow}>
                <Col><Text>Vuosi</Text></Col>
                <Col><Text>Sovittu määrä (kg)</Text></Col>
                <Col><Text>Toteutunut määrä (kg)</Text></Col>
              </Row>
              {
                this.state.contracts.map((contract) => {
                  return (
                    <Row style={styles.row} key={contract.itemGroupId}>
                      <Col><Text>{contract.year}</Text></Col>
                      <Col><Text>{contract.contractQuantity}</Text></Col>
                      <Col><Text>{contract.deliveredQuantity}</Text></Col>
                    </Row>
                  );
                })
              }
            </Grid>
            <TouchableOpacity style={styles.modalButton} onPress={this.closeModal}>
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