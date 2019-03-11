import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicLayout from "../../layout/BasicLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, ContractModel } from "../../../types";
import * as actions from "../../../actions";
import { Text } from "native-base";
import { View, TouchableHighlight } from "react-native";
//import Api from "../../../api";
import { Col, Row, Grid } from "react-native-easy-grid";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import { Contract, Contact, Address, Price, ItemGroup } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import ContractAmountTable from "./ContractAmountTable";

export interface Props {
  navigation: any,
  accessToken?: AccessToken
};

interface State {
  freshContracts: Contract[];
  frozenContracts: Contract[];
  contact?: Contact;
  itemGroup?: ItemGroup;
  prices?: Price[],
  bool: boolean;
};

class ContractsScreen extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      freshContracts: [],
      frozenContracts: [],
      bool: true
    };
  }

  /**
   * Component did mount life-cycle event
   */
  async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }

    console.log(`${REACT_APP_API_URL}/rest/v1`);
    const api = new PakkasmarjaApi(`${REACT_APP_API_URL}/rest/v1`);
    const contractsService = api.getContractsService(this.props.accessToken.access_token);
    const frozenContracts = await contractsService.listContracts("application/json", true, "FROZEN");
    const freshContracts = await contractsService.listContracts("application/json", true, "FRESH");

    this.setState({ frozenContracts: frozenContracts, freshContracts: freshContracts });
  }

  /**
   * Find contract contact
   * 
   * @param contract contract
   */
  private findContractContact = async (contract: Contract) => {
    if (!this.props.accessToken || !contract.contactId) {
      return;
    }

    const api = new PakkasmarjaApi(`${REACT_APP_API_URL}/rest/v1`);
    const contactsService = api.getContactsService(this.props.accessToken.access_token);
    const contact = await contactsService.findContact(contract.contactId);
    this.setState({ contact: contact });
  }

    /**
   * Find prices
   * 
   * @param contract contract
   */
  private findPrices = async (contract: Contract) => {
    if (!this.props.accessToken || !contract.itemGroupId) {
      return;
    }

    const api = new PakkasmarjaApi(`${REACT_APP_API_URL}/rest/v1`);
    const contactsService = api.getItemGroupsService(this.props.accessToken.access_token);
    const prices = await contactsService.listItemGroupPrices(contract.itemGroupId);
    this.setState({ prices: prices });
  }

    /**
   * Get item group 
   * 
   * @param itemGroupId itemGroupId
   */
  private getItemGroup = async (itemGroupId: any) => {
    if (!this.props.accessToken) {
      return;
    }

    const api = new PakkasmarjaApi(`${REACT_APP_API_URL}/rest/v1`);
    const itemGroupService = api.getItemGroupsService(this.props.accessToken.access_token);
    return await itemGroupService.findItemGroup(itemGroupId);
  }

  public handleContractClick = async (contract: Contract) => {
    await this.findContractContact(contract);
    await this.findPrices(contract);
    this.setState({ bool: false });
    this.props.navigation.navigate('Contract', {
      contact: this.state.contact,
      itemGroup: this.getItemGroup(contract.itemGroupId),
      prices: this.state.prices,
      contract: contract
    });
  }

  static navigationOptions = {
    headerTitle: <TopBar
      showMenu={true}
      showHeader={false}
      showUser={true}
      secondaryNavItems={[{
        "text": "Secondary 1",
        "link": "/secondary"
      }, {
        "text": "Secondary 2",
        "link": "/secondary"
      }, {
        "text": "Secondary 3",
        "link": "/secondary"
      }]}
    />
  };


  render() {
    return (
      <BasicLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>

        <View style={{ backgroundColor: "#E51D2A", padding: 10 }}>
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 25 }}>
            Viljely- ja ostosopimukset
          </Text>
        </View>

        <View>
          <View style={{ backgroundColor: "#fff", padding: 10 }}>
            <Text style={{ color: "#000000", fontWeight: "bold", fontSize: 25 }}>
              Pakastemarjat
            </Text>
          </View>
          <ContractAmountTable onContractClick={this.handleContractClick} contracts={this.state.frozenContracts} />
        </View>

        <View>
          <View style={{ backgroundColor: "#fff", padding: 10 }}>
            <Text style={{ color: "#000000", fontWeight: "bold", fontSize: 25 }}>
              Tuoremarjat
            </Text>
          </View>
          <ContractAmountTable onContractClick={this.handleContractClick} contracts={this.state.freshContracts} />
        </View>

      </BasicLayout>
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

export default connect(mapStateToProps, mapDispatchToProps)(ContractsScreen);
