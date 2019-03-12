import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicLayout from "../../layout/BasicLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState } from "../../../types";
import * as actions from "../../../actions";
import { Text } from "native-base";
import { View, StyleSheet } from "react-native";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import { Contract, Contact, Price, ItemGroup, DeliveryPlace } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import ContractAmountTable from "./ContractAmountTable";
import ContractProposalModal from "./ContractProposalModal";

/**
 * Component props
 */
interface Props {
  navigation: any,
  accessToken?: AccessToken
};

/**
 * Component state
 */
interface State {
  freshContracts: Contract[];
  frozenContracts: Contract[];
  contact?: Contact;
  itemGroup?: ItemGroup;
  itemGroups: ItemGroup[];
  prices?: Price[],
  deliveryPlaces? : DeliveryPlace[],
  proposeContractModalOpen: boolean,
  proposeContractModalType: string,
  selectedBerry: string,
  proposedContractQuantity: string,
  proposedContractQuantityComment: string
  bool: boolean;
};

class ContractsScreen extends React.Component<Props, State> {

  /**
   * Constructor
   * 
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      freshContracts: [],
      frozenContracts: [],
      bool: true,
      proposeContractModalOpen: false,
      proposeContractModalType: "FROZEN",
      itemGroups: [],
      selectedBerry: "",
      proposedContractQuantity: "",
      proposedContractQuantityComment: ""
    };
  }

  /**
   * Component did mount life-cycle event
   */
  async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }

    const api = new PakkasmarjaApi(`${REACT_APP_API_URL}/rest/v1`);
    const contractsService = api.getContractsService(this.props.accessToken.access_token);
    const frozenContracts = await contractsService.listContracts("application/json", false, "FROZEN");
    const freshContracts = await contractsService.listContracts("application/json", false, "FRESH");

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

  /**
   * Load item groups 
   * 
   * @param itemGroupId itemGroupId
   */
  private loadItemGroups = async () => {
    if (!this.props.accessToken) {
      return;
    }

    const api = new PakkasmarjaApi(`${REACT_APP_API_URL}/rest/v1`);
    const itemGroupService = api.getItemGroupsService(this.props.accessToken.access_token);
    const itemGroups = await itemGroupService.listItemGroups();
    this.setState({ itemGroups: itemGroups });
  }

  /**
   * Get delivery places
   */
  private getDeliveryPlaces = async () => {
    if (!this.props.accessToken) {
      return;
    }

    const api = new PakkasmarjaApi(`${REACT_APP_API_URL}/rest/v1`);
    const deliveryPlacesService = api.getDeliveryPlacesService(this.props.accessToken.access_token);
    const deliveryPlaces = await deliveryPlacesService.listDeliveryPlaces();
    this.setState({ deliveryPlaces: deliveryPlaces });
  }

  /**
   * Handle contract click
   * 
   * @param contract contract
   */
  public handleContractClick = async (contract: Contract) => {
    await this.findContractContact(contract);
    await this.findPrices(contract);
    await this.getDeliveryPlaces();
    
    this.setState({ bool: false });
    this.props.navigation.navigate('Contract', {
      contact: this.state.contact,
      itemGroup: await this.getItemGroup(contract.itemGroupId),
      prices: this.state.prices,
      contract: contract,
      deliveryPlaces: this.state.deliveryPlaces
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

  /**
   * On propose new contract clicked
   * 
   * @param type type
   */
  onProposeNewContractClick = async (type: string) => {
    await this.loadItemGroups();
    this.setState({ proposeContractModalOpen: true, proposeContractModalType: type });
  }

  /**
   * On contract proposal clicked
   */
  onContractProposalClick = async (type: string) => {
    //TODO: Implement when chat messages are ready
  }

  /**
   * Render method
   */
  public render() {
    const styles = StyleSheet.create({
      headerView: {
        backgroundColor: "#E51D2A",
        padding: 10
      },
      headerText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 25
      },
      titleView: {
        backgroundColor: "#fff",
        padding: 10
      },
      titleText: {
        color: "#000000",
        fontWeight: "bold",
        fontSize: 25,
        textAlign: "center"
      }
    });

    return (
      <BasicLayout navigation={this.props.navigation} backgroundColor="#fff" displayFooter={true}>
        <View style={styles.headerView}>
          <Text style={styles.headerText}>
            Viljely- ja ostosopimukset
          </Text>
        </View>
        <View>
          <View style={styles.titleView}>
            <Text style={styles.titleText}>
              Pakastemarjat
            </Text>
          </View>
          <ContractAmountTable 
            onContractClick={this.handleContractClick} 
            contracts={this.state.frozenContracts} 
            type="FROZEN"
            onProposeNewContractClick={this.onProposeNewContractClick}
          />
        </View>
        <View>
          <View style={styles.titleView}>
            <Text style={styles.titleText}>
              Tuoremarjat
            </Text>
          </View>
          <ContractAmountTable 
            onContractClick={this.handleContractClick} 
            contracts={this.state.freshContracts} 
            type="FRESH"
            onProposeNewContractClick={this.onProposeNewContractClick}
          />
        </View>
        <ContractProposalModal
          modalOpen={this.state.proposeContractModalOpen}
          itemGroups={this.state.itemGroups}
          closeModal={() => this.setState({ proposeContractModalOpen: false })}
          onSelectedBerryChange={(value: string) => this.setState({ selectedBerry: value })}
          onQuantityChange={(value: string) => this.setState({ proposedContractQuantity: value })}
          onQuantityCommentChange={(value: string) => this.setState({ proposedContractQuantityComment: value })}
          quantityComment={this.state.proposedContractQuantityComment}
          selectedBerry={this.state.selectedBerry}
          quantity={this.state.proposedContractQuantity}
          sendContractProposalClicked={(type: string) => this.onContractProposalClick(type)}
        />
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
