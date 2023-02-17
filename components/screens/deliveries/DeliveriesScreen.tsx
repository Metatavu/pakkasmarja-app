import React, { Dispatch } from "react";
import { connect } from "react-redux";
import BasicScrollLayout from "../../layout/BasicScrollLayout";
import TopBar from "../../layout/TopBar";
import { AccessToken, StoreState, DeliveriesState, DeliveryProduct } from "../../../types";
import * as actions from "../../../actions";
import { Tabs, Tab, Thumbnail, DefaultTabBar } from "native-base";
import { TouchableOpacity, Image, View, Text, TouchableHighlight, Dimensions } from "react-native";
import { styles } from "./styles.tsx";
import PakkasmarjaApi from "../../../api";
import { RED_LOGO, INCOMING_DELIVERIES_LOGO, COMPLETED_DELIVERIES_LOGO, FRESH_ICON, FROZEN_ICON } from "../../../static/images";
import { Delivery, ItemGroupCategory, DeliveryPlace, DeliveryStatus } from "pakkasmarja-client";
import FeatherIcon from "react-native-vector-icons/Feather";
import BasicLayout from "../../layout/BasicLayout";
import strings from "../../../localization/strings";
import _ from "lodash";
import { StackNavigationOptions } from "@react-navigation/stack";

/**
 * Component props
 */
interface Props {
  navigation: any;
  accessToken?: AccessToken;
  deliveriesLoaded?: (deliveries: DeliveriesState) => void;
  itemGroupCategoryUpdate?: (itemGroupCategory: ItemGroupCategory) => void;
  deliveries?: DeliveriesState;
  itemGroupCategory?: ItemGroupCategory;
};

/**
 * Component state
 */
interface State {
  loading: boolean;
  deliveries: Delivery[];
  freshProposalAmount: number;
  freshPlannedAmount: number;
  frozenProposalAmount: number;
  frozenPlannedAmount: number;
  deliveriesState?: DeliveriesState;
  initialCategory?: ItemGroupCategory;
  deliveryPlaces: DeliveryPlace[];
};

/**
 * Deliveries screen component class
 */
class DeliveriesScreen extends React.Component<Props, State> {

  private refreshInterval: any;

  private navigationFocusEventSubscription: any;

  /**
   * Constructor
   *
   * @param props props
   */
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: false,
      deliveries: [],
      freshProposalAmount: 0,
      freshPlannedAmount: 0,
      frozenProposalAmount: 0,
      frozenPlannedAmount: 0,
      deliveryPlaces: []
    };
  }

  /**
   * Returns navigation options
   *
   * @param navigation navigation object
   */
  private navigationOptions = (navigation: any): StackNavigationOptions => ({
    headerStyle: {
      height: 100,
      backgroundColor: "#E51D2A"
    },
    headerTitle: () => (
      <TopBar
        navigation={ navigation }
        showMenu
        showHeader={ false }
        showUser
      />
    ),
    headerTitleStyle: { width: Dimensions.get("window").width },
    headerTitleContainerStyle: {
      left: 0
    },
    headerLeft: () => (
      <TouchableHighlight onPress={ navigation.goBack }>
        <FeatherIcon
          name="chevron-left"
          color="#fff"
          size={ 40 }
          style={{ marginLeft: 30 }}
        />
      </TouchableHighlight>
    )
  });

  /**
   * Component did mount life-cycle event
   */
  public async componentDidMount() {
    const { navigation, itemGroupCategoryUpdate } = this.props;

    navigation.setOptions(this.navigationOptions(navigation));

    if (!itemGroupCategoryUpdate) {
      return;
    }

    await Promise.all([
      this.loadDeliveriesData(),
      this.fetchDeliveryPlacesFromContract()
    ]);

    this.loadAmounts();

    this.refreshInterval = setInterval(this.refreshDeliveries, 1000 * 30);

    this.navigationFocusEventSubscription = navigation.addListener("focus", this.loadAmounts);
  }

  /**
   * Component will unmount life-cycle event
   */
  public componentWillUnmount = () => {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }

    this.props.navigation.removeListener(this.navigationFocusEventSubscription);
  }

  /**
   * Refresh deliveries
   */
  private refreshDeliveries = () => {
    this.loadDeliveriesData();
    this.loadAmounts();
  }

  /**
   * Load deliveries
   */
  private loadDeliveriesData = async () => {
    const { accessToken, deliveriesLoaded } = this.props;

    if (!accessToken) {
      return;
    }

    const api = new PakkasmarjaApi();
    const deliveriesService = api.getDeliveriesService(accessToken.access_token);
    const productsService = api.getProductsService(accessToken.access_token);

    const freshDeliveries = await deliveriesService.listDeliveries(accessToken.userId, undefined, "FRESH", undefined, undefined, undefined, undefined, undefined, 0, 10000);
    const frozenDeliveries = await deliveriesService.listDeliveries(accessToken.userId, undefined, "FROZEN", undefined, undefined, undefined, undefined, undefined, 0, 10000);
    const products = await productsService.listProducts(undefined, undefined, undefined, 0, 10000);

    const freshDeliveriesAndProducts = freshDeliveries.map(delivery => ({
      delivery: delivery,
      product: products.find(product => product.id === delivery.productId)
    }));

    const frozenDeliveriesAndProducts = frozenDeliveries.map((delivery) => ({
      delivery: delivery,
      product: products.find(product => product.id === delivery.productId)
    }));

    deliveriesLoaded && deliveriesLoaded({
      freshDeliveryData: freshDeliveriesAndProducts,
      frozenDeliveryData: frozenDeliveriesAndProducts
    });
  }

  /**
   * Fetches contract and extracts delivery place from it
   */
  private fetchDeliveryPlacesFromContract = async () => {
    const { accessToken } = this.props;

    if (!accessToken) {
      return;
    }

    const api = new PakkasmarjaApi();
    const contractsService = api.getContractsService(accessToken.access_token);
    const deliveryPlacesService = api.getDeliveryPlacesService(accessToken.access_token);
    const userContracts = await contractsService.listContracts("application/json", undefined, undefined, undefined, new Date().getFullYear());
    const uniqueDeliveryPlaceIds = _.uniq(userContracts.map(contract => contract.deliveryPlaceId));
    const deliveryPlaces = await Promise.all(uniqueDeliveryPlaceIds.map(deliveryPlacesService.findDeliveryPlace));

    this.setState({ deliveryPlaces: deliveryPlaces });
  }

  /**
   *    * load amounts
   */
  private loadAmounts = () => {
    const { deliveries } = this.props;

    if (!deliveries) {
      return;
    }

    const { freshDeliveryData, frozenDeliveryData } = deliveries;

    const freshProposals = this.filterDeliveryDataByStatus(freshDeliveryData, "PROPOSAL");
    const freshPlanned = this.filterDeliveryDataByStatus(freshDeliveryData, "PLANNED");
    const frozenProposals = this.filterDeliveryDataByStatus(frozenDeliveryData, "PROPOSAL");
    const frozenPlanned = this.filterDeliveryDataByStatus(frozenDeliveryData, "PLANNED");

    this.setState({
      freshProposalAmount: freshProposals.length,
      freshPlannedAmount: freshPlanned.length,
      frozenProposalAmount: frozenProposals.length,
      frozenPlannedAmount: frozenPlanned.length
    });
  }

  /**
   * Filters given delivery data by status
   *
   * @param data delivery data
   * @param status status
   */
  private filterDeliveryDataByStatus = (data: DeliveryProduct[], status: DeliveryStatus) => {
    return data.filter(({ delivery }) => delivery.status === status);
  }

  /**
   * Update item group category
   */
  private updateItemGroupCategory = (itemGroupCategory: ItemGroupCategory) => {
    const { accessToken, itemGroupCategoryUpdate } = this.props;
    const { initialCategory } = this.state;

    if (!accessToken) {
      return;
    }

    if (!initialCategory) {
      this.setState({ initialCategory: itemGroupCategory });
    }

    itemGroupCategoryUpdate?.(itemGroupCategory);
  }

  /**
   * On delivery item click
   *
   * @param screen screen
   * @param type type
   */
  private onDeliveryItemClick = (screen: string, itemGroupCategory: ItemGroupCategory) => {
    this.updateItemGroupCategory(itemGroupCategory);
    this.props.navigation.navigate(screen);
  }

  /**
   * Render list item
   * @param deliveryList list of deliveries
   * @param itemGroupCategory item group category
   * @returns delivery list component structure
   */
  private renderDeliveryList = (deliveryList: {}[], itemGroupCategory: ItemGroupCategory) => {
    const titleText = itemGroupCategory == "FRESH" ? strings.freshDeliveries : strings.frozenDeliveries;
    const titleIcon = itemGroupCategory == "FRESH" ? FRESH_ICON : FROZEN_ICON;

    return (
      <View style={{ flex: 1, flexDirection: "column", marginTop: 40 }}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingLeft: 60, marginBottom: 30 }}>
          <Thumbnail source={ titleIcon } style={{ height: 50, width: 50 }}/>
          <Text style={{ fontWeight: "400", fontSize: 35, color: "#000", marginLeft: 20 }}>
            { titleText }
          </Text>
        </View>
        {
          deliveryList.map((listItem: any) => {
            const plannedAmount: number = itemGroupCategory == "FRESH" ? listItem.freshPlannedAmount : listItem.frozenPlannedAmount;
            const proposalAmount: number = itemGroupCategory == "FRESH" ? listItem.freshProposalAmount : listItem.frozenProposalAmount;

            return (
              <TouchableOpacity
                key={ listItem.screen }
                onPress={ () => this.onDeliveryItemClick(listItem.screen, itemGroupCategory) }
              >
                <View
                  key={ listItem.screen }
                  style={{ width: "100%", flex: 1, flexDirection: "row", marginTop: 20, marginBottom: 20, paddingLeft: 35 }}
                >
                  <View style={{ width: 40, alignContent: "center", alignItems: "center", paddingLeft: 5, paddingRight: 5 }}>
                    <Image
                      style={{ flex: 1, width: 40, resizeMode: "contain" }}
                      source={ listItem.icon }
                    />
                  </View>
                  <View style={{ width: 300, paddingLeft: 20, flex: 1, justifyContent: "center" }}>
                    <Text style={{ fontWeight: "bold", color: "#000000", fontSize: 20 }}>
                      { listItem.name }
                    </Text>
                  </View>
                  {
                    listItem.screen == "Proposals" && proposalAmount > 0 ?
                      <View style={{ justifyContent: "center" }}>
                        <View style={ styles.roundColoredView }>
                          <Text style={ styles.roundViewText }>
                            { proposalAmount }
                          </Text>
                        </View>
                      </View>
                      :
                      null
                  }
                  {
                    listItem.screen == "IncomingDeliveries" && plannedAmount > 0 ?
                      <View style={{ justifyContent: "center" }}>
                        <View style={ styles.roundColoredView }>
                          <Text style={ styles.roundViewText }>
                            { plannedAmount }
                          </Text>
                        </View>
                      </View>
                      :
                      null
                  }
                </View>
              </TouchableOpacity>
            );
          })
        }
      </View>
    );
  }

  /**
   * Render method
   */
  public render() {
    const { accessToken, navigation, itemGroupCategory } = this.props;
    const {
      freshProposalAmount,
      freshPlannedAmount,
      frozenProposalAmount,
      frozenPlannedAmount
    } = this.state;

    const deliveryList = [{
      freshProposalAmount: freshProposalAmount,
      frozenProposalAmount: frozenProposalAmount,
      name: "Ehdotukset",
      screen: "Proposals",
      icon: RED_LOGO
    }, {
      frozenPlannedAmount: frozenPlannedAmount,
      freshPlannedAmount: freshPlannedAmount,
      name: "Tulevat toimitukset",
      screen: "IncomingDeliveries",
      icon: INCOMING_DELIVERIES_LOGO
    }, {
      name: "Tehdyt toimitukset",
      screen: "PastDeliveries",
      icon: COMPLETED_DELIVERIES_LOGO
    }];

    const canManageDeliveries = accessToken ?
      accessToken.realmRoles.indexOf("update-other-deliveries") > -1 :
      false;

    if (itemGroupCategory === undefined) {
      return (
        <BasicLayout navigation={ navigation } displayFooter>
          <View style={ styles.categorySelectionView }>
            <TouchableOpacity
              style={ styles.freshButton }
              key={ ItemGroupCategory.FRESH }
              onPress={ () => this.updateItemGroupCategory("FRESH") }
            >
              <View style={{ paddingLeft: 5, paddingRight: 5 }}>
                <Thumbnail source={ FRESH_ICON } small />
              </View>
              <Text style={ styles.categoryButtonText }>
                { strings.freshDeliveries }
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={ styles.frozenButton }
              key={ ItemGroupCategory.FROZEN }
              onPress={ () => this.updateItemGroupCategory("FROZEN") }
            >
              <View style={{ paddingLeft: 5, paddingRight: 5 }}>
                <Thumbnail source={ FROZEN_ICON } small/>
              </View>
              <Text style={ styles.categoryButtonText }>
                { strings.frozenDeliveries }
              </Text>
            </TouchableOpacity>
          </View>
        </BasicLayout>
      );
    } else {
      const initialTab = this.state.initialCategory === "FRESH" ? 0 : 1;

      return (
        <BasicScrollLayout
          navigation={ navigation }
          backgroundColor="#fff"
          displayFooter
        >
          <Tabs
            initialPage={ initialTab }
            tabBarUnderlineStyle={{ backgroundColor: "#fff" }}
            renderTabBar={ (props: any) => {
              props.tabStyle = Object.create(props.tabStyle);
              return <DefaultTabBar { ...props }/>;
            }}
          >
            <Tab
              activeTabStyle={{ ...styles.activeTab, ...styles.tab }}
              activeTextStyle={ styles.activeText }
              textStyle={{ color: "#fff" }}
              tabStyle={ styles.tab }
              heading={ strings.freshDeliveries }
            >
              { this.renderDeliveryList(deliveryList, "FRESH") }
              { canManageDeliveries &&
                <TouchableOpacity onPress={ () => this.onDeliveryItemClick("ManageDeliveries", "FRESH") }>
                  <View style={{ width: "100%", flex: 1, flexDirection: "row", marginTop: 20, marginBottom: 20, paddingLeft: 80 }}>
                    <View style={{ width: 300, paddingLeft: 20, flex: 1, justifyContent: "center" }}>
                      <Text style={{ fontWeight: "bold", color: "#000000", fontSize: 20 }}>
                        { strings.deliveryReception }
                    </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              }
            </Tab>
            <Tab
              activeTabStyle={{ ...styles.activeTab, ...styles.tab }}
              activeTextStyle={ styles.activeText }
              textStyle={{ color: "#fff" }}
              tabStyle={ styles.tab }
              heading={ strings.frozenDeliveries }
            >
              { this.renderDeliveryList(deliveryList, "FROZEN") }
              { canManageDeliveries &&
                <TouchableOpacity onPress={ () => this.onDeliveryItemClick("ManageDeliveries", "FROZEN") }>
                  <View style={{ width: "100%", flex: 1, flexDirection: "row", marginTop: 20, marginBottom: 20, paddingLeft: 80 }}>
                    <View style={{ width: 300, paddingLeft: 20, flex: 1, justifyContent: "center" }}>
                      <Text style={{ fontWeight: "bold", color: "#000000", fontSize: 20 }}>
                        { strings.deliveryReception }
                    </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              }
            </Tab>
          </Tabs>
        </BasicScrollLayout>
      );
    }
  }
}

/**
 * Redux mapper for mapping store state to component props
 *
 * @param state store state
 */
function mapStateToProps(state: StoreState) {
  return {
    accessToken: state.accessToken,
    itemGroupCategory: state.itemGroupCategory,
    deliveries: state.deliveries,
  };
}

/**
 * Redux mapper for mapping component dispatches
 *
 * @param dispatch dispatch method
 */
function mapDispatchToProps(dispatch: Dispatch<actions.AppAction>) {
  return {
    onAccessTokenUpdate: (accessToken: AccessToken) => dispatch(actions.accessTokenUpdate(accessToken)),
    itemGroupCategoryUpdate: (itemGroupCategory: ItemGroupCategory) => dispatch(actions.itemGroupCategoryUpdate(itemGroupCategory)),
    deliveriesLoaded: (deliveries: DeliveriesState) => dispatch(actions.deliveriesLoaded(deliveries))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DeliveriesScreen);
