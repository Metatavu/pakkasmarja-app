import React, { Dispatch } from "react";
import { ItemGroup, Contact, Price, ContractModel, AccessToken, StoreState } from "../../../types";
import { Text, Form, Item, Input, Label } from "native-base";
import { View, TouchableOpacity, TouchableHighlight,Alert } from "react-native";
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
export interface Props {
  modalOpen: boolean,
  itemGroupId?: string,
  pastContracts: boolean
  accessToken?: AccessToken,
  closeModal: () => void
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
      this.setState({contracts: pastContracts});
    } else {
      this.setState({contracts: contracts});
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
    return (
      <View>
        <Modal isVisible={this.props.modalOpen} style={{backgroundColor: "#fff", padding: 10}}>
          <View>
            <TouchableOpacity style={{marginBottom: 10}} onPress={this.closeModal}>
              <Text>Sulje</Text>
            </TouchableOpacity>
            <Grid>
              <Row>
                <Col><Text>Vuosi</Text></Col>
                <Col><Text>Sovittu määrä (kg)</Text></Col>
                <Col><Text>Toteutunut määrä (kg)</Text></Col>
              </Row>
              {
                this.state.contracts.map((contract) => {
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