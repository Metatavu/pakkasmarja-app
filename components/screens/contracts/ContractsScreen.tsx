import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, ContractTableData } from "../../../types";
import * as actions from "../../../actions";
import { Text } from "native-base";
import { View, ActivityIndicator, Alert, TouchableHighlight } from "react-native";
import { Contract, Contact, ItemGroupPrice, ItemGroup, DeliveryPlace } from "pakkasmarja-client";
import PakkasmarjaApi from "../../../api";
import ContractAmountTable from "./ContractAmountTable";
import ContractProposalModal from "./ContractProposalModal";
import { styles } from "./styles";
import AppConfig from "../../../utils/AppConfig";
import BasicLayout from "../../layout/BasicLayout";
import Chat from "../../fragments/chats/Chat";
import Icon from "react-native-vector-icons/Feather";
import { StackNavigationOptions } from "@react-navigation/stack";

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
  prices?: ItemGroupPrice[],
  deliveryPlaces?: DeliveryPlace[],
  proposeContractModalOpen: boolean,
  proposeContractModalType: string,
  selectedBerry?: string,
  proposedContractQuantity: string,
  proposedContractQuantityComment: string,
  contractProposalChatThreadId?: number
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
      proposedContractQuantity: "",
      proposedContractQuantityComment: "",
      loading: false
    };
  }

  /**
   * Returns navigation options
   *
   * @param navigation navigation object
   */
  private navigationOptions = (navigation: any): StackNavigationOptions => {
    return {
      headerStyle: {
        height: 100,
        backgroundColor: "#E51D2A"
      },
      headerTitle: () => (
        <TopBar
          navigation={ navigation }
          showHeader={ false }
          showMenu
          showUser
        />
      ),
      headerTitleContainerStyle: {
        left: 0
      },
      headerLeft: () => (
        <TouchableHighlight onPress={ navigation.goBack }>
          <Icon
            name='chevron-left'
            color='#fff'
            size={40}
            style={{ marginLeft: 30 }}
          />
        </TouchableHighlight>
      )
    }
  };

  /**
   * Component did mount life-cycle event
   */
  public componentDidMount = async () => {
    const { navigation } = this.props;

    navigation.setOptions(this.navigationOptions(navigation));
    navigation.addListener("willFocus", this.loadData);
    await this.loadData();
  }

  /**
   * Load data
   */
  private loadData = async () => {
    const { accessToken } = this.props;

    if (!accessToken) {
      return;
    }

    this.setState({ loading: true });

    const contractsService = new PakkasmarjaApi().getContractsService(accessToken.access_token);
    const itemGroupsService = new PakkasmarjaApi().getItemGroupsService(accessToken.access_token);
    const frozenContracts = await contractsService.listContracts("application/json", false, "FROZEN", undefined, undefined, undefined, undefined, 100);
    const freshContracts = await contractsService.listContracts("application/json", false, "FRESH", undefined, undefined, undefined, undefined, 100);
    const itemGroups = await itemGroupsService.listItemGroups();

    const frozenContractTableData = frozenContracts.map(frozenContract => ({
      contract: frozenContract,
      itemGroup: itemGroups.find(itemGroup => itemGroup.id === frozenContract.itemGroupId)
    }));

    const freshContractTableData = freshContracts.map(freshContract => ({
      contract: freshContract,
      itemGroup: itemGroups.find(itemGroup => itemGroup.id === freshContract.itemGroupId)
    }));

    this.setState({
      loading: false,
      freshContracts: freshContractTableData,
      frozenContracts: frozenContractTableData,
      itemGroups: itemGroups,
      selectedBerry: itemGroups[0]?.id
    });
  }

  /**
   * Find contract contact
   *
   * @param contract contract
   */
  private loadContractContact = async (contract: Contract) => {
    const { accessToken } = this.props;

    if (!accessToken || !contract.contactId) {
      return;
    }

    const contact = await new PakkasmarjaApi()
      .getContactsService(accessToken.access_token)
      .findContact(contract.contactId);
    this.setState({ contact: contact });
  }

  /**
   * load prices
   *
   * @param contract contract
   */
  private loadPrices = async (contract: Contract) => {
    const { accessToken } = this.props;

    if (!accessToken || !contract.itemGroupId) {
      return;
    }

    const prices = await new PakkasmarjaApi()
      .getItemGroupsService(accessToken.access_token)
      .listItemGroupPrices(contract.itemGroupId);

    this.setState({ prices: prices });
  }

  /**
   * Get item group
   *
   * @param itemGroupId itemGroupId
   */
  private findItemGroupById = async (itemGroupId: string) => {
    const { accessToken } = this.props;

    if (!accessToken) {
      return;
    }

    return await new PakkasmarjaApi()
      .getItemGroupsService(accessToken.access_token)
      .findItemGroup(itemGroupId);
  }

  /**
   * Get delivery places
   */
  private loadDeliveryPlaces = async () => {
    const { accessToken } = this.props;

    if (!accessToken) {
      return;
    }

    const deliveryPlaces = await new PakkasmarjaApi()
      .getDeliveryPlacesService(accessToken.access_token)
      .listDeliveryPlaces();

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
      [{ text: 'OK', onPress: () => { } }]
    );
  }

  /**
   * Handle contract click
   *
   * @param contract contract
   */
  private handleContractClick = async (contract: Contract) => {
    const { navigation } = this.props;
    const { contact, prices, deliveryPlaces } = this.state;

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

    navigation.navigate('Contract', {
      contact: contact,
      itemGroup: itemGroup,
      prices: prices,
      contract: contract,
      deliveryPlaces: deliveryPlaces
    });
  }

  /**
   * On propose new contract clicked
   *
   * @param type type
   */
  private onProposeNewContractClick = async (type: string) => {
    this.setState({
      proposeContractModalOpen: true,
      proposeContractModalType: type
    });
  }

  /**
   * On contract proposal clicked
   */
  private onContractProposalClick = async () => {
    const { accessToken } = this.props;

    const appConfig = await AppConfig.getAppConfig();
    const questionGroupId = appConfig['contracts-question-group'];

    if (!questionGroupId || !accessToken) {
      return
    }

    this.setState({ loading: true });

    const api = new PakkasmarjaApi();
    const questionGroupThreads = await api
      .getChatThreadsService(accessToken.access_token)
      .listChatThreads(questionGroupId, "QUESTION", accessToken.userId);

    if (questionGroupThreads.length != 1) {
      console.warn("No question group threads found"); //Application is misconfigured, bail out.
      return;
    }

    const contents = this.getProposalMessageContents();

    if (!contents) {
      return;
    }

    await api.getChatMessagesService(accessToken.access_token).createChatMessage({
      contents: contents,
      threadId: questionGroupThreads[0].id!,
      userId: accessToken.userId
    }, questionGroupThreads[0].id!);

    this.setState({
      contractProposalChatThreadId: questionGroupThreads[0].id,
      loading: false
    });
  }

  /**
   * Gets message to use for suggesting new contract
   */
  private getProposalMessageContents = (): string | null => {
    const {
      itemGroups,
      selectedBerry,
      proposedContractQuantity,
      proposedContractQuantityComment
    } = this.state;

    const itemGroup = itemGroups.find(itemGroup => itemGroup.id === selectedBerry);

    if (!itemGroup) {
      Alert.alert(
        'Marjaa ei löytynyt',
        `Valittua marjaa ei löytynyt tietokannasta, ota yhteyttä Pakkasmarjaan sopimuksesi tekemiseen.`,
        [
          { text: 'OK', onPress: () => { } },
        ]
      );
      return null;
    }

    let message = `Hei, haluaisin ehdottaa uutta sopimusta marjasta: ${itemGroup.displayName}`;

    if (proposedContractQuantity) {
      message += `
      Määräarvio on ${proposedContractQuantity} kg.`;
    }

    if (proposedContractQuantityComment) {
      message += `
      Lisätietoa: ${proposedContractQuantityComment}`;
    }

    return message;
  }

  /**
   * Render method
   */
  public render() {
    const { navigation } = this.props;
    const {
      loading,
      contractProposalChatThreadId,
      frozenContracts,
      freshContracts,
      proposeContractModalOpen,
      itemGroups,
      proposedContractQuantityComment,
      selectedBerry,
      proposedContractQuantity
    } = this.state;

    if (loading) {
      return (
        <View style={ styles.loaderContainer }>
          <ActivityIndicator size="large" color="#E51D2A" />
        </View>
      );
    }

    if (contractProposalChatThreadId) {
      return (
        <BasicLayout navigation={ navigation }>
          <Chat
            conversationType="QUESTION"
            onBackClick={ () => this.setState({ contractProposalChatThreadId: undefined }) }
            threadId={ contractProposalChatThreadId }
          />
        </BasicLayout>
      );
    }

    return (
      <BasicScrollLayout
        navigation={ navigation }
        backgroundColor="#fff"
        displayFooter
      >
        <View style={ styles.headerView }>
          <Text style={ styles.headerText }>
            Viljely- ja ostosopimukset
          </Text>
        </View>
        <View>
          <View style={ styles.titleView }>
            <Text style={ styles.titleText }>
              Pakastemarjat
            </Text>
          </View>
          <ContractAmountTable
            onContractClick={ this.handleContractClick }
            contractTableDatas={ frozenContracts }
            type="FROZEN"
            onProposeNewContractClick={ this.onProposeNewContractClick }
          />
        </View>
        <View>
          <View style={ styles.titleView }>
            <Text style={ styles.titleText }>
              Tuoremarjat
            </Text>
          </View>
          <ContractAmountTable
            onContractClick={ this.handleContractClick }
            contractTableDatas={ freshContracts }
            type="FRESH"
            onProposeNewContractClick={ this.onProposeNewContractClick }
          />
        </View>
        <ContractProposalModal
          modalOpen={ proposeContractModalOpen }
          itemGroups={ itemGroups }
          closeModal={() => this.setState({ proposeContractModalOpen: false })}
          onSelectedBerryChange={ value => this.setState({ selectedBerry: value }) }
          onQuantityChange={ value => this.setState({ proposedContractQuantity: value }) }
          onQuantityCommentChange={ value => this.setState({ proposedContractQuantityComment: value }) }
          quantityComment={ proposedContractQuantityComment }
          selectedBerry={ selectedBerry || "" }
          quantity={ proposedContractQuantity }
          sendContractProposalClicked={ this.onContractProposalClick }
        />
      </BasicScrollLayout>
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
