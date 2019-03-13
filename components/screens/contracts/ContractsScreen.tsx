import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicLayout from "../../layout/BasicLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, ContractTableData } from "../../../types";
import * as actions from "../../../actions";
import { Text } from "native-base";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Contract, Contact, Price, ItemGroup, DeliveryPlace } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import ContractAmountTable from "./ContractAmountTable";
import ContractProposalModal from "./ContractProposalModal";
import { styles } from "./styles";

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
  freshContracts: ContractTableData[];
  frozenContracts: ContractTableData[];
  contact?: Contact;
  itemGroup?: ItemGroup;
  itemGroups: ItemGroup[];
  prices?: Price[],
  deliveryPlaces?: DeliveryPlace[],
  proposeContractModalOpen: boolean,
  proposeContractModalType: string,
  selectedBerry: string,
  proposedContractQuantity: string,
  proposedContractQuantityComment: string,
  loading: boolean
};

/**
 * Contracts screen component class
 */
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
      proposeContractModalOpen: false,
      proposeContractModalType: "FROZEN",
      itemGroups: [],
      selectedBerry: "",
      proposedContractQuantity: "",
      proposedContractQuantityComment: "",
      loading: false
    };
  }

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    if (!this.props.accessToken) {
      return;
    }

    this.setState({ loading: true });

    const api = new PakkasmarjaApi();
    const contractsService = api.getContractsService(this.props.accessToken.access_token);
    const frozenContracts = await contractsService.listContracts("application/json", false, "FROZEN");
    const freshContracts = await contractsService.listContracts("application/json", false, "FRESH");

    await this.loadItemGroups();

    frozenContracts.forEach((frozenContract) => {
      const frozenContractsState: ContractTableData[] = this.state.frozenContracts;
      const itemGroup = this.state.itemGroups.find(itemGroup => itemGroup.id === frozenContract.itemGroupId);
      frozenContractsState.push({
        contract: frozenContract,
        itemGroup: itemGroup
      });

      this.setState({ frozenContracts: frozenContractsState });
    });

    freshContracts.forEach((freshContract) => {
      const freshContractsState: ContractTableData[] = this.state.freshContracts;
      const itemGroup = this.state.itemGroups.find(itemGroup => itemGroup.id === freshContract.itemGroupId);
      freshContractsState.push({
        contract: freshContract,
        itemGroup: itemGroup
      });
      
      this.setState({ freshContracts: freshContractsState });
    });

    this.setState({ loading: false });
  }

  /**
   * Find contract contact
   * 
   * @param contract contract
   */
  private loadContractContact = async (contract: Contract) => {
    if (!this.props.accessToken || !contract.contactId) {
      return;
    }

    const api = new PakkasmarjaApi();
    const contactsService = api.getContactsService(this.props.accessToken.access_token);
    const contact = await contactsService.findContact(contract.contactId);
    this.setState({ contact: contact });
  }

  /**
   * load prices
   * 
   * @param contract contract
   */
  private loadPrices = async (contract: Contract) => {
    if (!this.props.accessToken || !contract.itemGroupId) {
      return;
    }

    const api = new PakkasmarjaApi();
    const contactsService = api.getItemGroupsService(this.props.accessToken.access_token);
    const prices = await contactsService.listItemGroupPrices(contract.itemGroupId);
    this.setState({ prices: prices });
  }

  /**
   * Get item group 
   * 
   * @param itemGroupId itemGroupId
   */
  private findItemGroupById = async (itemGroupId: string) => {
    if (!this.props.accessToken) {
      return;
    }

    const api = new PakkasmarjaApi();
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

    const api = new PakkasmarjaApi();
    const itemGroupService = api.getItemGroupsService(this.props.accessToken.access_token);
    const itemGroups = await itemGroupService.listItemGroups();
    this.setState({ itemGroups: itemGroups });
  }

  /**
   * Get delivery places
   */
  private loadDeliveryPlaces = async () => {
    if (!this.props.accessToken) {
      return;
    }

    const api = new PakkasmarjaApi();
    const deliveryPlacesService = api.getDeliveryPlacesService(this.props.accessToken.access_token);
    const deliveryPlaces = await deliveryPlacesService.listDeliveryPlaces();
    this.setState({ deliveryPlaces: deliveryPlaces });
  }

  /**
   * Show alert when cant open contract
   * 
   * @param status status
   */
  private displayOpenContractAlert = (status: string) => {
    let infoText = "";

    if (status === "REJECTED") {
      infoText = "Olet hylännyt tämän sopimuksen. Jos näin ei kuuluisi olla, ota yhteyttä pakkasmarjaan.";
    } else if (status === "ON_HOLD") {
      infoText = "Sopimus on pakkasmarjalla tarkistettavana.";
    }

    Alert.alert(
      'Sopimusta ei voida avata',
      infoText,
      [
        { text: 'OK', onPress: () => { } },
      ]
    );
  }

  /**
   * Handle contract click
   * 
   * @param contract contract
   */
  private handleContractClick = async (contract: Contract) => {
    if (contract.status === "REJECTED" || contract.status === "ON_HOLD" || !contract.itemGroupId) {
      this.displayOpenContractAlert(contract.status);
      return;
    }
    this.setState({ loading: true });

    await this.loadContractContact(contract);
    await this.loadPrices(contract);
    await this.loadDeliveryPlaces();
    const itemGroup = await this.findItemGroupById(contract.itemGroupId);

    this.setState({ loading: false });

    this.props.navigation.navigate('Contract', {
      contact: this.state.contact,
      itemGroup: itemGroup,
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
    />
  };

  /**
   * On propose new contract clicked
   * 
   * @param type type
   */
  private onProposeNewContractClick = async (type: string) => {
    this.setState({ proposeContractModalOpen: true, proposeContractModalType: type });
  }

  /**
   * On contract proposal clicked
   */
  private onContractProposalClick = async () => {
    //TODO: Implement when chat messages are ready
  }

  /**
   * Render method
   */
  public render() {
    if (this.state.loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }

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
            contractTableDatas={this.state.frozenContracts}
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
            contractTableDatas={this.state.freshContracts}
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
          sendContractProposalClicked={() => this.onContractProposalClick()}
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
